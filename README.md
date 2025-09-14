# 📱 WhatsApp API Server

> **API Server untuk WhatsApp menggunakan library [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) dengan Node.js dan Express.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ **Fitur Lengkap**

### 📤 **Pengiriman Pesan**
- ✅ Kirim pesan teks
- ✅ Kirim gambar dengan caption
- ✅ Kirim dokumen/file
- ✅ Format nomor otomatis (0812xxx → 62812xxx)

### 📥 **Penerimaan Pesan**
- ✅ Webhook untuk forward pesan masuk
- ✅ Auto-reply sederhana (ping/pong)
- ✅ Real-time message handling
- ✅ Signature verification untuk security

### 🔐 **Security & Management**
- ✅ API Key authentication
- ✅ Session management (persistent login)
- ✅ QR Code untuk login WhatsApp
- ✅ Error handling dan logging
- ✅ Rate limiting ready

### 🐳 **Deployment**
- ✅ Docker & Docker Compose ready
- ✅ Production optimized
- ✅ Health checks
- ✅ Volume mounting untuk data persistence

### 🛠️ **Developer Tools**
- ✅ Script management (start/stop/status)
- ✅ Test scripts untuk semua fitur
- ✅ Webhook testing tools
- ✅ CORS support
- ✅ Comprehensive logging

---

## 🚀 **Quick Start**

### **Method 1: Docker (Recommended)**

```bash
# 1. Clone repository
git clone <repository-url>
cd APIWA

# 2. Start dengan Docker Compose
docker-compose up -d --build

# 3. Cek status
./docker.sh status
```

### **Method 2: Manual Setup**

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
echo "PORT=3000
NODE_ENV=development
SESSION_DIR=./sessions
API_KEY=whatsapp_api_secret_key_2024
WEBHOOK_ENABLED=false" > .env

# 3. Start server
npm start
# atau untuk development: npm run dev
```

---

## 📱 **Setup WhatsApp**

1. **Start server** (pilih salah satu method di atas)
2. **Buka browser** → `http://localhost:3000/api/qr?apiKey=whatsapp_api_secret_key_2024`
3. **Scan QR Code** dengan WhatsApp di ponsel
4. **Tunggu status** menjadi "connected"

✅ **Selesai!** API siap digunakan.

---

## 🔗 **API Reference**

> **Base URL:** `http://localhost:3000/api`  
> **Authentication:** API Key di header `X-API-Key` atau query parameter `apiKey`  
> **Default API Key:** `whatsapp_api_secret_key_2024`

### **📊 Status & Management**

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/status` | GET | Cek status koneksi WhatsApp |
| `/api/qr` | GET | Dapatkan QR Code untuk login |
| `/api/logout` | POST | Logout dari WhatsApp |

### **📤 Mengirim Pesan**

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/send-message` | POST | Kirim pesan teks |
| `/api/send-image` | POST | Kirim gambar dengan caption |
| `/api/send-document` | POST | Kirim dokumen/file |

### **🔗 Webhook Management**

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/webhook/config` | POST | Konfigurasi webhook URL |
| `/api/webhook/status` | GET | Status konfigurasi webhook |
| `/api/webhook/test` | POST | Test koneksi webhook |

---

## 📝 **Contoh Penggunaan**

### **1. Cek Status**
```bash
curl -H "X-API-Key: whatsapp_api_secret_key_2024" \
     http://localhost:3000/api/status
```

### **2. Kirim Pesan Teks**
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: whatsapp_api_secret_key_2024" \
  -d '{
    "to": "628123456789",
    "message": "Halo dari API WhatsApp!"
  }'
```

### **3. Kirim Gambar**
```bash
curl -X POST http://localhost:3000/api/send-image \
  -H "X-API-Key: whatsapp_api_secret_key_2024" \
  -F "to=628123456789" \
  -F "caption=Ini gambar dari API" \
  -F "image=@/path/to/image.jpg"
```

### **4. Setup Webhook (Penerusan Pesan)**
```bash
# Konfigurasi webhook
curl -X POST http://localhost:3000/api/webhook/config \
  -H "Content-Type: application/json" \
  -H "X-API-Key: whatsapp_api_secret_key_2024" \
  -d '{
    "url": "https://yourapi.com/webhook",
    "secret": "your_webhook_secret",
    "enabled": true
  }'

# Test webhook
curl -X POST http://localhost:3000/api/webhook/test \
  -H "X-API-Key: whatsapp_api_secret_key_2024"
```

---

## 📨 **Webhook - Penerusan Pesan Masuk**

Webhook memungkinkan Anda menerima pesan masuk WhatsApp di server Anda sendiri.

### **Format Payload Webhook**
```json
{
  "event": "message.received",
  "timestamp": 1699123456789,
  "data": {
    "id": "3EB0C767D26A2CDAF6DFDC7D15",
    "from": "628123456789@s.whatsapp.net",
    "fromName": "+628123456789",
    "message": "Halo, ini pesan test",
    "messageType": "conversation",
    "timestamp": 1699123456,
    "isGroup": false,
    "webhookId": "uuid-here",
    "apiVersion": "1.0.0"
  }
}
```

### **Security Features**
- ✅ **HMAC SHA256 Signature** di header `X-Webhook-Signature`
- ✅ **Secret key** untuk validasi authenticity
- ✅ **Retry logic** dengan exponential backoff
- ✅ **Error logging** untuk debugging

---

## 🛠️ **Management Tools**

