#!/usr/bin/env node

/**
 * Script untuk test webhook WhatsApp API
 * Usage: node examples/webhook-test.js [webhook_url]
 */

const axios = require('axios');

// Konfigurasi
const API_BASE_URL = 'http://localhost:3000/api';
const API_KEY = 'whatsapp_api_secret_key_2024';
const WEBHOOK_URL = process.argv[2] || 'https://webhook.site/your-unique-url';

// Headers untuk request API
const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
};

async function testWebhook() {
    console.log('🧪 Testing Webhook Configuration...\n');
    
    try {
        // 1. Cek status webhook saat ini
        console.log('1️⃣ Checking current webhook status...');
        const statusResponse = await axios.get(`${API_BASE_URL}/webhook/status`, { headers });
        console.log('Current webhook status:', statusResponse.data.data);
        console.log('');
        
        // 2. Konfigurasi webhook
        console.log('2️⃣ Configuring webhook...');
        const configData = {
            url: WEBHOOK_URL,
            secret: 'my_webhook_secret_123',
            enabled: true,
            retryAttempts: 3,
            timeout: 5000
        };
        
        const configResponse = await axios.post(`${API_BASE_URL}/webhook/config`, configData, { headers });
        console.log('✅ Webhook configured:', configResponse.data);
        console.log('');
        
        // 3. Test webhook
        console.log('3️⃣ Testing webhook connection...');
        const testResponse = await axios.post(`${API_BASE_URL}/webhook/test`, {}, { headers });
        console.log('Webhook test result:', testResponse.data);
        console.log('');
        
        if (testResponse.data.success) {
            console.log('🎉 Webhook berhasil dikonfigurasi!');
            console.log('📨 Sekarang semua pesan masuk akan diteruskan ke:', WEBHOOK_URL);
        } else {
            console.log('❌ Webhook test gagal:', testResponse.data.data.error);
        }
        
    } catch (error) {
        console.error('❌ Error during webhook test:', error.response?.data || error.message);
    }
}

async function disableWebhook() {
    console.log('🛑 Disabling webhook...\n');
    
    try {
        const configData = {
            enabled: false
        };
        
        const response = await axios.post(`${API_BASE_URL}/webhook/config`, configData, { headers });
        console.log('✅ Webhook disabled:', response.data);
        
    } catch (error) {
        console.error('❌ Error disabling webhook:', error.response?.data || error.message);
    }
}

// Main function
async function main() {
    const command = process.argv[3] || 'test';
    
    if (command === 'disable') {
        await disableWebhook();
    } else if (command === 'status') {
        try {
            const response = await axios.get(`${API_BASE_URL}/webhook/status`, { headers });
            console.log('📊 Webhook Status:', response.data.data);
        } catch (error) {
            console.error('❌ Error:', error.response?.data || error.message);
        }
    } else {
        console.log('🚀 WhatsApp API Webhook Tester\n');
        console.log(`📡 Webhook URL: ${WEBHOOK_URL}\n`);
        await testWebhook();
    }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🚀 WhatsApp API Webhook Tester

Usage:
  node webhook-test.js [webhook_url] [command]

Commands:
  test     - Test webhook configuration (default)
  disable  - Disable webhook
  status   - Show webhook status

Examples:
  node webhook-test.js https://webhook.site/abc123
  node webhook-test.js https://myapi.com/webhook test
  node webhook-test.js "" disable
  node webhook-test.js "" status

Environment:
  API_BASE_URL: ${API_BASE_URL}
  API_KEY: ${API_KEY}
`);
    process.exit(0);
}

// Run
if (require.main === module) {
    main();
}

module.exports = { testWebhook, disableWebhook };
