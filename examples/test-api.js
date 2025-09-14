/**
 * Script untuk testing API WhatsApp
 * Jalankan dengan: node examples/test-api.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Konfigurasi
const API_BASE_URL = 'http://localhost:3000/api';
const API_KEY = 'whatsapp_api_secret_key_2024'; // API key sesuai dengan .env
const TEST_NUMBER = '85731234852'; // Ganti dengan nomor test Anda

// Headers untuk semua request
const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
};

async function testAPI() {
    console.log('🧪 Memulai testing API WhatsApp...\n');
    
    try {
        // 1. Test status
        console.log('1️⃣ Testing status endpoint...');
        const statusResponse = await axios.get(`${API_BASE_URL}/status`, { headers });
        console.log('Status:', statusResponse.data);
        
        if (!statusResponse.data.data.isConnected) {
            console.log('⚠️ WhatsApp belum terhubung. Silakan scan QR code terlebih dahulu.');
            
            // Test QR endpoint
            console.log('\n2️⃣ Testing QR endpoint...');
            const qrResponse = await axios.get(`${API_BASE_URL}/qr`, { headers });
            
            if (qrResponse.data.data.qrCode) {
                console.log('✅ QR Code tersedia. Scan untuk melanjutkan testing.');
                return;
            }
        }
        
        console.log('✅ WhatsApp terhubung! Melanjutkan testing...\n');
        
        // 2. Test send message
        console.log('2️⃣ Testing send message...');
        const messageResponse = await axios.post(`${API_BASE_URL}/send-message`, {
            to: TEST_NUMBER,
            message: '🧪 Test pesan dari API WhatsApp! Timestamp: ' + new Date().toLocaleString()
        }, { headers });
        console.log('Send message response:', messageResponse.data);
        
        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Test send image (jika ada file test)
        console.log('\n3️⃣ Testing send image...');
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        
        if (fs.existsSync(testImagePath)) {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('to', TEST_NUMBER);
            form.append('caption', '🖼️ Test gambar dari API');
            form.append('image', fs.createReadStream(testImagePath));
            
            const imageResponse = await axios.post(`${API_BASE_URL}/send-image`, form, {
                headers: {
                    'X-API-Key': API_KEY,
                    ...form.getHeaders()
                }
            });
            console.log('Send image response:', imageResponse.data);
        } else {
            console.log('⏭️ Skip test image (file test-image.jpg tidak ditemukan)');
        }
        
        console.log('\n✅ Semua test berhasil!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.response?.data || error.message);
    }
}

// Helper untuk membuat test image
function createTestImage() {
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
        console.log('💡 Tip: Letakkan file test-image.jpg di folder examples/ untuk test upload gambar');
    }
}

// Jalankan test
if (require.main === module) {
    createTestImage();
    testAPI();
}

module.exports = { testAPI };
