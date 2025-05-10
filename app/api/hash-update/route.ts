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

// İşlem durumu için global değişkenler
let processingStatus = {
  isProcessing: false,
  totalHashes: 0,
  processedHashes: 0,
  startTime: null as Date | null,
  lastUpdateTime: null as Date | null,
  batchSize: 0,
  error: null as string | null
};

// Parça boyutu - Vercel için çok daha küçük
const BATCH_SIZE = isVercel ? 10 : 50;
// Maksimum bir seferde işlenecek hash sayısı
const MAX_HASHES_PER_REQUEST = isVercel ? 50 : 250;

// İşlem durumunu kontrol eden API endpoint'i
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return createErrorResponse("Unauthorized", null, 401);
  }
  
  // Admin kontrolü
  const isAdmin = session.user?.email === "zeze@gmail.com";
  if (!isAdmin) {
    return createErrorResponse("Admin privileges required", null, 403);
  }
  
  // İşlem durum bilgilerini döndür
  return NextResponse.json({
    isProcessing: processingStatus.isProcessing,
    totalHashes: processingStatus.totalHashes,
    processedHashes: processingStatus.processedHashes,
    progress: processingStatus.totalHashes > 0 
      ? Math.round((processingStatus.processedHashes / processingStatus.totalHashes) * 100) 
      : 0,
    startTime: processingStatus.startTime,
    lastUpdateTime: processingStatus.lastUpdateTime,
    batchSize: processingStatus.batchSize,
    error: processingStatus.error
  });
}

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
    
    // Zaten işlem yapılıyorsa yeni işlem başlatma
    if (processingStatus.isProcessing) {
      return NextResponse.json({
        success: false,
        message: "Hash update is already in progress",
        progress: processingStatus.totalHashes > 0 
          ? Math.round((processingStatus.processedHashes / processingStatus.totalHashes) * 100) 
          : 0,
        processedHashes: processingStatus.processedHashes,
        totalHashes: processingStatus.totalHashes,
        startTime: processingStatus.startTime
      });
    }
    
    // İşleme durumunu sıfırla ve başlat
    processingStatus = {
      isProcessing: true,
      totalHashes: 0,
      processedHashes: 0,
      startTime: new Date(),
      lastUpdateTime: new Date(),
      batchSize: BATCH_SIZE,
      error: null
    };
    
    // Request gövdesini parse et (isteğe bağlı parametreler)
    let startIndex = 0;
    let limit = MAX_HASHES_PER_REQUEST;
    
    try {
      const body = await request.json();
      startIndex = body.startIndex || 0;
      limit = body.limit || MAX_HASHES_PER_REQUEST;
    } catch (e) {
      // İsteğin gövdesi yoksa varsayılan değerleri kullan
      console.log("No request body, using default values");
    }
    
    // MalwareBazaar'dan hash listesini al
    console.log("Fetching hash list from MalwareBazaar...");
    
    try {
      // Fetch isteği için bir controller ve timeout oluştur
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
      
      try {
        const response = await fetch(MALWARE_BAZAAR_HASH_URL, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'Ransomware-Checker-App',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        
        // Timeout'u temizle
        clearTimeout(timeoutId);
        
        console.log(`MalwareBazaar API responded with status: ${response.status}`);
        
        if (!response.ok) {
          processingStatus.isProcessing = false;
          processingStatus.error = `Failed to fetch hash list: ${response.status} - ${response.statusText}`;
          
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
          processingStatus.isProcessing = false;
          processingStatus.error = "Empty response received from MalwareBazaar";
          
          return createErrorResponse("Empty response received from MalwareBazaar", null, 503);
        }
        
        // Hash'leri ayıkla (# ile başlayan satırları atla)
        const hashLines = text.split('\n')
          .filter(line => line.trim() && !line.trim().startsWith('#'))
          .map(line => line.trim());
        
        console.log(`Found ${hashLines.length} hashes`);
        
        // Geçerli hash'ler var mı diye kontrol et
        if (hashLines.length === 0) {
          processingStatus.isProcessing = false;
          processingStatus.error = "No valid hashes found in the response";
          
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
          processingStatus.isProcessing = false;
          processingStatus.error = "No valid SHA-256 hashes found in the response";
          
          return NextResponse.json({
            success: false,
            message: "No valid SHA-256 hashes found in the response"
          }, { status: 404 });
        }
        
        // Toplam hash sayısını güncelle
        processingStatus.totalHashes = validHashes.length;
        
        // Sadece istenen aralıktaki hash'leri işle
        const endIndex = Math.min(startIndex + limit, validHashes.length);
        const hashesToProcess = validHashes.slice(startIndex, endIndex);
        
        console.log(`Processing hashes ${startIndex} to ${endIndex - 1} of ${validHashes.length}`);
        
        // Hash'leri batch olarak işle
        let processedCount = 0;
        for (let i = 0; i < hashesToProcess.length; i += BATCH_SIZE) {
          const batch = hashesToProcess.slice(i, i + BATCH_SIZE);
          console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(hashesToProcess.length/BATCH_SIZE)} with ${batch.length} hashes...`);
          
          try {
            // Her hash için bir upsert işlemi oluştur
            const operations = batch.map(hash => {
              return prisma.maliciousHash.upsert({
                where: { hash },
                update: { 
                  updatedAt: new Date(),
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
            processingStatus.processedHashes = startIndex + processedCount;
            processingStatus.lastUpdateTime = new Date();
            
            // İlerleme raporu
            console.log(`Successfully processed ${processedCount}/${hashesToProcess.length} hashes in this request`);
            console.log(`Overall progress: ${processingStatus.processedHashes}/${processingStatus.totalHashes} (${Math.round(processingStatus.processedHashes/processingStatus.totalHashes*100)}%)`);
            
          } catch (dbError) {
            console.error("Database error while processing batch:", dbError);
            console.error(`Failed batch indices: ${startIndex + i} to ${startIndex + i + BATCH_SIZE}`);
            
            processingStatus.error = dbError instanceof Error ? dbError.message : String(dbError);
            
            // Hata durumunda devam et, sadece işlenmiş hash sayısını güncelle
            if (processedCount > 0 || processingStatus.processedHashes > 0) {
              // İşlemi bitir - bu hatayı client tarafında göster ve devam etmesini iste
              processingStatus.isProcessing = false;
              
              return NextResponse.json({
                success: true,
                message: `Partially imported ${processedCount} hashes in this request before encountering an error`,
                processedInThisRequest: processedCount,
                totalProcessed: processingStatus.processedHashes,
                totalHashes: processingStatus.totalHashes,
                nextStartIndex: startIndex + processedCount,
                hasMore: startIndex + processedCount < validHashes.length,
                error: dbError instanceof Error ? dbError.message : String(dbError)
              });
            }
            
            processingStatus.isProcessing = false;
            
            return createErrorResponse(
              "Database error while processing hashes", 
              dbError instanceof Error ? dbError.message : String(dbError),
              500
            );
          }
        }
        
        // Bütün hash'ler işlendi mi kontrol et
        const hasMore = endIndex < validHashes.length;
        
        // Eğer daha fazla hash yoksa işlemi bitir
        if (!hasMore) {
          processingStatus.isProcessing = false;
        }
        
        return NextResponse.json({
          success: true,
          message: `Successfully processed ${processedCount} hashes in this request`,
          processedInThisRequest: processedCount,
          totalProcessed: processingStatus.processedHashes,
          totalHashes: processingStatus.totalHashes,
          nextStartIndex: endIndex,
          hasMore: hasMore,
          progress: Math.round(processingStatus.processedHashes/processingStatus.totalHashes*100)
        });
      } catch (fetchTimeoutError: any) {
        clearTimeout(timeoutId);
        
        processingStatus.isProcessing = false;
        processingStatus.error = fetchTimeoutError.name === 'AbortError' 
          ? "Request to MalwareBazaar timed out" 
          : fetchTimeoutError.message;
        
        if (fetchTimeoutError.name === 'AbortError') {
          console.error("Fetch request timed out after 30 seconds");
          return createErrorResponse("Request to MalwareBazaar timed out", "The request took too long to complete", 504);
        }
        
        throw fetchTimeoutError; // Diğer hataları dışarıdaki catch bloğuna gönder
      }
    } catch (fetchError) {
      console.error("Error fetching from MalwareBazaar:", fetchError);
      
      processingStatus.isProcessing = false;
      processingStatus.error = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      // MalwareBazaar API hatası için özel bir yanıt döndür
      return createErrorResponse(
        "Failed to fetch data from MalwareBazaar", 
        fetchError instanceof Error ? fetchError.message : String(fetchError),
        503
      );
    }
    
  } catch (error) {
    console.error("Error updating hash database:", error);
    
    processingStatus.isProcessing = false;
    processingStatus.error = error instanceof Error ? error.message : String(error);
    
    return createErrorResponse(
      "Failed to update hash database", 
      error instanceof Error ? error.message : String(error),
      500
    );
  }
} 