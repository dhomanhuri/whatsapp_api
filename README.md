# WhatsApp API Server

API Server untuk WhatsApp menggunakan library [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) dengan Node.js dan Express.

## 🚀 Fitur

- ✅ Kirim pesan teks
- ✅ Kirim gambar dengan caption
- ✅ Kirim dokumen/file
- ✅ Menerima pesan masuk (dengan auto-reply sederhana)
- ✅ QR Code untuk login WhatsApp
- ✅ Session management (tetap login setelah restart)
- ✅ API Key authentication
- ✅ Error handling dan logging
- ✅ CORS support
- ✅ File upload dengan multer

## 📦 Instalasi

1. Clone atau download project ini
2. Install dependencies:
```bash
npm install
```

3. Copy file konfigurasi environment:
```bash
cp .env.example .env
```

4. Edit file `.env` sesuai kebutuhan:
```env
PORT=3000
NODE_ENV=development
SESSION_DIR=./sessions
API_KEY=ganti_dengan_api_key_rahasia_anda
```

## 🏃‍♂️ Cara Menjalankan

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server akan berjalan di `http://localhost:3000` (atau port yang Anda set di `.env`)

## 📱 Setup WhatsApp

1. Jalankan server
2. Buka browser dan akses: `http://localhost:3000/api/qr?apiKey=your_api_key`
3. Scan QR Code yang muncul dengan WhatsApp di hp Anda
4. Tunggu hingga status menjadi "connected"

## 🔗 API Endpoints

Semua endpoint memerlukan API Key di header `X-API-Key` atau query parameter `apiKey`.

### 1. Cek Status Koneksi
```http
GET /api/status
X-API-Key: your_api_key
```

Response:
```json
{
    "success": true,
    "data": {
        "isConnected": true,
        "connectionState": "connected",
        "qrCode": null
    }
}
```

### 2. Dapatkan QR Code
```http
GET /api/qr
X-API-Key: your_api_key
```

Response (jika perlu scan):
```json
{
    "success": true,
    "data": {
        "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "message": "Scan QR code dengan WhatsApp Anda"
    }
}
```

### 3. Kirim Pesan Teks
```http
POST /api/send-message
Content-Type: application/json
X-API-Key: your_api_key

{
    "to": "628123456789",
    "message": "Halo, ini pesan dari API!"
}
```

Response:
```json
{
    "success": true,
    "data": {
        "messageId": "3EB0C767D26A2CDAF6DFDC7D15",
        "to": "628123456789",
        "message": "Halo, ini pesan dari API!",
        "timestamp": 1699123456789
    }
}
```

### 4. Kirim Gambar
```http
POST /api/send-image
Content-Type: multipart/form-data
X-API-Key: your_api_key

Form Data:
- to: 628123456789
- caption: Ini caption gambar (opsional)
- image: [file gambar]
```

### 5. Kirim Dokumen
```http
POST /api/send-document
Content-Type: multipart/form-data
X-API-Key: your_api_key

Form Data:
- to: 628123456789
- caption: Ini caption dokumen (opsional)
- document: [file dokumen]
```

### 6. Logout
```http
POST /api/logout
X-API-Key: your_api_key
```

## 📋 Format Nomor Telepon

API ini menerima berbagai format nomor telepon:

- `08123456789` → otomatis dikonversi ke `628123456789@s.whatsapp.net`
- `628123456789` → dikonversi ke `628123456789@s.whatsapp.net`
- `+628123456789` → dikonversi ke `628123456789@s.whatsapp.net`
- `628123456789@s.whatsapp.net` → digunakan langsung

## 🔧 Contoh Penggunaan

### cURL Examples

#### Kirim Pesan Teks
```bash
curl -X POST http://localhost:3000/api/send-message \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: {{token_admin}}" \\
  -d '{
    "to": "628123456789",
    "message": "Halo dari API WhatsApp!"
  }'
```

#### Kirim Gambar
```bash
curl -X POST http://localhost:3000/api/send-image \\
  -H "X-API-Key: {{token_admin}}" \\
  -F "to=628123456789" \\
  -F "caption=Ini gambar dari API" \\
  -F "image=@/path/to/image.jpg"
```

