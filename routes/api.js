const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

const router = express.Router();

// Setup multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware untuk autentikasi API
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey || apiKey !== config.apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API Key tidak valid'
        });
    }
    
    next();
};

// Middleware untuk cek koneksi WhatsApp
const checkWhatsAppConnection = (req, res, next) => {
    const whatsappService = req.app.get('whatsappService');
    
    if (!whatsappService.isConnected) {
        return res.status(400).json({
            success: false,
            message: 'WhatsApp tidak terhubung. Silakan scan QR code terlebih dahulu.'
        });
    }
    
    next();
};

// GET /api/status - Cek status koneksi WhatsApp
router.get('/status', authenticateAPI, (req, res) => {
    try {
        const whatsappService = req.app.get('whatsappService');
        const status = whatsappService.getStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mendapatkan status',
            error: error.message
        });
    }
});

// GET /api/qr - Dapatkan QR code untuk login
router.get('/qr', authenticateAPI, (req, res) => {
    try {
        const whatsappService = req.app.get('whatsappService');
        const status = whatsappService.getStatus();
        
        if (status.qrCode) {
            res.json({
                success: true,
                data: {
                    qrCode: status.qrCode,
                    message: 'Scan QR code dengan WhatsApp Anda'
                }
            });
        } else if (status.isConnected) {
            res.json({
                success: true,
                data: {
                    message: 'WhatsApp sudah terhubung'
                }
            });
        } else {
            res.json({
                success: false,
                message: 'QR code belum tersedia. Coba beberapa saat lagi.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mendapatkan QR code',
            error: error.message
        });
    }
});

// POST /api/send-message - Kirim pesan teks
router.post('/send-message', authenticateAPI, checkWhatsAppConnection, async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Parameter "to" dan "message" diperlukan'
            });
        }
        
        const whatsappService = req.app.get('whatsappService');
        const result = await whatsappService.sendMessage(to, message);
        
        res.json({
            success: true,
            data: {
                messageId: result.key.id,
                to: to,
                message: message,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengirim pesan',
            error: error.message
        });
    }
});

// POST /api/send-image - Kirim gambar
router.post('/send-image', authenticateAPI, checkWhatsAppConnection, upload.single('image'), async (req, res) => {
    try {
        const { to, caption } = req.body;
        
        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Parameter "to" diperlukan'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File gambar diperlukan'
            });
        }
        
        const whatsappService = req.app.get('whatsappService');
        const imagePath = path.resolve(req.file.path);
        
        const result = await whatsappService.sendImage(to, imagePath, caption || '');
        
        // Hapus file setelah dikirim
        fs.remove(imagePath);
        
        res.json({
            success: true,
            data: {
                messageId: result.key.id,
                to: to,
                caption: caption || '',
                timestamp: Date.now()
            }
        });
    } catch (error) {
        // Hapus file jika ada error
        if (req.file) {
            fs.remove(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error mengirim gambar',
            error: error.message
        });
    }
});

// POST /api/send-document - Kirim dokumen
router.post('/send-document', authenticateAPI, checkWhatsAppConnection, upload.single('document'), async (req, res) => {
    try {
        const { to, caption } = req.body;
        
        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Parameter "to" diperlukan'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File dokumen diperlukan'
            });
        }
        
        const whatsappService = req.app.get('whatsappService');
        const documentPath = path.resolve(req.file.path);
        const fileName = req.file.originalname;
        
        const result = await whatsappService.sendDocument(to, documentPath, fileName, caption || '');
        
        // Hapus file setelah dikirim
        fs.remove(documentPath);
        
        res.json({
            success: true,
            data: {
                messageId: result.key.id,
                to: to,
                fileName: fileName,
                caption: caption || '',
                timestamp: Date.now()
            }
        });
    } catch (error) {
        // Hapus file jika ada error
        if (req.file) {
            fs.remove(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error mengirim dokumen',
            error: error.message
        });
    }
});

// POST /api/logout - Logout dari WhatsApp
router.post('/logout', authenticateAPI, async (req, res) => {
    try {
        const whatsappService = req.app.get('whatsappService');
        await whatsappService.logout();
        
        res.json({
            success: true,
            data: {
                message: 'Berhasil logout dari WhatsApp'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saat logout',
            error: error.message
        });
    }
});

// POST /api/webhook/config - Konfigurasi webhook
router.post('/webhook/config', authenticateAPI, async (req, res) => {
    try {
        const { url, secret, enabled, retryAttempts, timeout } = req.body;
        
        if (!url && enabled !== false) {
            return res.status(400).json({
                success: false,
                message: 'URL webhook diperlukan untuk mengaktifkan webhook'
            });
        }
        
        const whatsappService = req.app.get('whatsappService');
        
        // Update konfigurasi webhook
        whatsappService.webhookService.updateConfig({
            url,
            secret,
            enabled,
            retryAttempts,
            timeout
        });
        
        res.json({
            success: true,
            data: {
                message: 'Konfigurasi webhook berhasil diupdate',
                config: whatsappService.webhookService.getStatus()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengupdate konfigurasi webhook',
            error: error.message
        });
    }
});

// GET /api/webhook/status - Status webhook
router.get('/webhook/status', authenticateAPI, (req, res) => {
    try {
        const whatsappService = req.app.get('whatsappService');
        const status = whatsappService.webhookService.getStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mendapatkan status webhook',
            error: error.message
        });
    }
});

// POST /api/webhook/test - Test webhook
router.post('/webhook/test', authenticateAPI, async (req, res) => {
    try {
        const whatsappService = req.app.get('whatsappService');
        const result = await whatsappService.webhookService.testWebhook();
        
        res.json({
            success: result.success,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error testing webhook',
            error: error.message
        });
    }
});

// Webhook untuk menerima pesan masuk (legacy endpoint)
router.post('/webhook', authenticateAPI, (req, res) => {
    // Endpoint ini bisa digunakan untuk menerima webhook dari sistem lain
    // atau sebagai callback untuk pesan masuk
    
    console.log('📥 Webhook received:', req.body);
    
    res.json({
        success: true,
        message: 'Webhook diterima'
    });
});

module.exports = router;
