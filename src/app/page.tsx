
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UploadCloud, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LoginDialog } from '@/components/login-dialog';
import { useUser } from '@/auth';

function StepIndicator({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">{num}</div>
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StepDivider() {
  return <div className="h-px flex-1 mx-4 bg-border hidden sm:block" />;
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF file under 10MB.' });
        event.target.value = '';
        return;
      }

      setIsProcessingFile(true);
      toast({ title: 'Parsing CV...', description: 'Extracting your details, just a moment.' });

      try {
        const formData = new FormData();
        formData.append('resume', file);
        const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Failed to parse resume');
        const parsed = await res.json();
        sessionStorage.setItem('parsedResume', JSON.stringify(parsed));
        router.push('/editor');
      } catch {
        // Fallback: store raw PDF for processing after sign-in
        const reader = new FileReader();
        reader.onload = (e) => {
          sessionStorage.setItem('pendingResume', e.target?.result as string);
          sessionStorage.setItem('pendingResumeName', file.name);
          router.push('/editor');
        };
        reader.readAsDataURL(file);
      } finally {
        event.target.value = '';
        setIsProcessingFile(false);
      }
    }
  };


  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-2xl p-4 transition-colors dark:bg-white dark:shadow-md">
            <Image
              src="/images/cvtopdf.png"
              alt="CVin.Bio | Turn your CV into a website"
              width={250}
              height={250}
              className="mb-0"
              priority
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Turn Your CV into a Website
            </h1>

          </div>
          
          {(isUserLoading) ? null : user ? (
             <div className="w-full max-w-md">
                <Button size="lg" className="w-full mt-2" asChild>
                    <Link href="/editor">Go to Your Editor</Link>
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                    Welcome back, {user.user_metadata?.full_name || user.email}!
                </p>
            </div>
          ) : (
            <>
              <div className="w-full max-w-md space-y-3">
                <label htmlFor="resume-upload" className={`flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:bg-accent ${isProcessingFile ? 'cursor-wait' : ''}`}>
                    {isProcessingFile ? (
                        <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Processing file...</span>
                        </>
                    ) : (
                       <>
                            <UploadCloud className="mr-3 h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Upload your CV
                            </span>
                       </>
                    )}
                    <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={isProcessingFile} />
                </label>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground uppercase">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link href="/editor">
                    <Edit className="mr-2 h-4 w-4" />
                    Enter details manually
                  </Link>
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{' '}
                  <LoginDialog />
                </p>
              </div>

              <div className="flex flex-row items-center justify-between w-full max-w-md text-muted-foreground pt-4 px-2">
                <StepIndicator num={1} label="Upload" />
                <StepDivider />
                <StepIndicator num={2} label="Customize" />
                <StepDivider />
                <StepIndicator num={3} label="Publish" />
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
