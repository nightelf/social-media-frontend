"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LogOut, Menu, User as UserIcon } from "lucide-react";

import { BACKEND_LABEL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/common/theme-toggle";

function BackendBadge() {
  return (
    <Badge variant="secondary" title="Which backend is serving this app">
      {BACKEND_LABEL}
    </Badge>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="mt-8 flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent">
                      <Home className="h-4 w-4" /> Home
                    </Link>
                  </SheetClose>
                  {user && (
                    <SheetClose asChild>
                      <Link
                        href={`/u/${user.username}`}
                        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent"
                      >
                        <UserIcon className="h-4 w-4" /> Profile
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="text-lg font-bold text-primary">
              Sigmagram
            </Link>
            <BackendBadge />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex" aria-label="Home">
              <Link href="/"><Home /></Link>
            </Button>
            <ThemeToggle />
            {status === "authed" && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>@{user.username}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/u/${user.username}`)}>
                    <UserIcon /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              status === "anon" && (
                <Button size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="py-6">{children}</main>
    </div>
  );
}
