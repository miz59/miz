import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as cheerio from 'cheerio';

const app = express();
const PORT = 5501;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve project root so assets and miz are accessible
app.use(express.static(path.join(__dirname, '..', '..')));

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'assets', 'media', 'images'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + file.originalname;
        cb(null, unique);
    }
});

const upload = multer({ storage });

// Upload image
app.post('/upload-assets', upload.single('file'), (req, res) => {
    const url = `/assets/media/images/${req.file.filename}`;
    res.json({ data: { src: url, type: "image" } });
});

// Delete image
app.post('/delete-asset', upload.none(), (req, res) => {
    const filePath = req.body.filePath;
    const baseDir = path.join(__dirname, '..', '..', 'assets', 'media', 'images');
    const fullPath = path.join(__dirname, '..', '..', filePath);

    if (!fullPath.startsWith(baseDir)) {
        return res.status(400).send('Invalid path');
    }

    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).send('Failed to delete file');
        }
        res.send('File deleted');
    });
});

// List all images
app.get("/images", (req, res) => {
    const dir = path.join(__dirname, '..', '..', 'assets', 'media', 'images');
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ error: err.message });

        const urls = files.map(file => `/assets/media/images/${file}`);
        res.json(urls);
    });
});

// Preview images (same as list)
app.get("/preview", (req, res) => {
    const dir = path.join(__dirname, '..', '..', 'assets', 'media', 'images');
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ error: err.message });

        const urls = files.map(file => `/assets/media/images/${file}`);
        res.json(urls);
    });
});

// Save HTML file with scripts preserved
app.use(express.json({ limit: '10mb' }));

app.post("/save", upload.none(), (req, res) => {
    const { filename, html } = req.body;

    if (!filename || !html) {
        return res.status(400).json({ error: "Filename or HTML missing" });
    }

    const filePath = path.join(__dirname, '..', '..', filename);

    fs.readFile(filePath, "utf8", (err, fileContent) => {
        if (err) return res.status(500).json({ error: err.message });

        const $ = cheerio.load(fileContent, { xmlMode: false });

        // Preserve scripts
        const scripts = [];
        $("body script").each((i, el) => {
            scripts.push($.html(el));
        });

        $("body").children().not("script").remove();
        $("body").children("script").remove();

        $("body").append(html);
        scripts.forEach(scriptHtml => $("body").append(scriptHtml));

        fs.writeFile(filePath, $.html(), (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "File updated successfully" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});