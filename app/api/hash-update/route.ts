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
    const response = await fetch(MALWARE_BAZAAR_HASH_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch hash list: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Hash'leri ayıkla (# ile başlayan satırları atla)
    const hashLines = text.split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .map(line => line.trim());
    
    console.log(`Found ${hashLines.length} hashes`);
    
    // Yığın işlemi için maksimum boyut
    const BATCH_SIZE = 100;
    
    // Hash'leri batch olarak işle
    let processedCount = 0;
    for (let i = 0; i < hashLines.length; i += BATCH_SIZE) {
      const batch = hashLines.slice(i, i + BATCH_SIZE);
      
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
      console.log(`Processed ${processedCount}/${hashLines.length} hashes`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${hashLines.length} malicious hashes from MalwareBazaar`,
      count: hashLines.length
    });
    
  } catch (error) {
    console.error("Error updating hash database:", error);
    return NextResponse.json(
      {
        error: "Failed to update hash database",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 