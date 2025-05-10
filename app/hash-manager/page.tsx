"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Database, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function HashManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hashCount, setHashCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [customHash, setCustomHash] = useState("");
  const [customHashDescription, setCustomHashDescription] = useState("");

  // Admin kontrolü
  const isAdmin = session?.user?.email === "zeze@gmail.com";

  // Oturum kontrolünü useEffect ile yap
  useEffect(() => {
    // status "unauthenticated" olduğunda yönlendir
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin) {
      // Oturum açık ama admin değilse ana sayfaya yönlendir
      toast.error("You don't have access to this page", {
        description: "Only admins can manage the hash database."
      });
      router.push("/");
    }
  }, [status, router, isAdmin]);

  // Eğer oturum yükleniyorsa, yükleme göster
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // MalwareBazaar'dan hashler getir
  const updateHashes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/hash-update", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update hash database");
      }

      const data = await response.json();
      toast.success("Hash database updated successfully", {
        description: `Imported ${data.count} malicious hashes from MalwareBazaar.`,
      });
      
      setHashCount(data.count);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update hash database", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
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
        },
        body: JSON.stringify({
          hash: customHash,
          description: customHashDescription || "Custom hash",
          source: "custom",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add custom hash");
      }

      const data = await response.json();
      toast.success("Custom hash added successfully");
      
      // Reset form
      setCustomHash("");
      setCustomHashDescription("");
    } catch (error) {
      console.error("Add hash error:", error);
      toast.error("Failed to add custom hash", {
        description: error instanceof Error ? error.message : "Unknown error",
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
                  
                  {hashCount && lastUpdated && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <p><strong>Last Update:</strong> {lastUpdated}</p>
                      <p><strong>Hashes Imported:</strong> {hashCount}</p>
                    </div>
                  )}
                  
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