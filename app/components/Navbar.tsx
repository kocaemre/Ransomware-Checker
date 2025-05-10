"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Database, ShieldAlert } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === "zeze@gmail.com";

  return (
    <nav className="border-b bg-white/75 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Ransomware Checker
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/scan-history" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    Scan History
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {session && isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/hash-manager" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                      
                      Hash Manager
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {session.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-primary font-semibold mt-1">Admin</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Link href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-primary/5 h-10 px-4 py-2">
                Login
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-white h-10 px-4 py-2">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 