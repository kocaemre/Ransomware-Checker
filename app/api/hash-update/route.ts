import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// MalwareBazaar'dan hash'leri almak için kullanılacak URL
const MALWARE_BAZAAR_HASH_URL = "https://bazaar.abuse.ch/export/txt/sha256/recent/";

// Hata yanıtları için yardımcı fonksiyon
function createErrorResponse(message: string, details: any = null, status: number = 500) {
  return NextResponse.json({
    error: message,
    details: details ? (typeof details === 'object' ? JSON.stringify(details) : details) : null,
    timestamp: new Date().toISOString(),
  }, { status });
}

// Vercel ortamı kontrolü
const isVercelProduction = process.env.VERCEL_ENV === 'production';
const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const isVercel = isVercelProduction || isVercelPreview;

export async function POST(request: NextRequest) {
  try {
    console.log("Starting hash update process in environment:", process.env.VERCEL_ENV || 'local');
    
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized", null, 401);
    }
    
    // Admin kontrolü - sadece belirli email hesabı
    const isAdmin = session.user?.email === "zeze@gmail.com";
    if (!isAdmin) {
      return createErrorResponse("Admin privileges required", null, 403);
    }
    
    // MalwareBazaar'dan hash listesini al
    console.log("Fetching hash list from MalwareBazaar...");
    
    try {
      // Fetch isteği için bir controller ve timeout oluştur
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout
      
      try {
        const response = await fetch(MALWARE_BAZAAR_HASH_URL, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'Ransomware-Checker-App',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
          cache: 'no-store', // Önbelleği devre dışı bırak
          next: { revalidate: 0 }, // Next.js 14+ için önbellek devre dışı bırakma
        });
        
        // Timeout'u temizle
        clearTimeout(timeoutId);
        
        console.log(`MalwareBazaar API responded with status: ${response.status}`);
        
        if (!response.ok) {
          return createErrorResponse(
            "Failed to fetch hash list from MalwareBazaar", 
            `Status: ${response.status}, Message: ${response.statusText}`,
            503
          );
        }
        
        // Yanıtın içeriğini doğrula
        const contentType = response.headers.get('content-type');
        console.log(`Response content type: ${contentType}`);
        
        if (!contentType || !contentType.includes('text/plain')) {
          console.warn(`Expected text/plain but got ${contentType}`);
        }
        
        const text = await response.text();
        console.log(`Response length: ${text.length} characters`);
        
        // Cevabın boş olup olmadığını kontrol et
        if (!text || text.trim().length === 0) {
          return createErrorResponse("Empty response received from MalwareBazaar", null, 503);
        }
        
        // Hash'leri ayıkla (# ile başlayan satırları atla)
        const hashLines = text.split('\n')
          .filter(line => line.trim() && !line.trim().startsWith('#'))
          .map(line => line.trim());
        
        console.log(`Found ${hashLines.length} hashes`);
        
        // Geçerli hash'ler var mı diye kontrol et
        if (hashLines.length === 0) {
          return NextResponse.json({
            success: false,
            message: "No valid hashes found in the response"
          }, { status: 404 });
        }
        
        // Hash formatını doğrula (SHA-256 için 64 karakter)
        const validHashes = hashLines.filter(hash => /^[a-f0-9]{64}$/i.test(hash));
        
        if (validHashes.length !== hashLines.length) {
          console.warn(`Found ${hashLines.length - validHashes.length} invalid hashes`);
        }
        
        if (validHashes.length === 0) {
          return NextResponse.json({
            success: false,
            message: "No valid SHA-256 hashes found in the response"
          }, { status: 404 });
        }
        
        // Vercel ortamı için batch boyutunu ayarla
        const BATCH_SIZE = isVercel ? 25 : 50; // Vercel için daha küçük bir batch boyutu
        console.log(`Using batch size: ${BATCH_SIZE}, Vercel environment: ${isVercel ? 'yes' : 'no'}`);
        
        // Küçük bir örnek alt küme ile çalış
        const hashesToProcess = isVercel ? validHashes.slice(0, 100) : validHashes;
        console.log(`Will process ${hashesToProcess.length} out of ${validHashes.length} hashes`);
        
        // Hash'leri batch olarak işle
        let processedCount = 0;
        for (let i = 0; i < hashesToProcess.length; i += BATCH_SIZE) {
          const batch = hashesToProcess.slice(i, i + BATCH_SIZE);
          console.log(`Processing batch ${i/BATCH_SIZE + 1} with ${batch.length} hashes...`);
          
          try {
            // Her hash için bir upsert işlemi oluştur
            const operations = batch.map(hash => {
              return prisma.maliciousHash.upsert({
                where: { hash },
                update: { 
                  updatedAt: new Date(),
                  // Eğer kayıt zaten varsa, sadece updatedAt güncellenir
                },
                create: {
                  hash,
                  source: "malwarebazaar",
                  description: "MalwareBazaar recent hash list",
                }
              });
            });
            
            // Tüm işlemleri paralel olarak gerçekleştir
            await Promise.all(operations);
            
            processedCount += batch.length;
            console.log(`Successfully processed ${processedCount}/${hashesToProcess.length} hashes`);
          } catch (dbError) {
            console.error("Database error while processing batch:", dbError);
            return createErrorResponse(
              "Database error while processing hashes", 
              dbError instanceof Error ? dbError.message : String(dbError),
              500
            );
          }
        }
        
        return NextResponse.json({
          success: true,
          message: `Successfully imported ${processedCount} malicious hashes from MalwareBazaar`,
          count: processedCount,
          total: validHashes.length
        });
      } catch (fetchTimeoutError: any) {
        clearTimeout(timeoutId);
        
        if (fetchTimeoutError.name === 'AbortError') {
          console.error("Fetch request timed out after 15 seconds");
          return createErrorResponse("Request to MalwareBazaar timed out", "The request took too long to complete", 504);
        }
        
        throw fetchTimeoutError; // Diğer hataları dışarıdaki catch bloğuna gönder
      }
    } catch (fetchError) {
      console.error("Error fetching from MalwareBazaar:", fetchError);
      
      // MalwareBazaar API hatası için özel bir yanıt döndür
      return createErrorResponse(
        "Failed to fetch data from MalwareBazaar", 
        fetchError instanceof Error ? fetchError.message : String(fetchError),
        503
      );
    }
    
  } catch (error) {
    console.error("Error updating hash database:", error);
    return createErrorResponse(
      "Failed to update hash database", 
      error instanceof Error ? error.message : String(error),
      500
    );
  }
} 