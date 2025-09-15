import fs from "fs";

const data = await fs.promises.readFile("./package.json", "utf-8");
const packageJson = JSON.parse(data);

const buildMizCommand = packageJson.scripts["build-miz"];

const regex = /(?:^|[\s:"'])((?:[\w\-./]+)?)(?=\/assets\/)/g;

const matches = [];
let match;
while ((match = regex.exec(buildMizCommand)) !== null) {
    matches.push(match[1]);
}

const uniquePaths = [...new Set(matches)];

export const config = {
    theme: 'mizoon',
    output: `${uniquePaths}/assets/js/mizchin.min.js` 
};