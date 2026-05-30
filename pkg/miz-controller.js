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
const projectRoot = process.cwd();

const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
const cleanScript = packageJson.scripts?.clean;
const lastArg = cleanScript.trim().split(/\s+/).pop();

let assetsRoot, mizRoot;

switch (lastArg) {
    case 'laravel':
        assetsRoot = join(projectRoot, 'public');
        mizRoot = join(projectRoot, 'resources');
        break;
    case 'react':
    case 'vue':
        assetsRoot = join(projectRoot, 'src');
        mizRoot = join(projectRoot, 'src');
        break;
    default:
        assetsRoot = projectRoot;
        mizRoot = projectRoot;
}

const isWatchMode = process.argv.includes('--watch');
const isBuildMode = process.argv.includes('--build');

const themeDependencyPath = [
    `${mizRoot}/miz/sass/kernel/common/_aspect-ratio.scss`,
    `${mizRoot}/miz/sass/kernel/common/_cursor.scss`,
    `${mizRoot}/miz/sass/kernel/common/_ellipsis.scss`,
    `${mizRoot}/miz/sass/kernel/common/_opacity.scss`,
    `${mizRoot}/miz/sass/kernel/common/_z-index.scss`,
    `${mizRoot}/miz/sass/kernel/responsive/mixins/_variables.scss`,
    `${mizRoot}/miz/sass/kernel/responsive/boots/_border.scss`,
    `${mizRoot}/miz/sass/kernel/responsive/boots/_colors.scss`,
    `${mizRoot}/miz/sass/kernel/responsive/boots/_typography.scss`,
    `${mizRoot}/miz/sass/kernel/responsive/functions/_space.scss`,
    `${mizRoot}/miz/themes/_index.scss`,
]

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

    let mergedContent = `// ${config.theme} Theme Scripts\n// Auto-generated file\n\n`;

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

    if (isBuildMode) {
        try {
            console.log('⚙️ Running terser for minification...');
            exec(`terser "${outputPath}" -o "${outputPath}" --compress --mangle`, { stdio: 'inherit' });
            console.log('✅ Minification complete.');
        } catch (err) {
            console.error('❌ Error during terser execution:', err.message);
        }
    }
}

function updateUseStatements(files, config) {
    const isThemeValid = verifyTheme(config);
    if(!isThemeValid) return;

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
    const listFilesPath = `${assetsRoot}/assets/vendors/mizban/commands/listFiles.js`;
    const extractVariablesPath = `${assetsRoot}/assets/vendors/mizban/commands/extractVariables.js`;

    if (!existsSync(listFilesPath)) {
        return console.error(`❌ Missing file: ${listFilesPath}`);
    }

    console.log('📂 Running listFiles.js ...');

    try {
        console.log("🚀 Running listFiles.js ...");
        exec(`node "${listFilesPath}"`, { stdio: "inherit" });
        console.log("✅ listFiles.js completed.");

        if (!existsSync(extractVariablesPath)) {
            console.error(`❌ Missing file: ${extractVariablesPath}`);
        }

        console.log("🪄 Running extractVariables.js ...");
        exec(`node "${extractVariablesPath}"`, { stdio: "inherit" });
        console.log("✨ extractVariables.js completed.");

        console.log("🎉 All commands finished!");
    } catch (error) {
        console.error(`💥 Script failed: ${error.message}`);
    }

}

let watchers = [];

function commentThemeReferences(filePaths) {
    filePaths.forEach((filePath) => {
        try {
            if (!existsSync(filePath)) return;

            let content = readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/);

            const updatedLines = lines.map(line => {
                if (!line.trim().startsWith('//') &&
                    (/^\s*@use\s*["']([^"']*themes\/[^"']*)["'](?:\s+as \*;)?/.test(line) ||
                    /^\s*@forward\s*["']([^"']+)["'];/.test(line))) {
                    return line.replace(/^(\s*)/, '$1//');
                }
                return line;
            });

            const newContent = updatedLines.join('\n');
            if (newContent !== content) {
                writeFileSync(filePath, newContent, 'utf8');
                console.log(`🪄 Commented theme references in: ${filePath}`);
            }

        } catch (err) {
            console.error(`❌ Error processing ${filePath}:`, err.message);
        }
    });
}



