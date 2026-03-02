const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors({ origin: '*'}));
app.use(express.json());

/* ===============================
   FILTER PRIVASI
================================ */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') return text;

    return text
        .replace(/\b(nama saya|saya bernama|aku bernama)\s+[a-zA-Z\s]+/gi, '[IDENTITAS DIHAPUS]')
        .replace(/\b\d{8,}\b/g, '[NOMOR DIHAPUS]')
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL DIHAPUS]')
        .replace(/\b(alamat saya|tinggal di)\s+.+/gi, '[ALAMAT DIHAPUS]');
}

function sanitizeMessages(messages) {
    return messages.map(m => ({
        ...m,
        content: sanitizeText(m.content)
    }));
}

/* ===============================
   CHAT ENDPOINT (AI LOCAL)
================================ */
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        const safeMessages = sanitizeMessages(messages);
        const prompt = safeMessages.map(m => m.content).join('\n');

        const response = await axios.post(
            'http://localhost:11434/api/generate',
            {
                model: 'phi3', // atau llama3
                prompt,
                stream: false
            }
        );

        res.json({
            choices: [
                {
                    message: {
                        role: 'assistant',
                        content: response.data.response
                    }
                }
            ]
        });

    } catch (error) {
        res.status(500).json({
            error: 'Gagal memproses AI lokal'
        });
    }
});

/* ===============================
   TEST
================================ */
app.get('/api/test', (req, res) => {
    res.json({ status: 'OK', message: 'AI lokal aktif' });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log('AI: LOCAL (NO API KEY)');
});