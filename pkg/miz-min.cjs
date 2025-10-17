const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// ===================================================
// MODULE 1: CONFIGURATION
// ===================================================

async function readPackageJson() {
    try {
        const raw = await fs.readFile('package.json', 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function getMizRoot() {
    const pkg = await readPackageJson();
    if (!pkg) return process.cwd();
    const watchCommand = pkg.scripts?.watch || '';
    const match = watchCommand.match(/([\w\/.\-]+)\/miz\/[^:\s]+\.scss/);
    return match && match[1] ? path.join(process.cwd(), match[1]) : process.cwd();
}

async function getPathsConfig(projectType = 'default') {
    const mizRoot = await getMizRoot();
    const configs = {
        laravel: {
            textFile: 'classes.txt',
            cssFile: path.join('public', 'assets', 'css', 'miz-clean.css'),
            outputFile: path.join('public', 'assets', 'css', 'miz.min.css'),
        },
        react: {
            textFile: 'classes.txt',
            cssFile: path.join('src', 'assets', 'css', 'miz-clean.css'),
            outputFile: path.join('src', 'assets', 'css', 'miz.min.css'),
        },
        vue: {
            textFile: 'classes.txt',
            cssFile: path.join('src', 'assets', 'css', 'miz-clean.css'),
            outputFile: path.join('src', 'assets', 'css', 'miz.min.css'),
        },
        default: {
            textFile: 'classes.txt',
            cssFile: path.join('assets', 'css', 'miz-clean.css'),
            outputFile: path.join('assets', 'css', 'miz.min.css'),
        },
    };

    const cfg = configs[projectType] || configs.default;

    return {
        textFilePath: path.resolve(cfg.textFile),
        cssFilePath: path.resolve(cfg.cssFile),
        outputFilePath: path.resolve(cfg.outputFile),
        resetSassFile: path.join(mizRoot, 'miz', 'sass', 'config', '_reset.scss'),
        resetCssFilePath: path.join(mizRoot, 'miz', 'sass', 'kernel', 'responsive', 'mixins', '_reset.scss'),
    };
}

// ===================================================
// MODULE 2: FILE UTILITIES
// ===================================================

async function readIgnoreFile() {
    const ignorePath = path.resolve('.mizignore');
    try {
        const data = await fs.readFile(ignorePath, 'utf8');
        return data.split('\n').map(l => l.trim()).filter(Boolean).map(p => path.resolve(p));
    } catch {
        return [];
    }
}

function findPackageJsonDir(startDir = __dirname) {
    let dir = path.resolve(startDir);
    while (dir !== path.parse(dir).root) {
        if (fsSync.existsSync(path.join(dir, 'package.json'))) return dir;
        dir = path.dirname(dir);
    }
    return null;
}

async function findAllFiles(directory, ignoredPaths = [], validExt = ['.html', '.blade.php', '.js', '.jsx', '.vue']) {
    const results = [];
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        const resolved = path.resolve(fullPath);

        if (ignoredPaths.some(ip => resolved.startsWith(ip))) continue;

        if (entry.isDirectory()) {
            try {
                const nested = await findAllFiles(fullPath, ignoredPaths, validExt);
                results.push(...nested);
            } catch (e) {
                // ignore permission errors etc.
            }
        } else if (validExt.some(ext => fullPath.endsWith(ext))) {
            results.push(fullPath);
        }
    }

    return results;
}

// ===================================================
// MODULE 3: CLASS EXTRACTION
// ===================================================

const CLASS_PATTERNS = [
    /class\s*=\s*'([^']+)'/g,
    /class\s*=\s*"([^"]+)"/g,
    /className\s*=\s*'([^']+)'/g,
    /className\s*=\s*"([^"]+)"/g,
];

