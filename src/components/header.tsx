import Link from "next/link";
import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { useUser } from "@/firebase/provider";
import { getAuth, signOut } from "firebase/auth";

export default function Header() {
    const { user, isUserLoading } = useUser();
    
    const handleSignOut = () => {
        const auth = getAuth();
        signOut(auth);
    }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">
              ResumeRack
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            {!isUserLoading && (
                user ? (
                    <>
                        <Button variant="outline" asChild>
                            <Link href="/editor">Editor</Link>
                        </Button>
                        <Button onClick={handleSignOut}>Sign Out</Button>
                    </>
                ) : (
                     <>
                        <Button variant="outline" asChild>
                           <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                     </>
                )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
