
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, FilePenLine } from "lucide-react";
import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { useUser } from "@/firebase/provider";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function Header({ children }: { children?: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    
    const handleSignOut = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Error signing out: ", error);
            // Optionally, show a toast notification to the user
        }
    }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
          </Link>
        </div>

        {children}

        <div className="flex items-center space-x-2">
          {!isUserLoading && user && (
              <TooltipProvider>
                <div className="flex items-center space-x-1">
                  {pathname !== '/editor' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href="/editor">
                            <FilePenLine />
                            <span className="sr-only">Editor</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editor</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleSignOut}>
                        <LogOut />
                         <span className="sr-only">Sign Out</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sign Out</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
