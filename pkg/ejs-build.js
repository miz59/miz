import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = process.cwd();


const appDir = path.join(projectRoot, "app")
const pagesDir = path.join(appDir, "pages")
const componentsDir = path.join(appDir, "components")
const dataDir = path.join(appDir, "data/languages")
const outputDir = path.join(projectRoot, "output")

const excludePages = ["content.ejs"];
const excludeComponents = ["content.ejs"];

const languages = fs.readdirSync(dataDir).map((file) => file.replace(".json", ""))

const globalJSDir = path.join(appDir, "functions", "globals.js");
const globals = (await import(pathToFileURL(globalJSDir).href)).default;


// پاک کردن output
if (fs.existsSync(outputDir)) {
	fs.rmSync(outputDir, { recursive: true, force: true })
}

// =======================
// FUNCTIONS
// =======================

async function copyComponents(src, dest, data, lang) {
	fs.mkdirSync(dest, { recursive: true })

	const items = fs.readdirSync(src, { withFileTypes: true });
	// addToExcludeComponents(src, items);

	for (const item of items) {
		const srcPath = path.join(src, item.name)
		const destPath = path.join(dest, item.name)

		if (item.isDirectory()) {
			await copyComponents(srcPath, destPath, data, lang)
		} else {
			if (item.name.endsWith(".ejs")) {
				if (!excludeComponents.includes(item.name)) {
					const outputFile = destPath.replace(".ejs", ".html")
					try {
						const html = await ejs.renderFile(srcPath, { ...globals, t: data, lang }, { root: appDir })
						fs.writeFileSync(outputFile, html)
					} catch (err) {
						console.error("Error rendering component:", err)
					}
				}
			} else {
				fs.copyFileSync(srcPath, destPath)
			}
		}
	}
}

// function addToExcludeComponents(src, items) {
// 	items.forEach((item) => {
// 		if (!item.isDirectory() && item.name.endsWith("-content.ejs")) {
// 			if (!excludeComponents.includes(item.name)) {
// 				excludeComponents.push(item.name)
// 			}
// 		}
// 	})
// }

// =======================
// BUILD PAGES
// =======================

for (const lang of languages) {
	const langJsonPath = path.join(dataDir, `${lang}.json`)
	const langDataRaw = JSON.parse(fs.readFileSync(langJsonPath, "utf-8"))

	const outPagesDir = path.join(outputDir, lang, "pages")
	fs.mkdirSync(outPagesDir, { recursive: true })

	const pageFiles = fs.readdirSync(pagesDir)

	for (const file of pageFiles) {
		if (file.endsWith(".ejs") && !excludePages.includes(file)) {
			const filePath = path.join(pagesDir, file)

			try {
				const html = await ejs.renderFile(filePath, { ...globals, t: langDataRaw, lang }, { root: appDir })
				const outputFile = path.join(outPagesDir, file.replace(".ejs", ".html"))
				fs.writeFileSync(outputFile, html)
			} catch (err) {
				console.error("Error rendering page:", err)
			}
		}
	}
}

// =======================
// BUILD COMPONENTS
// =======================
for (const lang of languages) {
	const langJsonPath = path.join(dataDir, `${lang}.json`)
	const langDataRaw = JSON.parse(fs.readFileSync(langJsonPath, "utf-8"))

	const outComponentsDir = path.join(outputDir, lang, "components")
	await copyComponents(componentsDir, outComponentsDir, langDataRaw, lang)
}

console.log("✅ compile ejs completed successfully!");