"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-shrink-0 flex items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center">
                            <svg
                                className="h-9 w-9 text-blue-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                            <span className="ml-2 text-xl font-semibold text-gray-800">RansomwareChecker</span>
                        </Link>
                    </div>

                    {/* Desktop navigation menu */}
                    <div className="hidden sm:flex sm:space-x-8 sm:items-center">
                        <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                            Home
                        </Link>
                        <Link href="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                            Login
                        </Link>
                        <Link href="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Register
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
                        >
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, expandable/collapsible */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden bg-white shadow-lg`}>
                <div className="pt-2 pb-3 space-y-1">
                    <Link href="/"
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link href="/login"
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Login
                    </Link>
                    <Link href="/register"
                        className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Register
                    </Link>
                </div>
            </div>
        </nav>
    );
} 