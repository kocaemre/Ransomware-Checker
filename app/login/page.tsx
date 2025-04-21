"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { toast } from "sonner";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid credentials");
            } else {
                toast.success("Login successful!");
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                        <p className="text-gray-600">
                            Sign in to your account to continue with ransomware scans.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm border">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                                    placeholder="example@mail.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember_me"
                                        name="remember_me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 rounded-lg text-white font-medium transition-colors 
                ${loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="font-medium text-primary hover:text-primary/80">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 