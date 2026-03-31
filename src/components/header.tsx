
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { useUser } from "@/auth";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from "next/navigation";
import posthog from 'posthog-js';
import { GLOBAL_EVENTS } from '@/lib/posthog-events';
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
        const supabase = createClient();
        try {
            await supabase.auth.signOut();
            posthog.capture(GLOBAL_EVENTS.USER_LOGOUT);
            posthog.reset();
            router.push('/blog');
        } catch (error: any) {
            console.error("Error signing out: ", error);
            alert(error?.message || 'Failed to sign out. Please try again.');
        }
    }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
          </Link>
        </div>

        {children}

        <div className="flex items-center gap-1">
          {pathname !== '/jobs' && (
            <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/jobs">Jobs</Link>
            </Button>
          )}
          {!isUserLoading && user && (
              <>
                {pathname !== '/editor' && (
                  <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground">
                    <Link href="/editor">Editor</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground">
                  Logout
                </Button>
              </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
