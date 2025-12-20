"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Palette, Share2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

  const handleUpload = () => {
    if (!fileName) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a PDF file to upload.',
      });
      return;
    }
    // TODO: Process the file
    toast({
      title: 'Upload Successful!',
      description: `${fileName} has been uploaded. Redirecting to editor...`,
    });
    // Redirect to editor page after a short delay
    setTimeout(() => {
        window.location.href = '/editor';
    }, 2000);
  };

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

              <Card className="w-full max-w-lg p-6">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-bold">Upload Your Resume</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <label htmlFor="resume-upload" className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-accent/50 p-8 text-center transition-colors hover:bg-accent">
                    <UploadCloud className="mb-4 h-12 w-12 text-primary" />
                    <p className="font-semibold text-primary">Click to browse or drag & drop</p>
                    <p className="text-sm text-muted-foreground">PDF only, up to 5MB</p>
                    {fileName && <p className="mt-4 text-sm font-medium text-foreground">Selected: {fileName}</p>}
                  </label>
                  <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  <Button size="lg" className="w-full" onClick={handleUpload}>
                    Create Your Profile Page
                  </Button>
                </CardContent>
              </Card>

              <div className="space-x-4">
                  <span className="text-sm text-muted-foreground">Or, you can</span>
                <Button asChild size="lg" variant="outline">
                  <Link href="/editor">Build Manually</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-accent py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
             <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">How it Works</div>
                    <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">A Simple 3-Step Process</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Go from a static document to a live, professional web presence in just a few clicks.
                    </p>
                  </div>
                  <ul className="grid gap-6">
                    <li>
                      <div className="grid gap-1">
                         <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                            <h3 className="font-headline text-xl font-bold">Upload & Go</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Just upload your resume. We'll parse the details and build your profile foundation automatically.
                        </p>
                      </div>
                    </li>
                    <li>
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                            <h3 className="font-headline text-xl font-bold">Customize Your Look</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Fine-tune your information and choose a clean, professional theme to match your style.
                        </p>
                      </div>
                    </li>
                    <li>
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                            <h3 className="font-headline text-xl font-bold">Publish & Share</h3>
                        </div>
                        <p className="text-muted-foreground">
                          Get a unique URL for your new web profile. Share it with recruiters, colleagues, and your network.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                 <img
                    alt="How it works"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                    height="310"
                    src="https://picsum.photos/seed/resume-demo/550/310"
                    width="550"
                    data-ai-hint="resume demo"
                  />
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
