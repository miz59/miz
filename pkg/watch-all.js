import chokidar from 'chokidar';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import {
    readdirSync,
    statSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
    existsSync,
} from 'fs';

async function loadConfig() {
    const configModule = await import(`../themes/config.js?update=${Date.now()}`);
    return configModule.config;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatchMode = process.argv.includes('--watch');
const projectRoot = process.cwd();

const themeDependencyPath = [
    `${projectRoot}/miz/sass/kernel/common/_aspect-ratio.scss`,
    `${projectRoot}/miz/sass/kernel/common/_opacity.scss`,
    `${projectRoot}/miz/sass/kernel/common/_z-index.scss`,
    `${projectRoot}/miz/sass/kernel/responsive/mixins/_variables.scss`,
    `${projectRoot}/miz/sass/kernel/responsive/boots/_border.scss`,
    `${projectRoot}/miz/sass/kernel/responsive/boots/_colors.scss`,
    `${projectRoot}/miz/sass/kernel/responsive/boots/_typography.scss`,
    `${projectRoot}/miz/sass/kernel/responsive/functions/_space.scss`,
    `${projectRoot}/miz/themes/_index.scss`,
]

/** 🔍 Recursively find all .js files */
function findJsFiles(dir) {
    let jsFiles = [];
    for (const file of readdirSync(dir)) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
            jsFiles = jsFiles.concat(findJsFiles(filePath));
        } else if (file.endsWith('.js')) {
            jsFiles.push(filePath);
        }
    }
    return jsFiles;
}

function mergeJsFiles(config) {
    const componentsDir = join(__dirname, '..', 'themes', config.theme, 'components');
    const jsFiles = findJsFiles(componentsDir);
    let mergedContent = '// Mizoon Theme Scripts\n// Auto-generated file\n\n';

    console.log(`🔍 Found ${jsFiles.length} JS files to merge...`);

    jsFiles.forEach((file) => {
        try {
            const content = readFileSync(file, 'utf8');
            mergedContent += `\n// File: ${relative(componentsDir, file)}\n${content}\n`;
        } catch (err) {
            console.error(`❌ Error reading file ${file}:`, err);
        }
    });

    return mergedContent;
}

function writeMergedContent(config) {
    const outputPath = join(projectRoot, config.output);
    mkdirSync(dirname(outputPath), { recursive: true });
    const content = mergeJsFiles(config);
    writeFileSync(outputPath, content);
    console.log(`💾 Merged components written to: ${config.output}`);
}

function updateUseStatements(files, config) {
    const themeDir = join(__dirname, '..', 'themes', config.theme);

    if (!existsSync(themeDir)) {
        console.warn(`⚠️ Theme directory does not exist: ${themeDir}. Skipping updateUseStatements.`);
        return;
    }

    const useRegex = /@use ["']([^"']*themes\/)([^\/]+)(\/[^"']*)["'] as \*;/g;
    const forwardRegex = /@forward ["']([^"']+)["'];/g;

    console.log(`🔧 Updating theme paths in ${files.length} files...`);

    files.forEach((filePath) => {
        try {
            const originalContent = readFileSync(filePath, 'utf8');

            let updatedContent = originalContent.replace(useRegex, (match, prefix, oldThemeName, suffix) => {
                return oldThemeName === config.theme ? match : `@use "${prefix}${config.theme}${suffix}" as *;`;
            });

            updatedContent = updatedContent.replace(forwardRegex, (match, oldForwardPath) => {
                return oldForwardPath === config.theme ? match : `@forward "${config.theme}";`;
            });

            if (originalContent !== updatedContent) {
                writeFileSync(filePath, updatedContent);
                console.log(`✅ Updated paths in: ${filePath}`);
            }
        } catch (err) {
            console.error(`❌ Error updating ${filePath}:`, err);
        }
    });
}

function runCommands() {
    const listFilesPath = `${projectRoot}/assets/vendors/mizban/commands/listFiles.js`;
    const extractVariablesPath = `${projectRoot}/assets/vendors/mizban/commands/extractVariables.js`;

    if (!existsSync(listFilesPath)) {
        return console.error(`❌ Missing file: ${listFilesPath}`);
    }

    console.log('📂 Running listFiles.js ...');
    exec(`node ${listFilesPath}`, (error) => {
        if (error) {
            return console.error(`💥 listFiles.js failed: ${error.message}`);
        }

        console.log('✅ listFiles.js completed.');

        if (!existsSync(extractVariablesPath)) {
            return console.error(`❌ Missing file: ${extractVariablesPath}`);
        }

        console.log('🪄 Running extractVariables.js ...');
        exec(`node ${extractVariablesPath}`, (error) => {
            if (error) {
                return console.error(`💥 extractVariables.js failed: ${error.message}`);
            }

            console.log('✨ extractVariables.js completed.');
            console.log('🎉 All commands finished!\n');
        });
    });
}


let watchers = [];

