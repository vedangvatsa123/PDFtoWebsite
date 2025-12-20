import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Palette, Share2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Turn Your Resume into a Website
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Stop sending PDFs. Upload your resume and get a professional, shareable web page in minutes.
                  Showcase your skills and experience like never before.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/editor">Create Your Profile Page</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-accent py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 sm:grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-background p-4 shadow-md">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-xl font-bold">Upload & Go</h3>
                <p className="text-muted-foreground">
                  Just upload your resume. We'll parse the details and build your profile foundation automatically.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-background p-4 shadow-md">
                  <Palette className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-xl font-bold">Customize Your Look</h3>
                <p className="text-muted-foreground">
                  Fine-tune your information and choose from a selection of clean, professional themes to match your style.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-background p-4 shadow-md">
                  <Share2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-xl font-bold">Publish & Share</h3>
                <p className="text-muted-foreground">
                  Get a unique URL for your new web profile. Share it with recruiters, colleagues, and your network.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container flex flex-col items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
                        Ready to stand out?
                    </h2>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Ditch the old resume format and embrace a dynamic web presence. It's fast, easy, and looks great on any device.
                    </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button asChild size="lg">
                        <Link href="/editor">
                            Get Started for Free
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex h-14 items-center border-t px-4 md:px-6">
        <p className="text-xs text-muted-foreground">&copy; 2024 ResumeRack. All rights reserved.</p>
      </footer>
    </div>
  );
}
