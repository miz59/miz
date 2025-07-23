const fs = require('fs'); 
const path = require('path'); 

const variable = process.argv[2]; 
 
let textFilePath = ''; 
let cssFilePath = ''; 
let outputFilePath = ''; 
let fontFaceFilePath = ''; 
let resetSassFile = ''; 
 
if (variable === 'laravel') { 
    textFilePath = path.join('classes.txt'); 
    cssFilePath = path.join('public', 'assets', 'css', 'miz-clean.css'); 
    outputFilePath = path.join('public', 'assets', 'css', 'miz.min.css'); 
    fontFaceFilePath = path.join('public', 'assets', 'css', 'font-faces.css'); 
    resetSassFile = path.join('resources', 'sass', 'config', '_reset.scss'); 
} 
else if (variable === 'laravel-document') { 
    textFilePath = path.join('classes.txt'); 
    cssFilePath = path.join('public', 'assets', 'css', 'document' , 'miz-clean.css');
    outputFilePath = path.join('public', 'assets', 'css', 'document' , 'miz.min.css'); 
    fontFaceFilePath = path.join('public', 'assets', 'css', 'document' , 'font-faces.css'); 
    resetSassFile = path.join('resources', 'sass', 'document' , 'miz' , 'sass' , 'config', '_reset.scss'); 
} 
else if (variable === 'laravel-landing') { 
    textFilePath = path.join('classes.txt'); 
    cssFilePath = path.join('public', 'assets', 'css', 'landing' , 'miz-clean.css'); 
    outputFilePath = path.join('public', 'assets', 'css', 'landing' , 'miz.min.css'); 
    fontFaceFilePath = path.join('public', 'assets', 'css', 'landing' , 'font-faces.css'); 
    resetSassFile = path.join('resources', 'sass', 'landing' , 'miz' , 'sass' , 'config', '_reset.scss'); 
} 
else if (variable === 'react') { 
    textFilePath = path.join('classes.txt'); 
    cssFilePath = path.join('src', 'assets', 'css', 'miz-clean.css'); 
    outputFilePath = path.join('src', 'assets', 'css', 'miz.min.css'); 
    fontFaceFilePath = path.join('src', 'assets', 'css', 'font-faces.css'); 
    resetSassFile = path.join('src', 'sass', 'config', '_reset.scss'); 
} 
else if (variable === 'vue') { 
    textFilePath = path.join('classes.txt'); 
    cssFilePath = path.join('src', 'assets', 'css', 'miz-clean.css'); 
    outputFilePath = path.join('src', 'assets', 'css', 'miz.min.css'); 
    fontFaceFilePath = path.join('src', 'assets', 'css', 'font-faces.css'); 
    resetSassFile = path.join('src', 'sass', 'config', '_reset.scss'); 
} 
else { 
    textFilePath = path.join('classes.txt'); 
    cssFilePath = path.join('assets', 'css', 'miz-clean.css'); 
    outputFilePath = path.join('assets', 'css', 'miz.min.css'); 
    fontFaceFilePath = path.join('assets', 'css', 'font-faces.css'); 
    resetSassFile = path.join('sass', 'miz', 'sass', 'config', '_reset.scss'); 
} 
 
const extensions = ['.html', '.blade.php', '.js', '.jsx', '.vue']; 
 
const classPatterns = [ 
    /class\s*=\s*'([^']+)'/g, 
    /class\s*=\s*"([^"]+)"/g, 
    /className\s*=\s*'([^']+)'/g, 
    /className\s*=\s*"([^"]+)"/g, 
]; 
 
function readIgnoreFile() { 
    const ignoreFilePath = path.join('.mizignore'); 

    if (!fs.existsSync(ignoreFilePath)) { 
        return []; 
    } 

    try { 
        const data = fs.readFileSync(ignoreFilePath, 'utf8'); 
        return data 
            .split('\n') 
            .map(line => line.trim()) 
            .filter(line => line.length > 0); 
    } catch (err) { 
        console.error('Error reading .mizignore file:', err); 
        return []; 
    } 
} 
 
function findPackageJsonDir(startDir) {
    let dir = path.resolve(startDir);
    while (dir !== path.parse(dir).root) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return null;
}
 
function findAllFiles(directory) { 
    let filesToProcess = []; 
    const projectRoot = findPackageJsonDir(__dirname) || process.cwd();
    const ignoredPaths = readIgnoreFile().map(ignorePath => path.resolve(projectRoot, ignorePath)); 
 
    const files = fs.readdirSync(directory); 
 
    files.forEach(file => { 
        const filePath = path.join(directory, file); 
        const resolvedPath = path.resolve(filePath); 
 
        if (ignoredPaths.some(ignoredPath => resolvedPath.startsWith(ignoredPath))) { 
            return; 
        } 
 
        const stat = fs.statSync(filePath); 
        if (stat.isDirectory()) { 
            filesToProcess = filesToProcess.concat(findAllFiles(filePath)); 
        } else { 
            if (extensions.some(ext => filePath.endsWith(ext))) { 
                filesToProcess.push(filePath); 
            } 
        } 
    }); 
 
    return filesToProcess; 
} 
 
function extractFontFacesFromCSS(cssData) { 
    const fontFaceRegex = /@font-face\s*{[^}]*}/g; 
    let match; 
    let fontFaces = []; 
 
    while ((match = fontFaceRegex.exec(cssData)) !== null) { 
        fontFaces.push(match[0]); 
    } 
 
    return fontFaces.join('\n'); 
} 
 
function extractClassesFromFiles(files, projectRoot) {
    let classMap = new Map();
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        classPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    match.replace(pattern, (m, cls) => {
                        cls.split(' ').forEach(c => {
                            const className = `.${c.trim()}`;
                            const relPath = path.relative(projectRoot, file);
                            if (!classMap.has(className)) {
                                classMap.set(className, new Set());
                            }
                            classMap.get(className).add(relPath);
                        });
                    });
                });
            }
        });
    });
    return classMap;
}
 
