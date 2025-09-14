/**
 * Contoh implementasi webhook untuk menerima pesan masuk
 * dan mengirim response otomatis
 */

const express = require('express');
const axios = require('axios');

// Konfigurasi
const WEBHOOK_PORT = 3001;
const WHATSAPP_API_URL = 'http://localhost:3000/api';
const API_KEY = 'your_secret_api_key_here';

const app = express();
app.use(express.json());

// Database sederhana untuk menyimpan conversation state
const conversations = new Map();

// Headers untuk request ke WhatsApp API
const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
};

// Helper function untuk mengirim pesan
async function sendMessage(to, message) {
    try {
        const response = await axios.post(`${WHATSAPP_API_URL}/send-message`, {
            to: to,
            message: message
        }, { headers });
        
        console.log('✅ Pesan berhasil dikirim:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error mengirim pesan:', error.response?.data || error.message);
        throw error;
    }
}

// Bot command handlers
const commands = {
    '/help': async (from) => {
        const helpText = `🤖 *Bot WhatsApp*

*Perintah yang tersedia:*
/help - Tampilkan bantuan ini
/time - Tampilkan waktu sekarang
/ping - Test koneksi bot
/quote - Dapatkan quote random
/weather [kota] - Info cuaca (contoh)

*Contoh penggunaan:*
• Ketik "/time" untuk melihat jam
• Ketik "/quote" untuk quote inspiratif
• Ketik "halo" untuk sapaan`;

        await sendMessage(from, helpText);
    },

    '/time': async (from) => {
        const now = new Date();
        const timeText = `🕐 *Waktu Sekarang*
        
${now.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
})}`;

        await sendMessage(from, timeText);
    },

    '/ping': async (from) => {
        await sendMessage(from, '🏓 Pong! Bot berfungsi dengan baik.');
    },

    '/quote': async (from) => {
        const quotes = [
            "Kesuksesan adalah perjalanan, bukan tujuan. - Ben Sweetland",
            "Masa depan milik mereka yang percaya pada keindahan mimpi mereka. - Eleanor Roosevelt",
            "Jangan takut gagal, takutlah tidak mencoba. - Unknown",
            "Hidup itu seperti fotografi, kita perlu negatif untuk mengembangkannya. - Unknown",
            "Kegagalan adalah bumbu yang memberi rasa pada kesuksesan. - Truman Capote"
        ];
        
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        await sendMessage(from, `💬 *Quote Hari Ini*\n\n"${randomQuote}"`);
    },

    '/weather': async (from, args) => {
        const city = args.join(' ') || 'Jakarta';
        // Ini contoh, dalam implementasi nyata bisa menggunakan API cuaca
        const weatherText = `🌤️ *Cuaca di ${city}*
        
Kondisi: Cerah berawan
Suhu: 28°C
Kelembaban: 65%
Angin: 10 km/h

_*Note: Ini data contoh. Integrasikan dengan API cuaca untuk data real._`;

        await sendMessage(from, weatherText);
    }
};

// Handler untuk pesan masuk
async function handleIncomingMessage(messageData) {
    const { from, message, type } = messageData;
    
    console.log(`📨 Pesan masuk dari ${from}: ${message}`);
    
    // Skip jika bukan pesan teks
    if (type !== 'conversation' && type !== 'extendedTextMessage') {
        return;
    }
    
    const text = typeof message === 'string' ? message : message.text || '';
    const lowerText = text.toLowerCase().trim();
    
    // Handle commands
    if (text.startsWith('/')) {
        const parts = text.split(' ');
        const command = parts[0];
        const args = parts.slice(1);
        
        if (commands[command]) {
            await commands[command](from, args);
            return;
        } else {
            await sendMessage(from, '❓ Perintah tidak dikenal. Ketik /help untuk melihat daftar perintah.');
            return;
        }
    }
    
    // Handle greetings
    if (lowerText.includes('halo') || lowerText.includes('hai') || lowerText.includes('hello')) {
        await sendMessage(from, `👋 Halo! Selamat datang di Bot WhatsApp.
        
Saya adalah bot otomatis yang bisa membantu Anda. Ketik /help untuk melihat apa saja yang bisa saya lakukan.`);
        return;
    }
    
    // Handle thanks
    if (lowerText.includes('terima kasih') || lowerText.includes('thanks') || lowerText.includes('makasih')) {
        await sendMessage(from, '😊 Sama-sama! Senang bisa membantu. Ada yang lain yang bisa saya bantu?');
        return;
    }
    
    // Default response
    await sendMessage(from, `🤖 Maaf, saya tidak mengerti pesan Anda: "${text}"
    
Ketik /help untuk melihat perintah yang tersedia, atau coba:
• Katakan "halo" untuk sapaan
• Gunakan perintah yang dimulai dengan "/" seperti /time atau /quote`);
}

// Webhook endpoint untuk menerima pesan dari WhatsApp API
app.post('/webhook', async (req, res) => {
    try {
        const messageData = req.body;
        console.log('📥 Webhook received:', messageData);
        
        // Process message in background
        setImmediate(() => handleIncomingMessage(messageData));
        
        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Webhook server is running' 
    });
});

// Start webhook server
app.listen(WEBHOOK_PORT, () => {
    console.log(`🌐 Webhook server running on port ${WEBHOOK_PORT}`);
    console.log(`📡 Webhook URL: http://localhost:${WEBHOOK_PORT}/webhook`);
    console.log('🤖 Bot siap menerima pesan...');
    
    // Instructions
    console.log('\n📋 Untuk menggunakan bot ini:');
    console.log('1. Pastikan WhatsApp API server berjalan di port 3000');
    console.log('2. Kirim pesan ke nomor WhatsApp yang terhubung');
    console.log('3. Bot akan otomatis merespons');
    console.log('\n💡 Perintah yang tersedia: /help, /time, /ping, /quote, /weather');
});

module.exports = app;
