'use client';

import { useState } from 'react';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import type { Job } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function JobApplicationView({ job }: { job: Job }) {
  const [resume, setResume] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        setResume(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // Simulate form submission and resume parsing
    setTimeout(() => {
        setIsLoading(false);
        toast({
            title: 'Application Submitted!',
            description: `Your application for the ${job.title} position has been received.`,
        });
        // Reset form or redirect user
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link href="/careers" className="text-sm text-primary hover:underline mb-4 inline-block">&larr; Back to all openings</Link>
                <h1 className="text-4xl font-bold font-headline text-primary">{job.title}</h1>
                <p className="text-muted-foreground mt-2">{job.location} &bull; {job.department} &bull; {job.type}</p>
            </div>
            
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
                <div className="prose prose-lg max-w-none text-foreground/90 dark:prose-invert">
                    <h2 className="font-headline text-2xl">Job Description</h2>
                    <p>{job.description}</p>
                    <h2 className="font-headline text-2xl mt-8">Requirements</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        {job.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                        ))}
                    </ul>
                </div>
                
                <Card className="sticky top-28 shadow-lg">
                    <CardHeader>
                        <CardTitle>Apply Now</CardTitle>
                        <CardDescription>Fill out the form below to submit your application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" type="text" placeholder="Your Name" required/>
                            </div>
                             <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="you@example.com" required/>
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" placeholder="(123) 456-7890" />
                            </div>
                             <div>
                                <Label htmlFor="resume">Resume/CV</Label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        {resume ? (
                                            <>
                                                <Check className="mx-auto h-12 w-12 text-green-500"/>
                                                <p className="text-sm text-muted-foreground">{resume.name}</p>
                                                <button type="button" onClick={() => setResume(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <div className="flex text-sm text-muted-foreground">
                                                    <label htmlFor="resume-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                                        <span>Upload a file</span>
                                                        <input id="resume-upload" name="resume-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" required />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                                <Textarea id="cover-letter" placeholder="Tell us why you're a great fit..." />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