#### Cek Status
```bash
curl -X GET http://localhost:3000/api/status \\
  -H "X-API-Key: {{token_admin}}"
```

### JavaScript Example
```javascript
const axios = require('axios');

// Kirim pesan
async function sendMessage(to, message) {
    try {
        const response = await axios.post('http://localhost:3000/api/send-message', {
            to: to,
            message: message
        }, {
            headers: {
                'X-API-Key': 'your_api_key'
            }
        });
        
        console.log('Pesan berhasil dikirim:', response.data);
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}

// Contoh penggunaan
sendMessage('628123456789', 'Halo dari JavaScript!');
```

### Python Example
```python
import requests

def send_message(to, message):
    url = 'http://localhost:3000/api/send-message'
    headers = {
        'X-API-Key': 'your_api_key',
        'Content-Type': 'application/json'
    }
    data = {
        'to': to,
        'message': message
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        print('Pesan berhasil dikirim:', response.json())
    else:
        print('Error:', response.json())

# Contoh penggunaan
send_message('628123456789', 'Halo dari Python!')
```

## 🔧 Konfigurasi

### Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `PORT` | Port server | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `SESSION_DIR` | Direktori session WhatsApp | `./sessions` |
| `API_KEY` | API Key untuk autentikasi | `default_api_key` |
| `ALLOWED_ORIGINS` | CORS origins (comma separated) | `*` |

### Auto-Reply

Server ini dilengkapi dengan contoh auto-reply sederhana. Jika ada yang mengirim pesan yang mengandung kata "ping", bot akan membalas dengan "🏓 Pong! API WhatsApp berfungsi dengan baik."

Anda bisa mengubah logika auto-reply di file `index.js` pada bagian `setupWhatsAppHandlers()`.

## 📂 Struktur Folder

```
APIWA/
├── config.js              # Konfigurasi aplikasi
├── index.js               # Server utama
├── package.json           # Dependencies
├── README.md              # Dokumentasi
├── .env                   # Environment variables
├── routes/
│   └── api.js            # API routes
├── services/
│   └── whatsappService.js # WhatsApp service
├── sessions/             # Session WhatsApp (auto-generated)
└── uploads/              # File upload temporary (auto-generated)
```

## 🛠️ Troubleshooting

### WhatsApp tidak terhubung
1. Pastikan QR code berhasil di-scan
2. Cek internet connection
3. Restart server jika perlu

### Error "API Key tidak valid"
- Pastikan header `X-API-Key` atau query parameter `apiKey` sesuai dengan yang di `.env`

### File upload gagal
- Pastikan ukuran file < 10MB
- Cek format file yang didukung
- Pastikan field name sesuai (`image` untuk gambar, `document` untuk dokumen)

### Session hilang setelah restart
- Pastikan folder `sessions` tidak terhapus
- Jangan jalankan multiple instance dengan session folder yang sama

## 🚀 Deployment

### PM2 (Recommended)
```bash
npm install -g pm2
pm2 start index.js --name "whatsapp-api"
pm2 save
pm2 startup
```

### Docker
Buat `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build dan run:
```bash
docker build -t whatsapp-api .
docker run -p 3000:3000 -v $(pwd)/sessions:/app/sessions whatsapp-api
```

## ⚠️ Penting

1. **Jangan share session folder** - berisi kredensial WhatsApp Anda
2. **Ganti API Key default** - untuk keamanan
3. **Backup session folder** - agar tidak perlu scan QR berulang
4. **Rate limiting** - WhatsApp punya limit pengiriman pesan
5. **Compliance** - pastikan penggunaan sesuai kebijakan WhatsApp

## 📝 License

MIT License

## 🤝 Contributing

Pull requests welcome! Untuk perubahan besar, mohon buat issue terlebih dahulu.

## 📞 Support

Jika ada pertanyaan atau bug, silakan buat issue di repository ini.

---

**Selamat menggunakan WhatsApp API Server! 🎉**