async function extractClassesFromFiles(files, projectRoot) {
    const classMap = new Map();
    for (const file of files) {
        let content;
        try {
            content = await fs.readFile(file, 'utf8');
        } catch {
            continue;
        }

        for (const pattern of CLASS_PATTERNS) {
            let m;
            while ((m = pattern.exec(content)) !== null) {
                const classes = m[1].split(/\s+/).map(c => c.trim()).filter(Boolean);
                for (const c of classes) {
                    const className = `.${c}`;
                    const rel = path.relative(projectRoot, file);
                    if (!classMap.has(className)) classMap.set(className, new Set());
                    classMap.get(className).add(rel);
                }
            }
        }
    }
    return classMap;
}

async function writeClassesFile(classMap, textFilePath) {
    const addressVar = ' (address)';
    const lines = [];
    for (const [cls, paths] of classMap.entries()) {
        for (const p of paths) {
            lines.push(`${cls}${addressVar.replace('address', p)}`);
        }
    }
    await fs.writeFile(textFilePath, lines.join('\n'), 'utf8');
}

// ===================================================
// MODULE 4: RESET HANDLING
// ===================================================

function extractResetMixinContent(scssContent) {
    const ifIndex = scssContent.indexOf('@if $reset');
    if (ifIndex === -1) return '';
    const startBraceIndex = scssContent.indexOf('{', ifIndex);
    if (startBraceIndex === -1) return '';

    let open = 1;
    let i = startBraceIndex + 1;
    while (open > 0 && i < scssContent.length) {
        if (scssContent[i] === '{') open++;
        else if (scssContent[i] === '}') open--;
        i++;
    }
    return scssContent.substring(startBraceIndex + 1, i - 1).trim() + '\n';
}

async function shouldAddResetCss(resetSassFile) {
    try {
        const sassData = await fs.readFile(resetSassFile, 'utf8');
        const match = sassData.match(/\$reset\s*:\s*(true|false)\s*;/);
        return !!(match && match[1] === 'true');
    } catch {
        return false;
    }
}

async function getResetCssContent(resetCssFilePath) {
    try {
        const raw = await fs.readFile(resetCssFilePath, 'utf8');
        return extractResetMixinContent(raw);
    } catch {
        return '';
    }
}

async function prependResetCssToOutput(outputFilePath, resetContent) {
    try {
        const existing = await fs.readFile(outputFilePath, 'utf8').catch(() => '');
        const combined = resetContent + existing;
        await fs.writeFile(outputFilePath, combined, 'utf8');
    } catch (e) {
        // ignore write errors for now but log
        console.error('Error prepending reset css:', e.message || e);
    }
}

// ===================================================
// MODULE 5: CSS PARSING HELPERS
// ===================================================

