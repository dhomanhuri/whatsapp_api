const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    downloadMediaMessage,
    jidDecode,
    proto,
    getContentType,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const QRCode = require('qrcode');
const config = require('../config');
const WebhookService = require('./webhookService');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.qrCode = null;
        this.isConnected = false;
        this.connectionState = 'disconnected';
        this.messageHandlers = [];
        this.sessionDir = path.resolve(config.sessionDir);
        
        // Initialize webhook service
        this.webhookService = new WebhookService();
        
        // Pastikan direktori session ada
        fs.ensureDirSync(this.sessionDir);
    }

    async initialize() {
        try {
            console.log('🚀 Menginisialisasi WhatsApp Service...');
            
            // Setup auth state
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
            
            // Setup logger yang kompatibel dengan Baileys
            const logger = {
                level: 'silent', // Bisa diubah ke 'debug', 'info', 'warn', 'error'
                trace: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
                fatal: () => {},
                child: () => logger
            };

            // Buat socket connection
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false, // Deprecated, kita handle QR sendiri
                logger: logger,
                browser: ['WhatsApp API', 'Chrome', '1.0.0']
            });

            // Event handlers
            this.sock.ev.on('connection.update', async (update) => {
                await this.handleConnectionUpdate(update);
            });

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('messages.upsert', async (m) => {
                await this.handleIncomingMessages(m);
            });

            console.log('✅ WhatsApp Service berhasil diinisialisasi');
            
        } catch (error) {
            console.error('❌ Error saat inisialisasi WhatsApp Service:', error);
            throw error;
        }
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('📱 QR Code baru tersedia');
            this.qrCode = await QRCode.toDataURL(qr);
            this.connectionState = 'qr';
        }

        if (connection === 'close') {
            this.isConnected = false;
            this.connectionState = 'disconnected';
            
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log('📱 Koneksi terputus. Alasan:', lastDisconnect?.error);
            
            if (shouldReconnect) {
                console.log('🔄 Mencoba reconnect...');
                setTimeout(() => this.initialize(), 5000);
            } else {
                console.log('🚪 Logged out. Perlu scan QR lagi.');
                this.qrCode = null;
            }
        } else if (connection === 'open') {
            this.isConnected = true;
            this.connectionState = 'connected';
            this.qrCode = null;
            console.log('✅ WhatsApp terhubung!');
        }
    }

    async handleIncomingMessages(m) {
        const messages = m.messages;
        
        for (const message of messages) {
            if (!message.key.fromMe && message.message) {
                const messageData = {
                    id: message.key.id,
                    from: message.key.remoteJid,
                    timestamp: message.messageTimestamp,
                    message: this.extractMessageContent(message),
                    type: this.getMessageType(message)
                };

                console.log('📨 Pesan masuk:', messageData);
                
                // Kirim ke webhook jika dikonfigurasi
                if (this.webhookService.enabled) {
                    try {
                        await this.webhookService.sendWebhook(messageData);
                    } catch (error) {
                        console.error('❌ Error mengirim webhook:', error);
                    }
                }
                
                // Jalankan semua message handlers
                for (const handler of this.messageHandlers) {
                    try {
                        await handler(messageData);
                    } catch (error) {
                        console.error('❌ Error di message handler:', error);
                    }
                }
            }
        }
    }

    extractMessageContent(message) {
        const messageType = getContentType(message.message);
        
        switch (messageType) {
            case 'conversation':
                return message.message.conversation;
            case 'extendedTextMessage':
                return message.message.extendedTextMessage.text;
            case 'imageMessage':
                return {
                    caption: message.message.imageMessage.caption || '',
                    mediaType: 'image'
                };
            case 'videoMessage':
                return {
                    caption: message.message.videoMessage.caption || '',
                    mediaType: 'video'
                };
            case 'audioMessage':
                return {
                    mediaType: 'audio'
                };
            case 'documentMessage':
                return {
                    fileName: message.message.documentMessage.fileName,
                    mediaType: 'document'
                };
            default:
                return messageType;
        }
    }

    getMessageType(message) {
        return getContentType(message.message);
    }

    async sendMessage(to, message, options = {}) {
        if (!this.isConnected) {
            throw new Error('WhatsApp tidak terhubung');
        }

        try {
            let jid = this.formatJid(to);
            let messageContent;

            if (typeof message === 'string') {
                messageContent = { text: message };
            } else {
                messageContent = message;
            }

            const result = await this.sock.sendMessage(jid, messageContent, options);
            
            console.log(`✅ Pesan berhasil dikirim ke ${to}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Error mengirim pesan ke ${to}:`, error);
            throw error;
        }
    }

    async sendImage(to, imagePath, caption = '') {
        if (!this.isConnected) {
            throw new Error('WhatsApp tidak terhubung');
        }

        try {
            let jid = this.formatJid(to);
            
            const result = await this.sock.sendMessage(jid, {
                image: { url: imagePath },
                caption: caption
            });
            
            console.log(`✅ Gambar berhasil dikirim ke ${to}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Error mengirim gambar ke ${to}:`, error);
            throw error;
        }
    }

    async sendDocument(to, documentPath, fileName, caption = '') {
        if (!this.isConnected) {
            throw new Error('WhatsApp tidak terhubung');
        }

        try {
            let jid = this.formatJid(to);
            
            const result = await this.sock.sendMessage(jid, {
                document: { url: documentPath },
                fileName: fileName,
                caption: caption
            });
            
            console.log(`✅ Dokumen berhasil dikirim ke ${to}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Error mengirim dokumen ke ${to}:`, error);
            throw error;
        }
    }

    formatJid(number) {
        // Format nomor telepon ke format JID WhatsApp
        if (number.includes('@g.us')) {
            return number; // Group chat
        }
        
        if (number.includes('@s.whatsapp.net')) {
            return number; // Sudah format JID
        }
        
        // Bersihkan nomor dari karakter non-digit
        let cleanNumber = number.replace(/\D/g, '');
        
        // Jika dimulai dengan 0, ganti dengan 62
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
        }
        
        // Jika tidak dimulai dengan 62, tambahkan 62
        if (!cleanNumber.startsWith('62')) {
            cleanNumber = '62' + cleanNumber;
        }
        
        return cleanNumber + '@s.whatsapp.net';
    }

    async getChats() {
        if (!this.isConnected) {
            throw new Error('WhatsApp tidak terhubung');
        }

        try {
            const chats = await this.sock.getBusinessProfile();
            return chats;
        } catch (error) {
            console.error('❌ Error mendapatkan chat list:', error);
            throw error;
        }
    }

    async logout() {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
            this.isConnected = false;
            this.connectionState = 'disconnected';
            this.qrCode = null;
            
            // Hapus session files
            await fs.remove(this.sessionDir);
            console.log('🚪 Berhasil logout dari WhatsApp');
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            connectionState: this.connectionState,
            qrCode: this.qrCode
        };
    }

    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }

    removeMessageHandler(handler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
        }
    }
}

module.exports = WhatsAppService;