### **Script Management**
```bash
# Node.js (Manual)
./server.sh start    # Start server
./server.sh stop     # Stop server
./server.sh status   # Check status
./server.sh logs     # View logs

# Docker
./docker.sh up       # Start with Docker
./docker.sh down     # Stop containers
./docker.sh status   # Check status
./docker.sh logs     # View logs
```

### **Testing Tools**
```bash
# Test semua API endpoints
node examples/test-api.js

# Test webhook
node examples/webhook-test.js https://webhook.site/your-url

# Test webhook example server (port 3001)
node examples/webhook-example.js
```

---

## 📋 **Format Nomor Telepon**

API menerima berbagai format dan otomatis normalisasi:

| Format Input | Output WhatsApp |
|--------------|-----------------|
| `08123456789` | `628123456789@s.whatsapp.net` |
| `+628123456789` | `628123456789@s.whatsapp.net` |
| `628123456789` | `628123456789@s.whatsapp.net` |

---

## ⚙️ **Environment Configuration**

### **File .env**
```env
# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_DIR=./sessions
API_KEY=whatsapp_api_secret_key_2024

# Webhook Configuration
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://yourapi.com/webhook
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=5000

# Optional: CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### **Docker Environment**
```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - API_KEY=your_secure_api_key
  - WEBHOOK_ENABLED=true
  - WEBHOOK_URL=https://yourapi.com/webhook
```

---

## 🚀 **Production Deployment**

### **Docker (Recommended)**
```bash
# Production dengan docker-compose
docker-compose up -d --build

# Scale jika diperlukan
docker-compose up -d --scale whatsapp-api=2
```

### **PM2 (Node.js)**
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start index.js --name "whatsapp-api"
pm2 save
pm2 startup
```

### **Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛠️ **Troubleshooting**

### **❌ Common Issues**

| Problem | Solution |
|---------|----------|
| WhatsApp tidak terhubung | 1. Scan QR code baru<br>2. Cek koneksi internet<br>3. Restart server |
| API Key tidak valid | Pastikan `X-API-Key` header sesuai dengan `.env` |
| File upload gagal | 1. Max size 10MB<br>2. Cek field name (`image`/`document`) |
| Session hilang | Jangan hapus folder `sessions/` |
| Webhook tidak terkirim | 1. Cek URL webhook<br>2. Validasi signature<br>3. Lihat error di logs |

### **🔍 Debug Commands**
```bash
# Cek logs
./server.sh logs        # Node.js
./docker.sh logs        # Docker

# Cek status detail
curl -H "X-API-Key: whatsapp_api_secret_key_2024" \
     http://localhost:3000/api/status

# Test webhook
node examples/webhook-test.js https://webhook.site/your-url
```

### **📊 Health Monitoring**
- **Health endpoint:** `GET /health`
- **Docker health check:** Built-in
- **Log files:** `./logs/` atau container logs

---

## 📂 **Project Structure**

```
📁 APIWA/
├── 📄 docker-compose.yml     # Docker configuration
├── 📄 Dockerfile            # Docker image
├── 📄 package.json          # Dependencies
├── 📄 config.js             # App configuration
├── 📄 index.js              # Main server
├── 📁 routes/
│   └── 📄 api.js            # API endpoints
├── 📁 services/
│   ├── 📄 whatsappService.js # WhatsApp core
│   └── 📄 webhookService.js  # Webhook handler
├── 📁 examples/
│   ├── 📄 test-api.js       # API testing
│   ├── 📄 webhook-test.js   # Webhook testing
│   └── 📄 webhook-example.js # Webhook server example
├── 📁 sessions/             # WhatsApp sessions (persistent)
├── 📁 uploads/              # Temporary uploads
└── 📁 logs/                 # Application logs
```

## ⚠️ **Important Notes**

### **🔒 Security**
- ✅ **Never share session folder** - contains WhatsApp credentials
- ✅ **Change default API key** - use strong, unique key
- ✅ **Use HTTPS in production** - protect API calls
- ✅ **Backup session folder** - avoid re-scanning QR

### **📊 Rate Limiting**
- WhatsApp has message sending limits
- Implement rate limiting in production
- Monitor for unusual activity

### **⚖️ Compliance**
- Follow WhatsApp Business API policies
- Respect user privacy and consent
- Implement proper error handling

---

## 🎯 **Quick Commands Cheat Sheet**

```bash
# 🚀 Start (Choose one)
docker-compose up -d --build          # Docker (Recommended)
./server.sh start                     # Node.js

# 📱 Setup WhatsApp
# Open: http://localhost:3000/api/qr?apiKey=whatsapp_api_secret_key_2024

# 💬 Send Message
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: whatsapp_api_secret_key_2024" \
  -d '{"to": "628123456789", "message": "Hello!"}'

# 🔗 Setup Webhook  
curl -X POST http://localhost:3000/api/webhook/config \
  -H "Content-Type: application/json" \
  -H "X-API-Key: whatsapp_api_secret_key_2024" \
  -d '{"url": "https://yourapi.com/webhook", "enabled": true}'

# 🛑 Stop
./docker.sh down                      # Docker
./server.sh stop                      # Node.js
```

---

## 📄 **License**

MIT License - feel free to use in your projects!

## 🤝 **Contributing**

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Submit pull request

## 📞 **Support**

- 🐛 **Issues:** Create GitHub issue
- 📧 **Contact:** [Your contact info]
- 📖 **Docs:** This README

---

<div align="center">

### 🎉 **Selamat menggunakan WhatsApp API Server!**

**Made with ❤️ for the developer community**

[![⭐ Star on GitHub](https://img.shields.io/badge/⭐_Star_on_GitHub-blue?style=for-the-badge)](https://github.com/your-repo)

</div>
