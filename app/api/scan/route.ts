import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFileHash, scanFile, getComprehensiveAnalysis } from "@/lib/virustotal";

// Desteklenen dosya türleri
const SUPPORTED_FILE_TYPES = [
  // Executables
  'application/x-msdownload', // .exe
  'application/x-ms-dos-executable', // .com
  'application/x-msi', // .msi
  'application/x-elf', // Linux executables
  'application/x-mach-binary', // macOS executables
  
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  
  // Scripts
  'text/plain', // .txt, .py, .js, .php, vb.
  'application/javascript',
  'application/x-php',
  'application/x-python',
  'application/x-shellscript',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  
  // Media
  'video/mp4',
  'video/x-msvideo', // .avi
  'video/quicktime', // .mov
  'audio/mpeg', // .mp3
  'audio/wav',
  
  // Other common types
  'application/json',
  'application/xml',
  'text/csv',
  'text/html',
  'text/xml'
];

// Maksimum dosya boyutu (32MB)
const MAX_FILE_SIZE = 32 * 1024 * 1024;

// Cache for recent VirusTotal API calls to respect rate limits (4 lookups/min)
const API_CALL_CACHE: {
  [key: string]: {
    timestamp: number;
    result: any;
  }
} = {};

// Rate limiter - returns cached result if available and recent
function rateLimitedCall<T>(key: string, apiCall: () => Promise<T>, maxAgeMs = 15000): Promise<T> {
  const now = Date.now();
  const cachedResult = API_CALL_CACHE[key];
  
  if (cachedResult && (now - cachedResult.timestamp) < maxAgeMs) {
    console.log(`Using cached result for ${key} (${Math.round((now - cachedResult.timestamp)/1000)}s old)`);
    return Promise.resolve(cachedResult.result);
  }
  
  return apiCall().then(result => {
    API_CALL_CACHE[key] = {
      timestamp: now,
      result
    };
    return result;
  });
}

// Kendi veritabanımızda bir hash kontrolü yap
async function checkLocalHashDatabase(hash: string): Promise<boolean> {
  try {
    // MaliciousHash tablosunda bu hash var mı kontrol et
    const maliciousHash = await prisma.maliciousHash.findUnique({
      where: { hash }
    });
    
    return !!maliciousHash; // Eğer hash bulunduysa true, bulunamadıysa false döner
  } catch (error) {
    console.error("Error checking local hash database:", error);
    return false; // Hata durumunda zararsız kabul et
  }
}

// Yerel veritabanımızda tespit edildiğinde oluşturulacak analiz sonucu
function createLocalDetectionResult(hash: string, source: string): any {
  return {
    status: "completed",
    source: source,
    stats: {
      malicious: 1,
      suspicious: 0,
      undetected: 0,
      harmless: 0,
      timeout: 0,
      "confirmed-timeout": 0,
      failure: 0,
      "type-unsupported": 0
    },
    results: {
      "local_database": {
        category: "malicious",
        engine_name: "Local Hash Database",
        engine_version: "1.0",
        result: "Malicious file",
        method: "hash_lookup",
        engine_update: new Date().toISOString().split('T')[0]
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the maximum limit of 32MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: "Unsupported file type",
          details: `File type ${file.type} is not supported. Please upload a different file type.`
        },
        { status: 400 }
      );
    }

    // Calculate file hash
    const fileHash = await calculateFileHash(file);
    console.log("File hash calculated:", fileHash);

    // Check if we already have a scan for this file
    const existingScan = await prisma.scan.findFirst({
      where: {
        fileHash,
        userId,
      },
    });

    if (existingScan) {
      console.log("Found existing scan:", existingScan.id);
      return NextResponse.json({ scan: existingScan });
    }

    // Önce kendi veritabanımızda bu hash'i kontrol et
    const isHashInLocalDb = await checkLocalHashDatabase(fileHash);
    
    if (isHashInLocalDb) {
      console.log("Hash found in local database:", fileHash);
      
      // Yerel veritabanımızda bulundu, zararlı olarak işaretle
      const localDetectionResult = createLocalDetectionResult(fileHash, "local_database");
      
      // Tarama kaydı oluştur
      const scan = await prisma.scan.create({
        data: {
          userId,
          fileName: file.name,
          fileHash,
          fileSize: file.size,
          status: "completed",
          scanResults: localDetectionResult as any
        },
      });
      
      return NextResponse.json({ scan });
    }

    // Check if file was already scanned in VirusTotal - use rate limited call
    console.log("Checking VirusTotal for existing report...");
    try {
      const existingReport = await rateLimitedCall(
        `file-report-${fileHash}`,
        () => getComprehensiveAnalysis(fileHash)
      );
      
      if (existingReport.status === "completed") {
        console.log("Existing VirusTotal report found");
        const scan = await prisma.scan.create({
          data: {
            userId,
            fileName: file.name,
            fileHash,
            fileSize: file.size,
            status: "completed",
            scanResults: existingReport as any
          },
        });
        return NextResponse.json({ scan });
      }
    } catch (error) {
      console.log("No existing VirusTotal report found, proceeding with new scan");
    }

    // Upload file to VirusTotal - use rate limited call
    console.log("Uploading file to VirusTotal...");
    const uploadResponse = await rateLimitedCall(
      `file-upload-${fileHash}`,
      () => scanFile(file)
    );
    console.log("File uploaded, details:", uploadResponse);

    // Extract the analysis ID and verify the file hash
    const analysisId = uploadResponse.id;
    
    if (uploadResponse.fileHash !== fileHash) {
      console.warn(`Warning: Calculated file hash (${fileHash}) doesn't match hash returned from upload (${uploadResponse.fileHash})`);
    }

    // Create scan record in pending state
    const scan = await prisma.scan.create({
      data: {
        userId,
        fileName: file.name,
        fileHash,
        fileSize: file.size,
        status: "pending",
        scanResults: {
          status: "pending",
          stats: {
            malicious: 0,
            suspicious: 0,
            undetected: 0,
            harmless: 0,
            timeout: 0,
            "confirmed-timeout": 0,
            failure: 0,
            "type-unsupported": 0
          }
        }
      },
    });

    // For small files, try to get immediate results, but don't retry
    // This respects rate limits while still giving quick results when possible
    try {
      const analysisResult = await rateLimitedCall(
        `analysis-result-${fileHash}`,
        () => getComprehensiveAnalysis(analysisId || fileHash)
      );
      
      if (analysisResult.status === "completed") {
        console.log("Analysis completed immediately");
        
        // Update scan with results
        const updatedScan = await prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: analysisResult.status,
            scanResults: analysisResult as any
          },
        });
        
        return NextResponse.json({ scan: updatedScan });
      }
    } catch (error) {
      console.log("Analysis not immediately available, will check later");
    }

    // Return the pending scan - results will be fetched when user views details
    return NextResponse.json({ scan });
    
  } catch (error) {
    console.error("Error scanning file:", error);
    return NextResponse.json(
      { 
        error: "Failed to scan file",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 