const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class WebhookService {
    constructor() {
        this.webhookUrl = config.webhook.url;
        this.webhookSecret = config.webhook.secret;
        this.enabled = config.webhook.enabled;
        this.retryAttempts = config.webhook.retryAttempts;
        this.timeout = config.webhook.timeout;
    }

    /**
     * Generate signature untuk webhook security
     */
    generateSignature(payload, secret) {
        if (!secret) return null;
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    /**
     * Kirim webhook ke URL yang ditentukan
     */
    async sendWebhook(messageData, retryCount = 0) {
        if (!this.enabled || !this.webhookUrl) {
            console.log('🔕 Webhook disabled atau URL tidak dikonfigurasi');
            return false;
        }

        try {
            // Siapkan payload
            const payload = {
                event: 'message.received',
                timestamp: Date.now(),
                data: {
                    id: messageData.id,
                    from: messageData.from,
                    fromName: this.extractContactName(messageData.from),
                    message: messageData.message,
                    messageType: messageData.type,
                    timestamp: messageData.timestamp,
                    isGroup: messageData.from.includes('@g.us'),
                    // Metadata tambahan
                    webhookId: crypto.randomUUID(),
                    apiVersion: '1.0.0'
                }
            };

            // Generate signature jika ada secret
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'WhatsApp-API-Webhook/1.0'
            };

            if (this.webhookSecret) {
                const signature = this.generateSignature(payload, this.webhookSecret);
                headers['X-Webhook-Signature'] = `sha256=${signature}`;
                headers['X-Webhook-Secret'] = this.webhookSecret;
            }

            console.log(`📤 Mengirim webhook ke: ${this.webhookUrl}`);
            console.log(`📨 Payload:`, JSON.stringify(payload, null, 2));

            // Kirim webhook
            const response = await axios.post(this.webhookUrl, payload, {
                headers: headers,
                timeout: this.timeout,
                validateStatus: (status) => status < 500 // Retry only on 5xx errors
            });

            if (response.status >= 200 && response.status < 300) {
                console.log(`✅ Webhook berhasil dikirim (Status: ${response.status})`);
                return true;
            } else {
                console.log(`⚠️ Webhook response tidak OK (Status: ${response.status})`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.error(`❌ Error mengirim webhook (Attempt ${retryCount + 1}):`, error.message);
            
            // Retry jika masih dalam batas
            if (retryCount < this.retryAttempts - 1) {
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`🔄 Retry webhook dalam ${delay}ms...`);
                
                setTimeout(() => {
                    this.sendWebhook(messageData, retryCount + 1);
                }, delay);
            } else {
                console.error(`💥 Webhook gagal setelah ${this.retryAttempts} percobaan`);
                
                // Log ke file untuk debugging
                this.logFailedWebhook(messageData, error);
            }
            
            return false;
        }
    }

    /**
     * Ekstrak nama kontak dari JID
     */
    extractContactName(jid) {
        // Remove @s.whatsapp.net or @g.us
        const number = jid.replace(/@.*/, '');
        
        // Format ke nomor yang lebih readable
        if (number.startsWith('62')) {
            return `+${number}`;
        }
        return `+${number}`;
    }

    /**
     * Log webhook yang gagal untuk debugging
     */
    logFailedWebhook(messageData, error) {
        const logData = {
            timestamp: new Date().toISOString(),
            webhookUrl: this.webhookUrl,
            messageData: messageData,
            error: error.message,
            stack: error.stack
        };

        const fs = require('fs');
        const path = require('path');
        
        try {
            const logDir = './logs';
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            
            const logFile = path.join(logDir, 'webhook-failures.log');
            fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
        } catch (logError) {
            console.error('❌ Error menulis log webhook:', logError);
        }
    }

    /**
     * Test webhook URL
     */
    async testWebhook() {
        if (!this.webhookUrl) {
            throw new Error('Webhook URL tidak dikonfigurasi');
        }

        const testPayload = {
            event: 'webhook.test',
            timestamp: Date.now(),
            data: {
                message: 'Test webhook dari WhatsApp API',
                testId: crypto.randomUUID()
            }
        };

        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'WhatsApp-API-Webhook/1.0'
            };

            if (this.webhookSecret) {
                const signature = this.generateSignature(testPayload, this.webhookSecret);
                headers['X-Webhook-Signature'] = `sha256=${signature}`;
            }

            const response = await axios.post(this.webhookUrl, testPayload, {
                headers: headers,
                timeout: this.timeout
            });

            return {
                success: true,
                status: response.status,
                statusText: response.statusText,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update konfigurasi webhook
     */
    updateConfig(newConfig) {
        if (newConfig.url) this.webhookUrl = newConfig.url;
        if (newConfig.secret !== undefined) this.webhookSecret = newConfig.secret;
        if (newConfig.enabled !== undefined) this.enabled = newConfig.enabled;
        if (newConfig.retryAttempts) this.retryAttempts = newConfig.retryAttempts;
        if (newConfig.timeout) this.timeout = newConfig.timeout;
        
        console.log('🔧 Webhook configuration updated:', {
            url: this.webhookUrl,
            enabled: this.enabled,
            hasSecret: !!this.webhookSecret
        });
    }

    /**
     * Get status webhook
     */
    getStatus() {
        return {
            enabled: this.enabled,
            url: this.webhookUrl,
            hasSecret: !!this.webhookSecret,
            retryAttempts: this.retryAttempts,
            timeout: this.timeout
        };
    }
}

module.exports = WebhookService;
