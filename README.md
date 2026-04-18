# OPPA Panel - Smart Social Media Automation

Automation panel untuk mengelola multiple Android devices dan melakukan actions di berbagai platform social media.

## ✨ Features

- �� Multi-device management via ADB
- 🎵 **TikTok**: Comment & Report
- 📸 **Instagram**: Post/Reels Comment & Report
- 💙 **Facebook**: Comment & Report
- 🐦 **X (Twitter)**: Reply & Report
- 📊 Device activity logs & auto screenshots

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **ADB (Android Debug Bridge)** installed and in PATH
- Android devices with USB Debugging enabled

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Pungskyyy/Automation.git
cd Automation

# 2. Install dependencies
npm install

# 3. Create screenshots directory
mkdir -p public/screenshots

# 4. Connect Android devices via USB
adb devices

# 5. Run development server
npm run dev
```

### Access Panel

- Open: **http://localhost:3000**
- Login credentials:
  - Username: `admin`
  - Password: `admin123`

## 📱 Device Setup

1. **Enable Developer Options**:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings > Developer Options > USB Debugging

3. **Connect via USB** and accept ADB authorization popup

## 🎯 Usage

1. Login to panel
2. Select devices from Device Manager
3. Choose platform (TikTok/Instagram/Facebook/X)
4. Fill in action details
5. Click "Start" and monitor logs
6. View screenshots in Device Logs section

## 🛠️ Tech Stack

- **Next.js 15** - React Framework
- **React 19** - UI Library
- **ADB** - Android automation
- **Node.js** - Runtime

## 📸 Screenshots

All screenshots are automatically saved to `public/screenshots/`

## ⚙️ Configuration

To change login credentials, edit `app/page.jsx`:

```javascript
function handleLogin(e) {
  e.preventDefault();
  if (username === "YOUR_USERNAME" && password === "YOUR_PASSWORD") {
    // ...
  }
}
```

## 🔧 Troubleshooting

### No devices connected

```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

### Permission denied

- Accept ADB authorization popup on Android device
- Check USB cable connection

### Port 3000 already in use

```bash
# Use different port
npm run dev -- -p 3001
```

## 📄 License

MIT License

## 👨‍💻 Author

**Pungskyyy** - [GitHub Profile](https://github.com/Pungskyyy)

## ⚠️ Disclaimer

This tool is for educational purposes. Use responsibly and follow platform terms of service.
