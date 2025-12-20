
"use client";

import Link from "next/link";
import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { useUser } from "@/firebase/provider";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Header() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    
    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            router.push('/');
        });
    }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          {!isUserLoading && user && (
              <>
                  <Button variant="outline" asChild>
                      <Link href="/editor">Editor</Link>
                  </Button>
                  <Button onClick={handleSignOut}>Sign Out</Button>
              </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
