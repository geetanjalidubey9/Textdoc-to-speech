const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { promisify } = require('util');
const gtts = require('gtts');

const app = express();
const port = 5000;

const audioDirectory = path.join(__dirname, 'audio');
const uploadDirectory = path.join(__dirname, 'uploads');

async function createDirectories() {
    try {
        await fs.mkdir(audioDirectory, { recursive: true });
        await fs.mkdir(uploadDirectory, { recursive: true });
    } catch (error) {
        console.error('Error creating directories:', error);
        process.exit(1);
    }
}

createDirectories();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001']
}));

mongoose.connect('mongodb://127.0.0.1:27017/text-to-speech', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
});

const documentSchema = new mongoose.Schema({
    content: String,
    audioUrl: String
});
const Document = mongoose.model('Document', documentSchema);

const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

async function generateAudioFile(documentId, text) {
    const audioFileName = `${documentId}.mp3`;
    const audioFilePath = path.join(audioDirectory, audioFileName);
    const speech = new gtts(text, 'en');
    await promisify(speech.save.bind(speech))(audioFilePath);
    return `/audio/${audioFileName}`;
}

app.post('/convert', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.file.originalname.endsWith('.docx')) {
            return res.status(400).json({ error: 'Unsupported file format' });
        }

        const result = await mammoth.extractRawText({ path: req.file.path });
        const text = result.value;

        if (!text) {
            return res.status(500).json({ error: 'Failed to extract text from the file' });
        }

        const document = new Document({ content: text });
        await document.save();

        const audioUrl = await generateAudioFile(document._id, text);
        document.audioUrl = audioUrl;
        await document.save();

        res.json({ audioUrl, message: 'File successfully converted and downloaded' });
    } catch (error) {
        console.error('Error handling file upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (error) {
                console.error('Error deleting uploaded file:', error);
            }
        }
    }
});

app.get('/audio/:fileName', async (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(audioDirectory, fileName);

    try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