async function rebuildAllDynamic() {
    try {
        const config = await loadConfig();

        if (!verifyTheme(config)) {
            return;
        }

        console.log(`🔁 Rebuilding with theme: ${config.theme}`);

        updateUseStatements(themeDependencyPath, config);
        writeMergedContent(config);
        runCommands();
        restartWatchers(config);
        console.log('✅ Rebuild complete.\n');
    } catch (err) {
        console.error('❌ Error during rebuild:', err);
    }
}

function verifyTheme(config) {
    if (!config.theme || config.theme.trim() === '') {
        console.error("❌ config.theme is empty. Please provide a valid theme name.");
        return false;
    }

    const themeDir = join(__dirname, '..', 'themes', config.theme);

    if (!existsSync(themeDir)) {
        console.warn(`⚠️ Theme directory does not exist: ${themeDir}. Skipping updateUseStatements.`);
        return false;
    }

    return true;
}

function clearWatchers() {
    watchers.forEach(w => w.close());
    watchers = [];
}

// function restartWatchers(config) {
//     clearWatchers();

//     const themeBase = join(__dirname, '..', 'themes', config.theme);
//     const themeComponents = join(themeBase, 'components');
//     const configFile = join(__dirname, '..', 'themes', 'config.js');
//     const sassDir = join(__dirname, '..', '..', 'miz');

//     watchers.push(
//         // chokidar.watch(configFile, { persistent: true }).on('change', async (path) => {
//             // console.log(`⚙️ config file changed: ${path}`);
//             // await rebuildAllDynamic();
//         // }),

//         chokidar.watch(configFile, { persistent: true }).on('change', async (path) => {
//             console.log(`⚙️ config file changed: ${path}`);
//             const newConfig = await loadConfig();
//             restartWatchers(newConfig);
//             await rebuildAllDynamic();
//         }),


//         chokidar.watch(themeBase, { ignored: /(^|[\/\\])\../, persistent: true })
//             .on('change', async (path) => {
//                 if (path.endsWith('.html')) {
//                     console.log(`📄 HTML changed: ${path}`);
//                     await rebuildAllDynamic();
//                 }
//             }),

//         chokidar.watch(sassDir, { ignored: /(^|[\/\\])\../, persistent: true })
//             .on('change', async (path) => {
//                 if (path.endsWith('.scss') || path.endsWith('.sass')) {
//                     console.log(`🎨 Sass changed: ${path}`);
//                     await rebuildAllDynamic();
//                 }
//             }),

//         chokidar.watch(themeComponents, { ignored: /(^|[\/\\])\../, persistent: true })
//             .on('change', async (path) => {
//                 if (path.endsWith('.js')) {
//                     console.log(`🧩 JS component changed: ${path}`);
//                     await rebuildAllDynamic();
//                 }
//             })
//     );
// }

function restartWatchers(config) {
    clearWatchers();

    const themeBase = join(__dirname, '..', 'themes', config.theme);
    const themeComponents = join(themeBase, 'components');
    const configFile = join(__dirname, '..', 'themes', 'config.js');
    const sassDir = join(__dirname, '..', '..', 'miz');

    watchers.push(
        chokidar.watch(configFile, { persistent: true }).on('change', async (path) => {
            console.log(`⚙️ config file changed: ${path}`);
            const newConfig = await loadConfig();
            restartWatchers(newConfig);
            await rebuildAllDynamic();
        }),

        chokidar.watch(themeBase, { ignored: /(^|[\/\\])\../, persistent: true })
            .on('change', async (path) => {
                if (path.endsWith('.html')) {
                    console.log(`📄 HTML changed: ${path}`);
                    await rebuildAllDynamic();
                }
            }),

        chokidar.watch(sassDir, { ignored: /(^|[\/\\])\../, persistent: true })
            .on('change', async (path) => {
                if (path.endsWith('.scss') || path.endsWith('.sass')) {
                    console.log(`🎨 Sass changed: ${path}`);
                    await rebuildAllDynamic();
                }
            })
    );

    const componentWatcher = chokidar.watch(themeComponents, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
    });

    let isReady = false;

    componentWatcher
        .on('add', async path => {
            if (!isReady) return; // ignore initial add events
            if (path.endsWith('.js')) {
                console.log(`➕ JS file added: ${path}`);
                await rebuildAllDynamic();
            }
        })
        .on('addDir', async path => {
            if (!isReady) return; // ignore initial addDir events
            console.log(`📂 Directory added: ${path}`);
            await rebuildAllDynamic();
        })
        .on('unlink', async path => {
            if (path.endsWith('.js')) {
                console.log(`➖ JS file removed: ${path}`);
                await rebuildAllDynamic();
            }
        })
        .on('unlinkDir', async path => {
            console.log(`📁 Directory removed: ${path}`);
            await rebuildAllDynamic();
        })
        .on('change', async path => {
            if (path.endsWith('.js')) {
                console.log(`🧩 JS file changed: ${path}`);
                await rebuildAllDynamic();
            }
        })
        .on('ready', () => {
            console.log('🎯 Component watcher is ready and watching for changes...');
            isReady = true;
        });

    watchers.push(componentWatcher);
}

if (isWatchMode) {
    loadConfig().then(restartWatchers);
} else {
    console.log('🚀 Running tasks once...');
    rebuildAllDynamic();
}