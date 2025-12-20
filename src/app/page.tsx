
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UploadCloud, Edit, Share2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LoginDialog } from '@/components/login-dialog';
import { useUser } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) {
        toast({
            variant: 'destructive',
            title: 'Invalid File',
            description: 'Please select a PDF file under 10MB.',
        });
        event.target.value = ''; // Reset file input
        return;
      }

      setIsProcessingFile(true);
      toast({
        title: 'Resume Selected!',
        description: `Next, create an account to generate your profile.`,
      });

      try {
        // Read the file as a Data URL and store it in session storage
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          sessionStorage.setItem('pendingResume', dataUrl);
          sessionStorage.setItem('pendingResumeName', file.name);
          router.push('/signup?from=upload');
        };
        reader.onerror = () => {
          throw new Error('Could not read the file.');
        }
        reader.readAsDataURL(file);

      } catch (error) {
         toast({
            variant: 'destructive',
            title: 'File Error',
            description: 'Could not process the selected file.',
        });
        setIsProcessingFile(false);
      } finally {
        event.target.value = ''; // Reset file input
      }
    }
  };


  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-8 text-center">
          
          <Image 
            src="/images/cvtopdf.png"
            alt="Resume to Website"
            width={300}
            height={300}
            className="mb-4"
          />

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Turn Your Resume into a Website
            </h1>
            <p className="mx-auto text-muted-foreground md:text-xl">
              Stop sending PDFs. Get a professional, shareable web page in minutes.
            </p>
          </div>
          
          {(isUserLoading) ? null : user ? (
             <div className="w-full max-w-md">
                <Button size="lg" className="w-full mt-4" asChild>
                    <Link href="/editor">Go to Your Editor</Link>
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">
                    Welcome back, {user.displayName || user.email}!
                </p>
            </div>
          ) : (
            <>
              <div className="w-full max-w-md">
                <label htmlFor="resume-upload" className={`flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:bg-accent/50 ${isProcessingFile ? 'cursor-wait' : ''}`}>
                    {isProcessingFile ? (
                        <>
                            <Loader2 className="mr-4 h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">Processing file...</span>
                        </>
                    ) : (
                       <>
                            <UploadCloud className="mr-4 h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Drag & drop or click to upload PDF
                            </span>
                       </>
                    )}
                    <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={isProcessingFile} />
                </label>
                <p className="mt-4 text-sm text-muted-foreground">
                  Your profile will be generated automatically. <br/>
                  Already have an account?{' '}
                  <LoginDialog />
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-muted-foreground pt-8">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">1</div>
                    <span className="font-medium">Upload Resume</span>
                  </div>
                  <div className="h-px w-8 bg-border md:block hidden"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">2</div>
                    <span className="font-medium">Customize Profile</span>
                  </div>
                   <div className="h-px w-8 bg-border md:block hidden"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">3</div>
                    <span className="font-medium">Publish & Share</span>
                  </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
