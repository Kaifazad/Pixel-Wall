<h1 align="left">
  <img src="/assets/icon.png" width="60" style="vertical-align: middle; margin-right: 10px;" />
  Pixel Wall 🎨
</h1>

![API](https://img.shields.io/badge/API-24%2B-34bf49.svg)
[![GitHub Release](https://img.shields.io/github/v/release/Kaifazad/Pixel-Wall?label=Pixel%20Wall&sort=semver)](https://github.com/Kaifazad/Pixel-Wall/releases/latest)
[![Expo](https://img.shields.io/badge/Built%20with-Expo-1B1F23?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/Powered%20by-React%20Native-61dafb.svg?logo=react)](https://reactnative.dev/)

Pixel Wall is a modern wallpaper app powered by the Unsplash API, offering stunning high-quality wallpapers across various categories. Users can explore, search, upload their own images, and save favorites — all in a sleek, fast, and visually rich interface designed for effortless customization.

## 📥 Download (Coming Soon)
<a href="https://play.google.com/store/apps/details?id=com.kaifazad.pixelwall">
  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" width="200" />
</a>

## 💎 Highlights  

- **Beautiful UI:** Built with Material You 3 design for a clean, modern experience.  
- **High-Resolution Wallpapers:** Directly powered by the Unsplash API.  
- **Instant Apply:** Set wallpapers to Home, Lock, or both with one tap.  
- **Favorites:** Save your favorite wallpapers locally.  
- **Curated Collections:** Browse fresh categories every time you open the app.  
- **Offline Access:** Recently viewed wallpapers stay cached on your device.  
- **Light & Dark Mode:** Adapts automatically to your system theme.  

---

## 🖼️ Previews  

<p align="center">
<img src="/assets/11.png" height="350" />
<img src="/assets/22.png" height="350" />
<img src="/assets/33.png" height="350" />
<img src="/assets/44.png" height="350" />
</p>

> 🖼️ *Screenshots are stored in* `assets/screenshots/` *inside the repo.*

---
## ❓ Why Pixel Wall?
- Faster than most wallpaper apps  
- No ads  
- Clean Material You UI  
- No tracking or analytics  
- Fully open source  
- Free forever  

---
## ⚙️ Tech Stack  

- ⚛️ **React Native** – Cross-platform framework  
- 🧩 **Expo (Managed Workflow)** – Simplified build and runtime  
- 🎨 **React Native Paper** – Material Design 3 components  
- 🌐 **Unsplash API** – Free, high-quality photography source  
- 💾 **Expo File System & Media Library** – For downloading wallpapers  
- 🖼️ **react-native-manage-wallpaper** – Set wallpapers directly  

---

## 🚀 Getting Started  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/Kaifazad/Pixel-Wall.git
cd Pixel-Wall
```
###  2️⃣ Install dependencies
```bash
npm install
```
### 3️⃣ Add your Unsplash API key
Create .env:
```.env
UNSPLASH_ACCESS_KEY=your_key_here
```
### 📦 Build for Production (.AAB)
```bash
eas build -p android --profile production
```
Result:
➡️ /dist/*.aab (download from EAS dashboard)

### 4️⃣ Run the app
```bash
npx expo start
```
---
## 🔒 Permissions
- Internet (fetch wallpapers)
- Media Library (save images)
- Set Wallpaper (apply wallpapers)
- No personal data is collected.
---
## 📸 Image Credits
All images are sourced from the Unsplash API.  
Please support photographers by visiting their profiles on Unsplash.

---
## 📄 License
This project is licensed under the MIT License — see LICENSE.
---
<br/>

<div align="center">
Made with ❤️ by Kaif Azad

If you enjoy using Pixel Wall, consider supporting the development!
</div>