function restoreThemeReferences(filePaths) {
    filePaths.forEach((filePath) => {
        if (!existsSync(filePath)) return;

        let content = readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);

        const restoredLines = lines.map(line => {
            if (/^\s*\/\/\s*@use\s+/.test(line) || /^\s*\/\/\s*@forward\s+/.test(line)) {
                return line.replace(/^\s*\/\/\s*/, '');
            }
            return line;
        });

        const newContent = restoredLines.join('\n');
        if (newContent !== content) {
            writeFileSync(filePath, newContent, 'utf8');
            console.log(`🪄 Restored theme references in: ${filePath}`);
        }
    });
}


async function buildEjs() {
	return new Promise((resolve, reject) => {
		exec(`node ${join(mizRoot, 'miz', 'pkg/ejs-build.js')}`, (err, stdout, stderr) => {
			if (stderr.trim() !== "") {
				console.error(stderr)
			} else {
				console.log(stdout)
				resolve()
			}
		})
	})
}


function verifyTheme(config) {
    const themeDir = join(__dirname, '..', 'themes', config.theme);
    if (!existsSync(themeDir)) {
        console.warn(`⚠️ Theme directory not found: ${themeDir}`);
        return false;
    }

    if (!config.theme || config.theme.trim() === '' || config.theme === null) {
        console.warn('✅ Your theme has been disabled.');
        commentThemeReferences(themeDependencyPath);

        return false;
    }

    restoreThemeReferences(themeDependencyPath);

    return true;
}

async function rebuildAllDynamic() {
    try {
        const config = await loadConfig();
        const isThemeValid = verifyTheme(config);

        console.log(`🔁 Rebuilding with theme: ${config.theme || '(none)'}`);

        if (isThemeValid) {
            updateUseStatements(themeDependencyPath, config);
        }
        writeMergedContent(config);
        runCommands();
        restartWatchers(config);
        // console.log('✅ Rebuild complete.\n');
    } catch (err) {
        // console.error('❌ Error during rebuild:', err);
    }
}

function clearWatchers() {
    watchers.forEach(w => w.close());
    watchers = [];
}

function restartWatchers(config) {
    clearWatchers();

    const themeBase = join(__dirname, '..', 'themes', config.theme);
    const themeComponents = join(themeBase, 'components');
    const configFile = join(__dirname, '..', 'themes', 'config.js');
    const sassDir = join(mizRoot);
    const ejsDir = join(__dirname, '..', '..', 'app');

    watchers.push(
        chokidar.watch(configFile, { persistent: true }).on('change', async (path) => {
            console.log(`⚙️ config file changed: ${path}`);
            const newConfig = await loadConfig();
            restartWatchers(newConfig);
            await rebuildAllDynamic();
        }),

        chokidar.watch(themeBase, { ignored: /(^|[\/\\])\../, persistent: true }).on('change', async (path) => {
            if (path.endsWith('.html')) {
                console.log(`📄 HTML changed: ${path}`);
                await rebuildAllDynamic();
            }
        }),

        chokidar.watch(ejsDir, { ignored: /(^|[\/\\])\../, persistent: true }).on('change', async (path) => {
            if (path.endsWith('.ejs')) {
                console.log(`🗃️ ejs changed: ${path}`);
            } else if (path.endsWith('.json')){
                console.log(`🌐 json changed: ${path}`);
            }
            await buildEjs();
            await rebuildAllDynamic();
        }),

        chokidar.watch(sassDir, { ignored: /(^|[\/\\])\../, persistent: true }).on('change', async (path) => {
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

    componentWatcher.on('add', async path => {
            if (!isReady) return;
            if (path.endsWith('.js')) {
                console.log(`➕ JS file added: ${path}`);
                await rebuildAllDynamic();
            }
        })
        .on('addDir', async path => {
            if (!isReady) return;
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
    console.log('👀 Watch mode active...');
    loadConfig().then(restartWatchers);
} else if (isBuildMode) {
    console.log('🏗️ Build mode active...');
    (async () => {
        const config = await loadConfig();
        const isThemeValid = verifyTheme(config);

        if (isThemeValid) {
            console.log(`🔁 Building theme: ${config.theme}`);
            updateUseStatements(themeDependencyPath, config);
        } else {
            return;
        }

        writeMergedContent(config);

        const outputPath = join(projectRoot, config.output);
        console.log('⚙️ Running terser for minification...');
        exec(`terser "${outputPath}" -o "${outputPath}" --compress --mangle`, { stdio: 'inherit' });

        console.log(`✅ Build complete! Minified file created at: ${outputPath}`);
    })();
} else {
    console.log('🚀 Running tasks once...');
    rebuildAllDynamic();
}