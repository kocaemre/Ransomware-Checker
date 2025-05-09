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
- **File Hash Verification**: Uses SHA-256 hashing to identify files
- **Caching System**: Optimizes VirusTotal API calls by caching recent results
- **Support for Multiple File Types**: Handles various document formats, executables, archives, and media files

### Technologies Used
- **Frontend**: Next.js 15.3, React 19
- **API Integration**: VirusTotal API v3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with shadcn/ui components
- **File Processing**: Native Web APIs for file handling and hash calculation

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/ransomware_checker"
   VIRUSTOTAL_API_KEY="your_virustotal_api_key"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```
4. Set up the database: `npx prisma migrate dev`
5. Run the development server: `npm run dev`
6. Access the application at `http://localhost:3000`

### System Requirements
- Node.js 18+ (recommended: Node.js 20+)
- PostgreSQL 14+
- A VirusTotal API key (free tier supports 4 lookups/minute)
- At least 1GB of RAM for the development server

### Usage
1. Register for an account using your email
2. Log in to access the dashboard
3. Upload a file through the drag-and-drop interface or file selector
4. Wait for the scan to complete
5. View the detailed results with threat information
6. Access your scan history at any time

### API Endpoints
- `/api/scan` - Submit files for scanning
- `/api/scans` - Retrieve scan history
- `/api/auth` - Authentication endpoints

## Türkçe

### Giriş
Ransomware Checker (Zararlı Yazılım Kontrol Aracı), kullanıcıların dosyaları potansiyel kötü amaçlı yazılım ve fidye yazılımı tehditlerine karşı taramasına yardımcı olmak için tasarlanmış bir web uygulamasıdır. Dosyaları analiz etmek için VirusTotal API'sini kullanarak birden fazla antivirüs motoru üzerinden kapsamlı güvenlik raporları sunar.

### Özellikler
- **Dosya Tarama**: Potansiyel tehditleri kontrol etmek için dosya yükleme
- **Detaylı Analiz**: Birden fazla güvenlik motorundan kapsamlı raporlar görüntüleme
- **Tarama Geçmişi**: Tüm önceki dosya taramalarını takip etme
- **Gerçek Zamanlı Güncellemeler**: Tarama sonuçlarını otomatik olarak yenileme
- **Kullanıcı Kimlik Doğrulama**: Güvenli giriş ve kayıt sistemi
- **Dosya Hash Doğrulaması**: Dosyaları tanımlamak için SHA-256 hash kullanımı
- **Önbellek Sistemi**: Son sonuçları önbelleğe alarak VirusTotal API çağrılarını optimize eder
- **Çoklu Dosya Türü Desteği**: Çeşitli belge formatları, çalıştırılabilir dosyalar, arşivler ve medya dosyalarını işleyebilme

### Kullanılan Teknolojiler
- **Önyüz**: Next.js 15.3, React 19
- **API Entegrasyonu**: VirusTotal API v3
- **Veritabanı**: PostgreSQL ve Prisma ORM
- **Kimlik Doğrulama**: NextAuth.js ve kimlik bilgileri sağlayıcısı
- **Stil**: Tailwind CSS ve shadcn/ui bileşenleri
- **Dosya İşleme**: Dosya işleme ve hash hesaplama için yerel Web API'leri

### Başlangıç
1. Depoyu klonlayın
2. Bağımlılıkları yükleyin: `npm install`
3. Ortam değişkenlerini ayarlayın:
   ```
   DATABASE_URL="postgresql://kullanici_adi:sifre@localhost:5432/ransomware_checker"
   VIRUSTOTAL_API_KEY="virustotal_api_anahtariniz"
   NEXTAUTH_SECRET="nextauth_gizli_anahtariniz"
   NEXTAUTH_URL="http://localhost:3000"
   ```
4. Veritabanını kurun: `npx prisma migrate dev`
5. Geliştirme sunucusunu çalıştırın: `npm run dev`
6. Uygulamaya `http://localhost:3000` adresinden erişin

### Sistem Gereksinimleri
- Node.js 18+ (önerilen: Node.js 20+)
- PostgreSQL 14+
- VirusTotal API anahtarı (ücretsiz seviye dakikada 4 sorgu destekler)
- Geliştirme sunucusu için en az 1GB RAM

### Kullanım
1. E-posta adresinizi kullanarak bir hesap oluşturun
2. Panele erişmek için giriş yapın
3. Sürükle-bırak arayüzü veya dosya seçici aracılığıyla bir dosya yükleyin
4. Taramanın tamamlanmasını bekleyin
5. Tehdit bilgileriyle birlikte detaylı sonuçları görüntüleyin
6. Tarama geçmişinize istediğiniz zaman erişin

### API Uç Noktaları
- `/api/scan` - Tarama için dosya gönderme
- `/api/scans` - Tarama geçmişini alma
- `/api/auth` - Kimlik doğrulama uç noktaları

### Teknik Detaylar
- Maksimum dosya boyutu: 32MB
- Desteklenen dosya formatları: Executable (.exe, .msi), dökümanlar (.pdf, .docx, .xlsx), arşivler (.zip, .rar), kodlar (.js, .py) ve medya dosyaları
- Tarama sonuçları veritabanında saklanır ve kullanıcıya özgüdür
- Aynı dosya ikinci kez tarandığında, VirusTotal'e yeni bir istek göndermek yerine mevcut sonuçlar kullanılır