function safeSplitSelectors(selectorString) {
    const selectors = [];
    let current = '';
    let openParens = 0;
    for (let i = 0; i < selectorString.length; i++) {
        const ch = selectorString[i];
        if (ch === '(') {
            openParens++;
            current += ch;
        } else if (ch === ')') {
            openParens--;
            current += ch;
        } else if (ch === ',' && openParens === 0) {
            selectors.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) selectors.push(current.trim());
    return selectors;
}

function mergeLevel(css) {
    const ruleMap = new Map();
    const keyframesBlocks = [];
    let i = 0;

    while (i < css.length) {
        const start = css.indexOf('{', i);
        if (start === -1) break;

        const header = css.slice(i, start).trim();
        let depth = 1;
        let j = start + 1;

        while (j < css.length && depth > 0) {
            if (css[j] === '{') depth++;
            else if (css[j] === '}') depth--;
            j++;
        }

        const body = css.slice(start + 1, j - 1).trim();

        if (header.startsWith('@keyframes')) {
            keyframesBlocks.push(`${header} { ${body} }`);
        } else {
            if (!ruleMap.has(body)) ruleMap.set(body, []);
            ruleMap.get(body).push(header);
        }

        i = j;
    }

    const combined = [];
    for (const [body, selectors] of ruleMap.entries()) {
        combined.push(`${selectors.join(', ')} { ${body} }`);
    }

    return [...combined, ...keyframesBlocks].join('\n');
}

function combineDuplicateRules(css) {
    const blocks = [];
    let i = 0;

    while (i < css.length) {
        const atIndex = css.indexOf('@', i);
        if (atIndex === -1) {
            blocks.push({ type: 'normal', content: css.slice(i).trim() });
            break;
        }

        if (atIndex > i) {
            blocks.push({ type: 'normal', content: css.slice(i, atIndex).trim() });
        }

        const braceIndex = css.indexOf('{', atIndex);
        if (braceIndex === -1) break;

        let depth = 1;
        let j = braceIndex + 1;
        while (j < css.length && depth > 0) {
            if (css[j] === '{') depth++;
            else if (css[j] === '}') depth--;
            j++;
        }

        const header = css.slice(atIndex, braceIndex).trim();
        const inner = css.slice(braceIndex + 1, j - 1).trim();

        const type = header.startsWith('@keyframes') ? 'keyframes' : 'atrule';
        blocks.push({ type, header, inner });

        i = j;
    }

    const normalRules = [];
    const atRules = [];

    for (const block of blocks) {
        if (block.type === 'normal') {
            normalRules.push(block.content);
        } else if (block.type === 'keyframes') {
            atRules.push(`${block.header} { ${block.inner} }`);
        } else if (block.type === 'atrule') {
            const innerMerged = mergeLevel(block.inner); // merge فقط داخل media
            if (innerMerged.trim()) {
                atRules.push(`${block.header} { ${innerMerged} }`);
            }
        }
    }

    const mergedNormal = mergeLevel(normalRules.join('\n'));
    return [...mergedNormal ? [mergedNormal] : [], ...atRules].join('\n');
}

// ===================================================
// MODULE 6: ANIMATION / FONT MAPS
// ===================================================

function buildAnimationAndFontMaps(cssContent, classMap) {
    const animationMap = new Map();
    const fontMap = new Map();

    const rules = cssContent.split('}').map(r => r.trim()).filter(Boolean);
    for (const rule of rules) {
        const braceIndex = rule.indexOf('{');
        if (braceIndex === -1) continue;

        const selectors = rule.slice(0, braceIndex).trim();
        const body = rule.slice(braceIndex + 1).trim();

        const selectorsArr = selectors.split(',').map(s => s.trim());
        const allClasses = new Set();
        for (const sel of selectorsArr) {
            const matches = sel.match(/\.[a-zA-Z0-9_-]+/g);
            if (matches) {
                for (const m of matches) {
                    if (classMap.has(m)) allClasses.add(m);
                }
            }
        }

        if (allClasses.size === 0) continue;

        const animMatch = body.match(/animation-name\s*:\s*([^;]+);/) || body.match(/animation\s*:\s*([^;]+);/);
        if (animMatch) {
            const animNames = animMatch[1]
                .split(',')
                .map(a => a.trim().split(/\s+/)[0])
                .filter(Boolean);

            for (const cls of allClasses) {
                if (!animationMap.has(cls)) animationMap.set(cls, []);
                animationMap.get(cls).push(...animNames);
            }
        }

        const fontMatch = body.match(/font-family\s*:\s*([^;]+);/);
        if (fontMatch) {
            const fonts = fontMatch[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
            for (const cls of allClasses) {
                if (!fontMap.has(cls)) fontMap.set(cls, []);
                fontMap.get(cls).push(...fonts);
            }
        }
    }

    return { animationMap, fontMap };
}

function clsHasAnimation(cls, animationName, animationMap) {
    const arr = animationMap.get(cls) || [];
    return arr.includes(animationName);
}

// ===================================================
// MODULE 7: AT-RULE EXTRACTION & FILTERING
// ===================================================

function filterCssByClasses(cssContent, classMap) {
    const parts = cssContent.split('}').map(r => r.trim()).filter(Boolean);
    const filtered = [];
    for (const part of parts) {
        const idx = part.indexOf('{');
        if (idx === -1) continue;
        const selectors = part.slice(0, idx).trim();
        const body = part.slice(idx + 1).trim();
        const selectorsArr = safeSplitSelectors(selectors);
        const validSelectors = selectorsArr.filter(sel => {
            const classMatches = sel.match(/\.[a-zA-Z0-9_-]+/g);
            if (!classMatches) return false;
            return classMatches.every(cls => classMap.has(cls));
        });
        if (validSelectors.length > 0) {
            filtered.push(`${validSelectors.join(', ')} { ${body} }`);
        }
    }
    return filtered.join('\n');
}

function extractRootBlock(cssData) {
    const rootRegex = /:root\s*\{[^}]*\}/g;
    const roots = [];
    let m;
    while ((m = rootRegex.exec(cssData)) !== null) roots.push(m[0]);
    return roots.join('\n');
}

function extractAtBlocks(css, classMap) {
    const regex = /@(media|supports)[^{]+\{([\s\S]*?\})\s*\}/g;
    const atBlocks = [];
    let match;

    while ((match = regex.exec(css)) !== null) {
        const type = match[1];
        const condition = match[0].match(/@(media|supports)\s*([^{]+)/)[2].trim();
        const inner = match[2];
        const filtered = filterCssByClasses(inner, classMap);
        if (filtered.trim()) {
            atBlocks.push(`@${type} ${condition} {${filtered}}`);
        }
    }

    return atBlocks;
}

function extractKeyframes(cssData, classMap, animationMap) {
    const keyframesRules = [];
    const regex = /@keyframes\s+([\w-]+)\s*{/g;
    let match;

    while ((match = regex.exec(cssData)) !== null) {
        const name = match[1];
        let start = regex.lastIndex;
        let depth = 1;
        let i = start;

        while (i < cssData.length && depth > 0) {
            if (cssData[i] === '{') depth++;
            else if (cssData[i] === '}') depth--;
            i++;
        }

        const block = cssData.slice(match.index, i);
        const isUsed = Array.from(classMap.keys()).some(cls =>
            clsHasAnimation(cls, name, animationMap)
        );

        if (isUsed) keyframesRules.push(block);
    }

    return keyframesRules;
}

function extractFontFace(cssData, classMap, fontMap) {
    const fontFaceRules = [];
    const regex = /@font-face\s*{([\s\S]*?)}/g;
    let match;

    while ((match = regex.exec(cssData)) !== null) {
        const block = match[0];
        const body = match[1];

        const fontFamilyMatch = /font-family\s*:\s*['"]?([^,'";}]+)['"]?/i.exec(body);
        if (!fontFamilyMatch) continue;

        const fontName = fontFamilyMatch[1].trim();

        const isUsed = Array.from(classMap.keys()).some(cls => {
            const fonts = fontMap.get(cls) || [];
            return fonts.some(f => {
                const cleaned = f.replace(/^var\(--font-/, '').replace(/\)$/, '');
                return cleaned === fontName;
            });
        });

        if (isUsed) fontFaceRules.push(block);
    }

    return fontFaceRules;
}

function extractAtRules(cssData, classMap, animationMap, fontMap) {
    const charsetImports = cssData.match(/@(charset|import)[^;]+;/g) || [];
    const supportsMediaRules = extractAtBlocks(cssData, classMap);
    const keyframesRules = extractKeyframes(cssData, classMap, animationMap);
    const fontFaceRules = extractFontFace(cssData, classMap, fontMap);

    return [
        ...charsetImports,
        ...supportsMediaRules,
        ...keyframesRules,
        ...fontFaceRules
    ].join('\n\n');
}

// ===================================================
// MODULE 8: MAIN PROCESS
// ===================================================

async function processCssFile(projectType = 'default') {
    const paths = await getPathsConfig(projectType);

    const packageRoot = findPackageJsonDir(__dirname) || process.cwd();
    const ignoredFromFile = await readIgnoreFile();
    const ignoredResolved = ignoredFromFile.map(ip => path.resolve(packageRoot, path.relative(process.cwd(), ip)));

    const files = await findAllFiles(packageRoot, ignoredResolved);

    const classMap = await extractClassesFromFiles(files, packageRoot);
    await writeClassesFile(classMap, paths.textFilePath);

    let cssData = '';
    try {
        cssData = await fs.readFile(paths.cssFilePath, 'utf8');
    } catch (e) {
        console.error('Error reading css file:', paths.cssFilePath);
        throw e;
    }

    const { animationMap, fontMap } = buildAnimationAndFontMaps(cssData, classMap);

    const processRules = (cssContent) => {
    const results = [];

    let i = 0;
    while (i < cssContent.length) {
        const braceIndex = cssContent.indexOf('{', i);
        if (braceIndex === -1) break;

        const header = cssContent.slice(i, braceIndex).trim();
        let depth = 1;
        let j = braceIndex + 1;

        while (j < cssContent.length && depth > 0) {
            if (cssContent[j] === '{') depth++;
            else if (cssContent[j] === '}') depth--;
            j++;
        }

        const body = cssContent.slice(braceIndex + 1, j - 1).trim();

        const isAtRule = header.startsWith('@media') || header.startsWith('@supports');

        if (!isAtRule) {
            const selectorsList = safeSplitSelectors(header);
            for (const sel of selectorsList) {
                const classMatches = sel.match(/\.[a-zA-Z0-9_-]+/g);
                if (!classMatches) continue;

                if (classMatches.every(cls => classMap.has(cls))) {
                    results.push(`${sel} { ${body} }`);
                }
            }
        }

        i = j;
    }

    return results;
};


    const atRules = extractAtRules(cssData, classMap, animationMap, fontMap);
    const rootBlock = extractRootBlock(cssData);
    const normalRules = processRules(cssData);
    const outputParts = [];
    if (atRules.trim()) outputParts.push(atRules);
    if (rootBlock.trim()) outputParts.push(rootBlock);
    outputParts.push(...normalRules);

    let finalCss = combineDuplicateRules(outputParts.join('\n\n'), true);

    await fs.writeFile(paths.outputFilePath, finalCss, 'utf8');

    try {
        if (await shouldAddResetCss(paths.resetSassFile)) {
            const resetContent = await getResetCssContent(paths.resetCssFilePath);
            if (resetContent && resetContent.trim()) {
                await prependResetCssToOutput(paths.outputFilePath, resetContent);
            }
        }
    } catch (e) {
        console.error('Reset handling error:', e.message || e);
    }

    try {
        await fs.unlink(paths.cssFilePath).catch(() => { });
        await fs.unlink(paths.textFilePath).catch(() => { });
    } catch { }

    console.log('✅ miz-min is ready:', paths.outputFilePath);
}

// ===================================================
// MODULE 9: MINIFY UTILITY (optional)
// ===================================================

async function minifyCss(outputFilePath) {
    try {
        let css = await fs.readFile(outputFilePath, 'utf8');
        css = css.replace(/\s+/g, ' ');
        css = css.replace(/\/\*[\s\S]*?\*\//g, '');
        css = css.replace(/\s*([{}:;,])\s*/g, '$1');
        await fs.writeFile(outputFilePath, css, 'utf8');
        console.log('CSS file minified successfully.');
    } catch (e) {
        console.error('Minify error:', e.message || e);
    }
}

// ===================================================
// CLI EXECUTION
// ===================================================

if (require.main === module) {
    (async () => {
        const projectType = process.argv[2] || 'default';
        try {
            await processCssFile(projectType);
            const paths = await getPathsConfig(projectType);
            await minifyCss(paths.outputFilePath);
        } catch (e) {
            console.error('Error:', e.message || e);
            process.exit(1);
        }
    })();
}