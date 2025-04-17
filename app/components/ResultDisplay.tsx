"use client";

// Sonuç türleri
export type ResultType = "clean" | "infected" | null;

interface ResultDisplayProps {
    result: ResultType;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
    if (!result) return null;

    return (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${result === "clean" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
                "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}>
            {result === "clean" ? (
                <>
                    <svg
                        className="w-6 h-6 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>✅ Dosya güvenli görünüyor.</span>
                </>
            ) : (
                <>
                    <svg
                        className="w-6 h-6 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>🚨 Bu dosya virüslü olabilir!</span>
                </>
            )}
        </div>
    );
} 