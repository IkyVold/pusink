const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://157.10.161.170:5000'
    ],
    credentials: true
}));
app.use(express.json());

/* ===============================
   FILTER PRIVASI (SERVER-SIDE)
   Tidak mengubah fungsi chatbot
================================ */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') return text;

    return text
        // Nama
        .replace(/\b(nama saya|saya bernama|aku bernama)\s+[a-zA-Z\s]+/gi, '[IDENTITAS DIHAPUS]')
        // Nomor panjang (NIM, HP, dll)
        .replace(/\b\d{8,}\b/g, '[NOMOR DIHAPUS]')
        // Email
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL DIHAPUS]')
        // Alamat sederhana
        .replace(/\b(alamat saya|tinggal di)\s+.+/gi, '[ALAMAT DIHAPUS]');
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return messages;

    return messages.map(msg => ({
        ...msg,
        content: sanitizeText(msg.content)
    }));
}

/* ===============================
   CHAT ENDPOINT (GROQ API)
================================ */
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        console.log('Request chat (RAW):', messages);

        // 🔒 FILTER PRIVASI
        const safeMessages = sanitizeMessages(messages);

        console.log('Request chat (SANITIZED):', safeMessages);

        const response = await axios.post(
    'http://127.0.0.1:11434/api/generate',
    {
        model: 'llama3.1', // atau 'phi3'
        prompt: safeMessages.map(m => m.content).join('\n'),
        stream: false
    }
);

res.json({
    reply: response.data.response
});

    } catch (error) {
        console.error('Error AI lokal:', error.message);

        res.status(500).json({
            error: {
                message: 'Terjadi kesalahan pada AI lokal',
                status: 500
            }
        });
    }
});

/* ===============================
   TEST ENDPOINT
================================ */
app.get('/api/test', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server berjalan dengan baik',
        timestamp: new Date().toISOString()
    });
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log('AI Provider: Local (Ollama)');
    console.log('Privasi: Data diproses di server internal');
});