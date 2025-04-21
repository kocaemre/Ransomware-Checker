# Ransomware Checker / Zararlı Yazılım Kontrol Aracı

## English

### Introduction
Ransomware Checker is a web application designed to help users scan files for potential malware and ransomware threats. It uses the VirusTotal API to analyze files across multiple antivirus engines, providing comprehensive security reports.

### Features
- **File Scanning**: Upload files to check for potential threats
- **Detailed Analysis**: View comprehensive reports from multiple security engines
- **Scan History**: Track all previous file scans
- **Real-time Updates**: Automatically refreshes scan results
- **User Authentication**: Secure login and registration system

### Technologies Used
- Next.js
- Prisma
- NextAuth.js
- Tailwind CSS
- VirusTotal API

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Set up the database: `npx prisma migrate dev`
5. Run the development server: `npm run dev`

### Requirements
- Node.js 16+
- A VirusTotal API key

## Türkçe

### Giriş
Ransomware Checker (Zararlı Yazılım Kontrol Aracı), kullanıcıların dosyaları potansiyel kötü amaçlı yazılım ve fidye yazılımı tehditlerine karşı taramasına yardımcı olmak için tasarlanmış bir web uygulamasıdır. Dosyaları analiz etmek için VirusTotal API'sini kullanarak birden fazla antivirüs motoru üzerinden kapsamlı güvenlik raporları sunar.

### Özellikler
- **Dosya Tarama**: Potansiyel tehditleri kontrol etmek için dosya yükleme
- **Detaylı Analiz**: Birden fazla güvenlik motorundan kapsamlı raporlar görüntüleme
- **Tarama Geçmişi**: Tüm önceki dosya taramalarını takip etme
- **Gerçek Zamanlı Güncellemeler**: Tarama sonuçlarını otomatik olarak yenileme
- **Kullanıcı Kimlik Doğrulama**: Güvenli giriş ve kayıt sistemi

### Kullanılan Teknolojiler
- Next.js
- Prisma
- NextAuth.js
- Tailwind CSS
- VirusTotal API

### Başlangıç
1. Depoyu klonlayın
2. Bağımlılıkları yükleyin: `npm install`
3. Ortam değişkenlerini ayarlayın (`.env.example` dosyasına bakın)
4. Veritabanını kurun: `npx prisma migrate dev`
5. Geliştirme sunucusunu çalıştırın: `npm run dev`

### Gereksinimler
- Node.js 16+
- VirusTotal API anahtarı
