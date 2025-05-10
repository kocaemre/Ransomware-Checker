"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Database, RefreshCw, AlertTriangle, ShieldAlert, Check, StopCircle } from "lucide-react";
import { toast } from "sonner";

export default function HashManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hashCount, setHashCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [customHash, setCustomHash] = useState("");
  const [customHashDescription, setCustomHashDescription] = useState("");
  
  // Hash güncelleme durumu
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<{
    processedHashes: number;
    totalHashes: number;
    startTime: string | null;
    lastUpdateTime: string | null;
    nextStartIndex?: number;
    hasMore?: boolean;
    error?: string | null;
  }>({
    processedHashes: 0,
    totalHashes: 0,
    startTime: null,
    lastUpdateTime: null
  });
  
  // İlerleme kontrol etme interval'ı
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Admin kontrolü
  const isAdmin = session?.user?.email === "zeze@gmail.com";

  // Oturum kontrolünü useEffect ile yap
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin) {
      toast.error("You don't have access to this page", {
        description: "Only admins can manage the hash database."
      });
      router.push("/");
    }
  }, [status, router, isAdmin]);
  
  // Sayfa yüklendiğinde veya isUpdating değiştiğinde güncelleme durumunu kontrol et
  useEffect(() => {
    // Eğer güncelleme yapılıyorsa statusu kontrol et
    if (isUpdating) {
      // Interval'ı temizle ve yeniden başlat
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      
      // Her 2 saniyede bir durumu kontrol et
      const interval = setInterval(checkUpdateStatus, 2000);
      setStatusCheckInterval(interval);
      
      // Temizleme fonksiyonu
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Güncelleme yapılmıyorsa interval'ı temizle
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    }
  }, [isUpdating]);
  
  // Güncelleme durumunu kontrol eden fonksiyon
  const checkUpdateStatus = async () => {
    try {
      const response = await fetch("/api/hash-update", {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch update status");
      }
      
      const data = await response.json();
      
      // Durum bilgilerini güncelle
      setUpdateStatus({
        processedHashes: data.processedHashes,
        totalHashes: data.totalHashes,
        startTime: data.startTime,
        lastUpdateTime: data.lastUpdateTime,
        error: data.error
      });
      
      // İlerleme durumunu hesapla
      if (data.totalHashes > 0) {
        setUpdateProgress(Math.round((data.processedHashes / data.totalHashes) * 100));
      }
      
      // Eğer işlem bitti ise
      if (!data.isProcessing) {
        setIsUpdating(false);
        
        // Eğer hata yoksa başarı mesajı göster
        if (!data.error) {
          toast.success("Hash database update completed", {
            description: `Imported ${data.processedHashes} hashes successfully.`
          });
          
          setHashCount(data.processedHashes);
          setLastUpdated(new Date().toLocaleString());
        } 
        // Hata varsa hata mesajını göster
        else {
          toast.error("Hash update encountered an error", {
            description: data.error
          });
        }
      }
    } catch (error) {
      console.error("Error checking update status:", error);
    }
  };

  // Eğer oturum yükleniyorsa, yükleme göster
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Hata mesajını düzgün formatlama yardımcı fonksiyonu
  const formatErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error);
      } catch {
        return 'An unknown error occurred';
      }
    }
    
    return String(error || 'An unknown error occurred');
  };
  
  // Tarih formatlama fonksiyonu
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // MalwareBazaar'dan hashler getir
  const updateHashes = async () => {
    setIsLoading(true);
    try {
      // İlk hash kümesini almak için API çağrısı yap
      const response = await fetch("/api/hash-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          startIndex: 0
        })
      });

      // İçerik türünü kontrol et
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        throw new Error(`API returned non-JSON response: ${errorText.substring(0, 100)}...`);
      }

      // JSON yanıtını parse et
      const data = await response.json();
      
      // Zaten bir güncelleme işlemi yürütülüyorsa bilgi ver
      if (!response.ok && data.message === "Hash update is already in progress") {
        toast.info("Hash update is already in progress", {
          description: "Please wait for the current update to complete."
        });
        
        // Güncelleme durumunu aktif et
        setIsUpdating(true);
        await checkUpdateStatus();
        return;
      }
      
      // API hata kontrolü
      if (!response.ok) {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : typeof data.details === 'string' 
            ? data.details 
            : JSON.stringify(data.error || data.details || data);
        throw new Error(errorMessage);
      }

      // Güncelleme durumunu aktif et
      setIsUpdating(true);
      
      // Durum bilgilerini güncelle
      setUpdateStatus({
        processedHashes: data.totalProcessed || 0,
        totalHashes: data.totalHashes || 0,
        startTime: new Date().toISOString(),
        lastUpdateTime: new Date().toISOString(),
        nextStartIndex: data.nextStartIndex,
        hasMore: data.hasMore
      });
      
      // İlerleme durumunu hesapla
      if (data.totalHashes > 0) {
        setUpdateProgress(Math.round((data.totalProcessed / data.totalHashes) * 100));
      }
      
      // Eğer daha fazla hash varsa ve hasMore true ise, diğer hashler için devam fonksiyonu çağrılacak
      if (!data.hasMore) {
        setIsUpdating(false);
        toast.success("Hash database updated successfully", {
          description: `Imported ${data.totalProcessed} hashes from MalwareBazaar.`,
        });
        
        setHashCount(data.totalProcessed);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update hash database", {
        description: formatErrorMessage(error),
      });
      setIsUpdating(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Güncellemeyi durdur
  const stopUpdate = async () => {
    setIsUpdating(false);
    toast.info("Update process will be stopped after the current batch completes");
  };

  // Özel hash ekle
  const addCustomHash = async () => {
    if (!customHash || !customHash.match(/^[a-f0-9]{64}$/i)) {
      toast.error("Invalid hash format", {
        description: "Please enter a valid SHA-256 hash (64 hexadecimal characters).",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/hash-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          hash: customHash,
          description: customHashDescription || "Custom hash",
          source: "custom",
        }),
      });

      // İçerik türünü kontrol et
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("Non-JSON response received:", errorText);
        throw new Error(`API returned non-JSON response: ${errorText.substring(0, 100)}...`);
      }

      // JSON yanıtını parse et
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`);
      }

      // API hata kontrolü
      if (!response.ok) {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : typeof data.details === 'string' 
            ? data.details 
            : JSON.stringify(data.error || data.details || data);
            
        throw new Error(errorMessage || "Failed to add custom hash");
      }

      toast.success("Custom hash added successfully");
      
      // Reset form
      setCustomHash("");
      setCustomHashDescription("");
    } catch (error) {
      console.error("Add hash error:", error);
      toast.error("Failed to add custom hash", {
        description: formatErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Oturum doğrulanmadıysa veya admin değilse sayfa içeriğini gösterme
  if (status !== "authenticated" || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Hash Manager</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MalwareBazaar Update */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  MalwareBazaar Hash Update
                </CardTitle>
                <CardDescription>
                  Import hash data from MalwareBazaar's recent malware samples.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Fetch the latest hash list from MalwareBazaar to update your local database.
                    This will import SHA-256 hashes of recently identified malware.
                  </p>
                  
                  {/* İlerleme göstergesi */}
                  {isUpdating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Processing...</span>
                        <span>{updateProgress}%</span>
                      </div>
                      <Progress value={updateProgress} className="h-2" />
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Processed: {updateStatus.processedHashes} / {updateStatus.totalHashes} hashes</div>
                        {updateStatus.startTime && (
                          <div>Started: {formatDate(updateStatus.startTime)}</div>
                        )}
                        {updateStatus.lastUpdateTime && (
                          <div>Last update: {formatDate(updateStatus.lastUpdateTime)}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {hashCount && lastUpdated && !isUpdating && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <p><strong>Last Update:</strong> {lastUpdated}</p>
                      <p><strong>Hashes Imported:</strong> {hashCount}</p>
                    </div>
                  )}
                  
                  {isUpdating ? (
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700" 
                      onClick={stopUpdate}
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop Update
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={updateHashes}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Update Hash Database
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Custom Hash Entry */}
            <Card>
              <CardHeader>
                <CardTitle>Add Custom Hash</CardTitle>
                <CardDescription>
                  Manually add a known malicious SHA-256 hash to the database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SHA-256 Hash</label>
                    <Input
                      placeholder="Enter SHA-256 hash (64 characters)"
                      value={customHash}
                      onChange={(e) => setCustomHash(e.target.value.trim())}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      placeholder="Enter a description for this hash"
                      value={customHashDescription}
                      onChange={(e) => setCustomHashDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={addCustomHash}
                    disabled={isLoading || !customHash}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Custom Hash"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 