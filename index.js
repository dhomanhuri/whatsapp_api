const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');

const config = require('./config');
const WhatsAppService = require('./services/whatsappService');
const apiRoutes = require('./routes/api');

class WhatsAppAPIServer {
    constructor() {
        this.app = express();
        this.whatsappService = new WhatsAppService();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
            credentials: true
        }));
        
        // Logging
        this.app.use(morgan('combined'));
        
        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Static files untuk uploads
        this.app.use('/uploads', express.static('uploads'));
        
        // Set WhatsApp service di app untuk akses dari routes
        this.app.set('whatsappService', this.whatsappService);
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: require('./package.json').version
            });
        });

        // Root endpoint dengan informasi API
        this.app.get('/', (req, res) => {
            res.json({
                name: 'WhatsApp API Server',
                version: require('./package.json').version,
                description: 'API Server untuk WhatsApp menggunakan Baileys',
                endpoints: {
                    health: 'GET /health',
                    status: 'GET /api/status',
                    qr: 'GET /api/qr',
                    sendMessage: 'POST /api/send-message',
                    sendImage: 'POST /api/send-image',
                    sendDocument: 'POST /api/send-document',
                    logout: 'POST /api/logout'
                },
                documentation: 'Lihat README.md untuk dokumentasi lengkap'
            });
        });

        // API routes
        this.app.use('/api', apiRoutes);
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint tidak ditemukan'
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('❌ Server Error:', err);
            
            // Multer errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File terlalu besar. Maksimal 10MB.'
                });
            }
            
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'File tidak diizinkan atau field name salah.'
                });
            }

            // Default error response
            res.status(500).json({
                success: false,
                message: config.nodeEnv === 'development' ? err.message : 'Internal Server Error',
                ...(config.nodeEnv === 'development' && { stack: err.stack })
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('❌ Uncaught Exception:', err);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received. Shutting down gracefully...');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            console.log('🛑 SIGINT received. Shutting down gracefully...');
            this.shutdown();
        });
    }

    async setupWhatsAppHandlers() {
        // Handler untuk pesan masuk
        this.whatsappService.addMessageHandler(async (messageData) => {
            console.log('📨 Pesan diterima:', {
                from: messageData.from,
                message: messageData.message,
                type: messageData.type,
                timestamp: new Date(messageData.timestamp * 1000).toLocaleString()
            });
            
            // Di sini Anda bisa menambahkan logika untuk auto-reply
            // atau menyimpan pesan ke database
            
            // Contoh auto-reply sederhana
            if (typeof messageData.message === 'string' && 
                messageData.message.toLowerCase().includes('ping')) {
                
                try {
                    await this.whatsappService.sendMessage(
                        messageData.from, 
                        '🏓 Pong! API WhatsApp berfungsi dengan baik.'
                    );
                } catch (error) {
                    console.error('❌ Error mengirim auto-reply:', error);
                }
            }
        });
    }

    async start() {
        try {
            console.log('🚀 Memulai WhatsApp API Server...');
            
            // Pastikan direktori uploads ada
            await fs.ensureDir('./uploads');
            
            // Inisialisasi WhatsApp service
            await this.whatsappService.initialize();
            
            // Setup message handlers
            await this.setupWhatsAppHandlers();
            
            // Start HTTP server
            const server = this.app.listen(config.port, () => {
                console.log(`✅ Server berjalan di port ${config.port}`);
                console.log(`🌐 API tersedia di: http://localhost:${config.port}`);
                console.log(`📱 Untuk memulai, scan QR code di: http://localhost:${config.port}/api/qr`);
                console.log(`🔑 Gunakan API Key: ${config.apiKey}`);
            });

            this.server = server;
            
        } catch (error) {
            console.error('❌ Error memulai server:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('🔄 Menutup server...');
        
        try {
            // Tutup WhatsApp connection
            if (this.whatsappService) {
                console.log('📱 Menutup koneksi WhatsApp...');
                // Note: Tidak logout otomatis agar session tetap tersimpan
                // await this.whatsappService.logout();
            }
            
            // Tutup HTTP server
            if (this.server) {
                this.server.close(() => {
                    console.log('✅ Server berhasil ditutup');
                    process.exit(0);
                });
            }
            
        } catch (error) {
            console.error('❌ Error saat shutdown:', error);
            process.exit(1);
        }
    }
}

// Jalankan server jika file ini dijalankan langsung
if (require.main === module) {
    const server = new WhatsAppAPIServer();
    server.start();
}

module.exports = WhatsAppAPIServer;
