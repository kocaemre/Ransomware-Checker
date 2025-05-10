import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// MalwareBazaar'dan hash'leri almak için kullanılacak URL
const MALWARE_BAZAAR_HASH_URL = "https://bazaar.abuse.ch/export/txt/sha256/recent/";

export async function POST(request: NextRequest) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Admin kontrolü - sadece belirli email hesabı
    const isAdmin = session.user?.email === "zeze@gmail.com";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }
    
    // MalwareBazaar'dan hash listesini al
    console.log("Fetching hash list from MalwareBazaar...");
    
    try {
      const response = await fetch(MALWARE_BAZAAR_HASH_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'User-Agent': 'Ransomware-Checker-App',
        },
        cache: 'no-store', // Önbelleği devre dışı bırak
        next: { revalidate: 0 }, // Next.js 14+ için önbellek devre dışı bırakma
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hash list: ${response.status} - ${response.statusText}`);
      }
      
      // Yanıtın içeriğini doğrula
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/plain')) {
        console.warn(`Expected text/plain but got ${contentType}`);
      }
      
      const text = await response.text();
      
      // Cevabın boş olup olmadığını kontrol et
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response received from MalwareBazaar');
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
      
      // Yığın işlemi için maksimum boyut
      const BATCH_SIZE = 50; // Vercel için daha küçük bir batch boyutu kullan
      
      // Hash'leri batch olarak işle
      let processedCount = 0;
      for (let i = 0; i < validHashes.length; i += BATCH_SIZE) {
        const batch = validHashes.slice(i, i + BATCH_SIZE);
        
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
        console.log(`Processed ${processedCount}/${validHashes.length} hashes`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${validHashes.length} malicious hashes from MalwareBazaar`,
        count: validHashes.length
      });
      
    } catch (fetchError) {
      console.error("Error fetching from MalwareBazaar:", fetchError);
      
      // MalwareBazaar API hatası için özel bir yanıt döndür
      return NextResponse.json({
        error: "Failed to fetch data from MalwareBazaar",
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error("Error updating hash database:", error);
    return NextResponse.json({
      error: "Failed to update hash database",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 