import crypto from 'crypto';
import { Readable } from 'stream';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3';

if (!VIRUSTOTAL_API_KEY) {
  throw new Error("VIRUSTOTAL_API_KEY is not set in environment variables");
}

interface AnalysisResponse {
  status: string;
  stats: {
    malicious: number;
    suspicious: number;
    undetected: number;
    harmless: number;
    timeout: number;
    "confirmed-timeout": number;
    failure: number;
    "type-unsupported": number;
  };
  results?: Record<string, any>;
}

const headers = {
  headers: {
    'x-apikey': VIRUSTOTAL_API_KEY
  }
};

export async function calculateFileHash(file: Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  } catch (error) {
    console.error("Error calculating file hash:", error);
    throw new Error("Failed to calculate file hash");
  }
}

export async function scanFile(file: File): Promise<any> {
  try {
    // For files larger than 32MB, get upload URL first
    if (file.size > 32 * 1024 * 1024) {
      console.log('Large file detected, getting upload URL...');
      const urlResponse = await fetch(
        `${VIRUSTOTAL_API_URL}/files/upload_url`,
        headers
      );

      if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${urlResponse.statusText}`);
      }

      const { data } = await urlResponse.json();
      console.log('Upload URL obtained:', data);
      
      // Upload to the special URL for large files
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(data, {
        method: 'POST',
        ...headers,
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload large file: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Large file upload response:', uploadData);
      return {
        id: uploadData.data.id,
        type: uploadData.data.type,
        fileHash: await calculateFileHash(file)
      };
    }

    // For smaller files, upload directly
    console.log('Uploading file directly...');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${VIRUSTOTAL_API_URL}/files`, {
      method: 'POST',
      ...headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Upload response:', data);
    
    // Return the analysis ID and file hash for tracking
    return {
      id: data.data.id,
      type: data.data.type,
      fileHash: await calculateFileHash(file)
    };
  } catch (error) {
    console.error('Error in scanFile:', error);
    throw error;
  }
}

export async function getAnalysisResult(fileHash: string): Promise<AnalysisResponse> {
  try {
    // First, get the file report using the hash
    console.log(`Getting file report for hash: ${fileHash}`);
    
    // Log the request URL for debugging
    const requestUrl = `${VIRUSTOTAL_API_URL}/files/${fileHash}`;
    console.log(`Making request to: ${requestUrl}`);
    
    const response = await fetch(
      requestUrl,
      headers
    );

    // Log response status
    console.log(`Response status for file hash ${fileHash}: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // For 4xx errors, log more details
      if (response.status >= 400 && response.status < 500) {
        // Try to get response body for more info
        try {
          const errorBody = await response.text();
          console.error(`API Error body: ${errorBody}`);
        } catch (parseError) {
          console.error(`Could not parse error body: ${parseError}`);
        }
      }
      
      console.log(`File report not found: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        // If file report not found, return pending status
        return {
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
        };
      }
      throw new Error(`Failed to get file report: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Raw file report response metadata:", {
      id: data.data?.id,
      type: data.data?.type,
      attributesKeys: data.data?.attributes ? Object.keys(data.data.attributes) : null,
      hasAnalysisStats: !!data.data?.attributes?.last_analysis_stats,
      hasAnalysisResults: !!data.data?.attributes?.last_analysis_results
    });
    
    // Check if we have the expected structure
    if (!data.data?.attributes?.last_analysis_stats) {
      console.log("Missing analysis stats in file report");
      return {
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
      };
    }
    
    // Transform the response to match our interface
    const stats = data.data.attributes.last_analysis_stats;
    const results = data.data.attributes.last_analysis_results;
    
    console.log("Parsed stats from file report:", stats);
    const resultsCount = results ? Object.keys(results).length : 0;
    console.log(`Results summary: ${resultsCount} engines`);
    
    const validStats = (stats?.malicious > 0 || stats?.suspicious > 0 || 
                        stats?.harmless > 0 || stats?.undetected > 0);
    
    if (!validStats) {
      console.log("Warning: File report has no valid stats");
    }
    
    return {
      status: "completed",
      stats: stats,
      results: results
    };
  } catch (error) {
    console.error('Error in getAnalysisResult:', error);
    // Instead of propagating error, return pending status in production
    return {
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
    };
  }
}

export async function getFileAnalysis(analysisId: string): Promise<AnalysisResponse> {
  try {
    // Get analysis results from the analysis endpoint
    console.log(`Getting analysis for ID: ${analysisId}`);
    
    // Log the request URL and headers for debugging
    const requestUrl = `${VIRUSTOTAL_API_URL}/analyses/${analysisId}`;
    console.log(`Making request to: ${requestUrl}`);
    
    const response = await fetch(
      requestUrl,
      headers
    );

    // Log response status
    console.log(`Response status for analysis ${analysisId}: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // For 4xx errors, log more details
      if (response.status >= 400 && response.status < 500) {
        // Try to get response body for more info
        try {
          const errorBody = await response.text();
          console.error(`API Error body: ${errorBody}`);
        } catch (parseError) {
          console.error(`Could not parse error body: ${parseError}`);
        }
      }
      
      console.log(`Analysis not found or error: ${response.status} ${response.statusText}`);
      // Return pending status but with more detail in console
      return {
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
      };
    }

    const data = await response.json();
    console.log("Raw analysis response metadata:", {
      id: data.data?.id,
      type: data.data?.type,
      attributesKeys: data.data?.attributes ? Object.keys(data.data.attributes) : null,
      hasStats: !!data.data?.attributes?.stats,
      hasResults: !!data.data?.attributes?.results,
      status: data.data?.attributes?.status
    });
    
    // Check for the expected structure
    if (!data.data?.attributes?.stats) {
      console.log("Missing stats in analysis response");
      return {
        status: data.data?.attributes?.status || "pending",
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
      };
    }
    
    const stats = data.data.attributes.stats;
    const results = data.data.attributes.results;
    const status = data.data.attributes.status;
    
    console.log(`Analysis status: ${status}`);
    console.log("Parsed stats from analysis:", stats);
    const resultsCount = results ? Object.keys(results).length : 0;
    console.log(`Results summary: ${resultsCount} engines`);
    
    return {
      status: status,
      stats: stats,
      results: results
    };
  } catch (error) {
    console.error('Error in getFileAnalysis:', error);
    // Instead of propagating the error, return a pending status
    console.log('Returning pending status due to API error');
    return {
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
    };
  }
}

// This function handles any scan ID format - whether it's a hash or an analysis ID
export async function getComprehensiveAnalysis(scanId: string): Promise<AnalysisResponse> {
  try {
    // Check if scanId looks like a hash (usually 64 hex chars for SHA-256)
    const isHash = /^[a-f0-9]{64}$/i.test(scanId);
    
    console.log(`getComprehensiveAnalysis called with ${isHash ? 'hash' : 'analysis ID'}: ${scanId}`);
    
    // First try path based on ID type
    if (isHash) {
      try {
        // Try file report first for hashes - this is the proper endpoint for hash lookups
        console.log("Trying to get file report using hash...");
        const fileResult = await getAnalysisResult(scanId);
        
        if (fileResult.status === "completed" && 
            Object.values(fileResult.stats).some(value => value > 0)) {
          console.log("Successfully got file report with valid stats");
          return fileResult;
        }
        
        console.log("File report has no valid stats, but not trying analysis endpoint with hash");
      } catch (error) {
        console.error("Error getting file report:", error);
        console.log("Failed to get file report with hash. This could be normal for new files.");
      }
      
      // NOTE: We're not trying to use hash as analysis ID anymore as it causes 400 Bad Request
      console.log("Hash-based lookup complete. Not using hash as analysis ID to avoid 400 errors.");
    } else {
      // If it's not a hash, it's probably an analysis ID
      try {
        console.log("Trying to get analysis results using analysis ID...");
        const analysisResult = await getFileAnalysis(scanId);
        
        if (analysisResult.status === "completed" && 
            Object.values(analysisResult.stats).some(value => value > 0)) {
          console.log("Successfully got analysis with valid stats");
          return analysisResult;
        }
        
        console.log("Analysis has valid status but no stats, returning as-is");
        return analysisResult;
      } catch (error) {
        console.error("Error getting analysis with ID:", error);
        console.log("Failed to get analysis with ID. Continuing...");
      }
    }
    
    // If we got here, we couldn't get valid stats from any endpoint
    console.log("Could not get valid stats from any endpoint, returning pending status");
    return {
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
    };
  } catch (error) {
    console.error("Error in getComprehensiveAnalysis:", error);
    throw error;
  }
} 