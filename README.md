# Ransomware Checker

A secure file scanning application that helps users identify potential ransomware threats through a three-stage verification process.

[Türkçe açıklama için aşağı kaydırın](#ransomware-checker-türkçe)

## Features

- **Secure File Scanning**: Analyzes files for potential security threats
- **Three-Stage Verification**:
  1. Checks previously scanned files
  2. Validates against local hash database
  3. Performs analysis using VirusTotal API
- **Hash Database Management**: Admin interface to manage the malicious hash database
- **User Authentication**: Secure login system with role-based access control
- **Scan History**: View previous scan results and details

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- VirusTotal API key (for third-stage verification)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ransomware-checker.git
cd ransomware-checker
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in a `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/ransomware_db"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
VIRUSTOTAL_API_KEY="your-virustotal-api-key"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

## Usage

1. **User Registration/Login**: Create an account or log in to access scanning features
2. **File Upload**: Select a file to scan for potential threats
3. **View Results**: Get detailed scan results including threat analysis
4. **Hash Management** (Admin only): Manage the malicious hash database with automated updates from MalwareBazaar

## Security Features

- Hash verification against MalwareBazaar database
- User authentication and authorization
- Admin-controlled hash database management
- Secure file scanning implementation

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **External APIs**: VirusTotal, MalwareBazaar

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<a name="ransomware-checker-türkçe"></a>
# Ransomware Checker (Türkçe)

Kullanıcıların potansiyel fidye yazılımı tehditlerini üç aşamalı doğrulama süreci ile tespit etmelerine yardımcı olan güvenli bir dosya tarama uygulaması.

## Özellikler

- **Güvenli Dosya Tarama**: Dosyaları potansiyel güvenlik tehditleri açısından analiz eder
- **Üç Aşamalı Doğrulama**:
  1. Daha önce taranan dosyaları kontrol eder
  2. Yerel hash veritabanında doğrulama yapar
  3. VirusTotal API kullanarak analiz gerçekleştirir
- **Hash Veritabanı Yönetimi**: Zararlı hash veritabanını yönetmek için admin arayüzü
- **Kullanıcı Kimlik Doğrulama**: Rol tabanlı erişim kontrolü ile güvenli giriş sistemi
- **Tarama Geçmişi**: Önceki tarama sonuçlarını ve detaylarını görüntüleme

## Başlangıç

### Gereksinimler

- Node.js (v16 veya daha yüksek)
- PostgreSQL veritabanı
- VirusTotal API anahtarı (üçüncü aşama doğrulama için)

### Kurulum

1. Depoyu klonlayın:
```bash
git clone https://github.com/kullaniciadi/ransomware-checker.git
cd ransomware-checker
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasında çevre değişkenlerinizi ayarlayın:
```
DATABASE_URL="postgresql://kullaniciadi:sifre@localhost:5432/ransomware_db"
NEXTAUTH_SECRET="nextauth-gizli-anahtariniz"
NEXTAUTH_URL="http://localhost:3000"
VIRUSTOTAL_API_KEY="virustotal-api-anahtariniz"
```

4. Veritabanı migrasyonlarını çalıştırın:
```bash
npx prisma migrate dev
```

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Kullanım

1. **Kullanıcı Kaydı/Girişi**: Tarama özelliklerine erişmek için bir hesap oluşturun veya giriş yapın
2. **Dosya Yükleme**: Potansiyel tehditler için taranacak bir dosya seçin
3. **Sonuçları Görüntüleme**: Tehdit analizi dahil ayrıntılı tarama sonuçlarını alın
4. **Hash Yönetimi** (Yalnızca Admin): MalwareBazaar'dan otomatik güncellemelerle zararlı hash veritabanını yönetin

## Güvenlik Özellikleri

- MalwareBazaar veritabanına karşı hash doğrulama
- Kullanıcı kimlik doğrulama ve yetkilendirme
- Admin kontrollü hash veritabanı yönetimi
- Güvenli dosya tarama uygulaması

## Teknoloji Yığını

- **Ön Uç**: Next.js, React, Tailwind CSS, shadcn/ui
- **Arka Uç**: Next.js API Routes
- **Veritabanı**: Prisma ORM ile PostgreSQL
- **Kimlik Doğrulama**: NextAuth.js
- **Harici API'ler**: VirusTotal, MalwareBazaar

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için LICENSE dosyasına bakın.
