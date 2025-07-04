import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import { getJobs } from '@/lib/db';
import type { Job } from '@/lib/mock-data';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Briefcase, Building } from 'lucide-react';
import Image from 'next/image';

export default async function CareersPage() {
  const jobs = await getJobs();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 flex items-center justify-center text-center text-white bg-secondary">
          <div className="container px-4 md:px-6 space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline tracking-tight text-primary">
              Craft Your Future at Sparkle
            </h1>
            <p className="max-w-[700px] mx-auto text-lg md:text-xl text-secondary-foreground/80">
              Join our team of passionate artisans, designers, and innovators dedicated to crafting timeless Indian elegance.
            </p>
          </div>
        </section>

        {/* Testimonials/Culture Section */}
        <section className="py-16 md:py-24 bg-accent">
            <div className="container px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-headline text-primary mb-4">A Culture of Craftsmanship & Creativity</h2>
                        <p className="text-muted-foreground mb-6">
                            At Sparkle, we believe that our greatest asset is our people. We foster a collaborative environment where creativity is celebrated, and every team member plays a vital role in our story. Hear from some of our team about what it's like to work here.
                        </p>
                        <div className="space-y-4">
                            <blockquote className="border-l-4 border-primary pl-4 italic">
                                "The attention to detail and passion for quality is infectious. It's more than a job; it's being part of creating something beautiful."
                                <cite className="block text-sm font-semibold mt-2 not-italic">- Alex, Lead Artisan</cite>
                            </blockquote>
                            <blockquote className="border-l-4 border-primary pl-4 italic">
                                "I love that my ideas are heard and that I get to work with some of the most talented people in the industry."
                                <cite className="block text-sm font-semibold mt-2 not-italic">- Maria, Jewelry Designer</cite>
                            </blockquote>
                        </div>
                    </div>
                    <div>
                        <Image 
                            src="https://placehold.co/600x400.png"
                            width={600}
                            height={400}
                            alt="Team at Sparkle"
                            className="rounded-lg shadow-xl"
                            data-ai-hint="diverse team working"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* Job Listings Section */}
        <section id="open-positions" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-headline text-primary">Open Positions</h2>
              <p className="max-w-[600px] mx-auto text-muted-foreground md:text-lg">
                We're always looking for talented individuals to join our team. Explore our current openings below.
              </p>
            </div>
            <div className="grid gap-6 max-w-4xl mx-auto">
              {jobs.map((job: Job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-2">
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {job.department}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                        </div>
                         <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {job.type}
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild>
                      <Link href={`/careers/${job.id}`}>
                        View Details & Apply
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
