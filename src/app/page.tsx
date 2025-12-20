
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, Edit, Share2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LoginDialog } from '@/components/login-dialog';
import { useUser } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
        setFileName(file.name);
      } else {
        toast({
            variant: 'destructive',
            title: 'Invalid File',
            description: 'Please select a PDF file under 5MB.',
        });
        event.target.value = ''; // Reset file input
        setFileName(null);
      }
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
    toast({
      title: 'Upload Successful!',
      description: `We've processed ${fileName}. Now, create an account to edit and publish your profile.`,
    });
    router.push('/signup?from=upload');
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-8 text-center">
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Turn Your Resume into a Website
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
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
                <label htmlFor="resume-upload" className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:bg-accent/50">
                    <UploadCloud className="mr-4 h-8 w-8 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {fileName ? `Selected: ${fileName}` : 'Drag & drop or click to upload PDF'}
                    </span>
                    <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                </label>
                <Button size="lg" className="w-full mt-4" onClick={handleUpload}>
                    Create Your Profile Page
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <LoginDialog />
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5" />
                    <span>Upload Resume</span>
                  </div>
                  <ArrowRight className="h-5 w-5 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    <span>Customize Profile</span>
                  </div>
                  <ArrowRight className="h-5 w-5 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    <span>Publish & Share</span>
                  </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