function shouldAddResetCss() { 
    if (fs.existsSync(resetSassFile)) { 
        const sassData = fs.readFileSync(resetSassFile, 'utf8'); 
        const resetPattern = /\$reset\s*:\s*(true|false)\s*;/; 
        const match = sassData.match(resetPattern); 
        if (match && match[1] === 'true') { 
            return true; 
        } 
    } 
    return false; 
} 
 
function addResetCss() { 
    const resetCss = '*{box-sizing:border-box;}body,p,h1,h2,h3,h4,h5,h6,hr{margin:0px;}h1,h2,h3,h4,h5,h6{font-weight: normal;}li{list-style: none;}button{border:none;}ul,li{padding:0px;margin:0px;}a{text-decoration: none;color:black;}'; 
    const filePath = outputFilePath; 
 
    fs.readFile(filePath, 'utf8', (err, data) => { 
 
        const combinedContent = resetCss + (data || ''); 
 
        fs.writeFile(filePath, combinedContent, (err) => { 
            if (err) { 
                console.error('Error writing to file:', err); 
                return; 
            } 
            console.log('Content successfully prepended to file.'); 
        }); 
    }); 
} 
 
function processCssFile() { 
    if (shouldAddResetCss()) { 
        addResetCss(); 
    } 
 
    const packageJsonDir = findPackageJsonDir(__dirname);
    if (!packageJsonDir) {
        throw new Error('package.json not found in any parent directory.');
    }
    const files = findAllFiles(packageJsonDir);
    const classMap = extractClassesFromFiles(files, packageJsonDir);
    const addressVar = ' (address)';
    const classesString = Array.from(classMap.entries())
        .map(([cls, paths]) => Array.from(paths)
            .map(address => `${cls}${addressVar.replace('address', address)}`)
            .join('\n')
        )
        .join('\n');
    fs.writeFileSync(textFilePath, classesString, 'utf8');
 
    const cssData = fs.readFileSync(cssFilePath, 'utf8'); 
 
    const fontFaces = extractFontFacesFromCSS(cssData); 
 
    fs.writeFileSync(fontFaceFilePath, fontFaces, 'utf8'); 
    console.log("Font-face CSS file created successfully"); 
 
    const mediaRegex = /@media[^{]+\{([\s\S]+?})\s*}/g; 
    let match; 
    let outsideMedia = cssData.split(mediaRegex).filter((_, i) => i % 2 === 0).join(''); 
    let mediaQueries = []; 
    while ((match = mediaRegex.exec(cssData)) == null) { 
        mediaQueries.push(match[0]); 
    } 
 
    let outputCss = []; 
 
    outputCss.push(fontFaces); 
 
    const processRules = (cssContent) => { 
        let validRules = []; 
        const rules = cssContent.trim().split('}'); 
 
        rules.forEach(rule => { 
            rule = rule.trim(); 
            if (!rule) return; 
 
            const atIndex = rule.indexOf('{'); 
            const selectors = rule.substring(0, atIndex).trim(); 
            const properties = rule.substring(atIndex + 1).trim(); 
            const selectorsList = selectors.split(',').map(sel => sel.trim()); 
 
            const validSelectors = selectorsList.filter(selector => { 
                return Array.from(classMap.keys()).includes(selector); 
            }); 
 
            if (validSelectors.length > 0) { 
                validSelectors.forEach(selector => { 
                    validRules.push(`${selector} { ${properties} }`); 
                }); 
            } 
        }); 
 
        return validRules; 
    }; 
 
    outputCss.push(...processRules(outsideMedia)); 
    mediaQueries.forEach(query => { 
        const atIndex = query.indexOf('{'); 
        const mediaCondition = query.substring(0, atIndex).trim(); 
        const insideMedia = query.substring(atIndex + 1, query.length - 1); 
        const validRules = processRules(insideMedia); 
 
        if (validRules.length > 0) { 
            outputCss.push(`${mediaCondition} {`); 
            outputCss.push(...validRules); 
            outputCss.push('}'); 
        } 
    }); 
 
    const finalCss = outputCss.join('\n'); 
 
    let desiredClasses = new Set(); 
 
    try { 
        const data = fs.readFileSync(textFilePath, 'utf8'); 
        const lines = data.split('\n'); 
        lines.forEach(line => { 
            const className = line.trim(); 
            if (className) { 
                desiredClasses.add(className); 
            } 
        }); 
    } catch (err) { 
        console.error('Error reading classes file:', err); 
    }
 
    fs.writeFileSync(outputFilePath, finalCss, 'utf8'); 
    console.log("miz-min is ready"); 
 
    fs.unlink(textFilePath, (err) => { 
        if (err) { 
            console.error('Error deleting text file:', err); 
        } 
    }); 
    fs.unlink(fontFaceFilePath, (err) => { 
        if (err) { 
            console.error('Error deleting text file:', err); 
        } 
 
    }); 
    fs.unlink(cssFilePath, (err) => { 
        if (err) { 
            console.error('Error deleting text file:', err); 
        } 
    }); 
 
    minifyCss(); 
} 
 
const minifyCss = () => { 
    let cssContent = fs.readFileSync(outputFilePath, 'utf8'); 
 
    cssContent = cssContent.replace(/\s+/g, ' '); 
    cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, ''); 
    cssContent = cssContent.replace(/\s*([{}:;,])\s*/g, '$1'); 
 
    fs.writeFileSync(outputFilePath, cssContent, 'utf8'); 
    console.log('CSS file minified successfully.'); 
}; 
 
processCssFile();