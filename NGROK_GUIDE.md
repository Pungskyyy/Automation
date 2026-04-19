# 🌐 OPPA Panel - Public Access Guide (Ngrok)

Panduan lengkap untuk mengakses OPPA Panel dari internet via Ngrok tunnel.

---

## 🚀 Quick Access

### **Public URL (Internet):**
```
https://unless-curtain-print.ngrok-free.dev
```

**Bisa diakses dari:**
- ✅ WiFi berbeda
- ✅ Kota berbeda
- ✅ Negara berbeda
- ✅ HP/Laptop/Desktop apapun

---

## 🔐 Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

---

## 📱 Cara Akses dari Device Lain

### **Step 1: Buka Browser**
Dari HP/Laptop Anda, buka browser (Chrome, Safari, Firefox, dll)

### **Step 2: Masukkan URL**
```
https://unless-curtain-print.ngrok-free.dev
```

### **Step 3: Klik "Visit Site"**
Karena ini ngrok free, akan ada splash screen ngrok:
- Klik tombol **"Visit Site"** atau **"Continue to Site"**

### **Step 4: Login**
Masukkan credentials:
- Username: `admin`
- Password: `admin123`

### **Step 5: Gunakan Panel!**
Sekarang Anda bisa:
- ✅ Melihat devices yang terkoneksi
- ✅ Menjalankan auto comment/report
- ✅ Melihat logs & screenshots

---

## 🌍 Akses dari 3 Cara

| Cara | URL | Siapa Bisa Akses |
|------|-----|------------------|
| **Localhost** | `http://localhost:3000` | Hanya owner MacBook |
| **Local Network** | `http://192.168.18.99:3000` | WiFi yang sama |
| **Ngrok (Internet)** | `https://unless-curtain-print.ngrok-free.dev` | **Dari mana saja** 🌍 |

---

## ⚠️ Catatan Penting

### **URL Ngrok Berubah Setiap Restart**
URL `https://unless-curtain-print.ngrok-free.dev` akan **berubah** kalau:
- Owner restart ngrok
- MacBook di-restart
- Koneksi internet terputus

**Solusi:**
- Minta URL terbaru dari owner
- Atau pakai Local Network kalau WiFi sama

### **Splash Screen Ngrok**
Setiap akses pertama akan muncul splash screen ngrok (versi free):
```
"You are about to visit..."
```
Klik **"Visit Site"** untuk lanjut.

### **Performance**
Karena data melewati tunnel ngrok:
- Sedikit lebih lambat dari local network
- Latency ~34ms (Asia Pacific)
- Bandwidth terbatas (ngrok free)

---

## 🔧 Troubleshooting

### **"Site can't be reached"**
- Cek apakah ngrok masih running di owner MacBook
- Minta URL terbaru (mungkin sudah berubah)

### **"Authentication Required"**
- Pastikan credentials benar:
  - Username: `admin`
  - Password: `admin123`

### **"Device not found"**
- Device harus terkoneksi ke MacBook owner via USB
- Cek di "Device Manager" apakah device terdeteksi

### **Lambat/Timeout**
- Coba refresh browser
- Cek koneksi internet Anda
- Alternatif: pakai Local Network kalau WiFi sama

---

## 💡 Tips

### **Bookmark URL**
Save URL di bookmark untuk akses cepat (tapi ingat URL bisa berubah)

### **Gunakan HTTPS**
Ngrok otomatis pakai HTTPS (secure connection)

### **Monitor Ngrok**
Owner bisa monitor request di:
```
http://127.0.0.1:4040
```

### **Upgrade Ngrok (Untuk Owner)**
Kalau mau URL tetap (tidak berubah):
- Upgrade ke ngrok paid plan
- Static domain
- No splash screen
- More bandwidth

---

## 📞 Support

Ada masalah akses? Hubungi owner:
- GitHub: https://github.com/Pungskyyy/Automation
- Repository: https://github.com/Pungskyyy/Automation

---

## 🎯 Features OPPA Panel

Setelah login, Anda bisa:

### **Device Management:**
- View connected Android devices
- Enable TCP/IP mode
- Device pairing via QR

### **TikTok Automation:**
- Auto comment on videos
- Mass report accounts/videos

### **Instagram Automation:**
- Comment on posts/reels
- Report accounts/posts

### **Facebook Automation:**
- Auto comment on posts
- Report accounts/posts

### **X (Twitter) Automation:**
- Reply to tweets
- Report accounts/tweets

### **Device Logs:**
- Real-time activity logs per device
- Auto screenshots for each action

---

**Made with ❤️ by Pungskyyy**

*Last Updated: April 19, 2026*
