import { Suspense } from 'react';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import ProductGrid from '@/components/products/product-grid';
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowRight, Star, Award, ShieldCheck, Truck, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTestimonials } from '@/lib/db';
import type { Testimonial } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';

const collections = [
  { name: 'Rings Collection', href: '#', image: 'https://placehold.co/400x500.png', hint: 'rings collection' },
  { name: 'Necklaces Collection', href: '#', image: 'https://placehold.co/400x500.png', hint: 'necklaces collection' },
  { name: 'Bracelets Collection', href: '#', image: 'https://placehold.co/400x500.png', hint: 'bracelets collection' },
  { name: 'Earrings Collection', href: '#', image: 'https://placehold.co/400x500.png', hint: 'earrings collection' },
];

const features = [
  { icon: Award, title: 'Master Craftsmanship', description: 'Timeless designs, expertly crafted to last a lifetime.' },
  { icon: ShieldCheck, title: 'Ethically Sourced', description: '100% conflict-free diamonds and recycled precious metals.' },
  { icon: Truck, title: 'Insured Shipping', description: 'Free, fast, and secure delivery right to your doorstep.' },
  { icon: HeartHandshake, title: 'Lifetime Warranty', description: 'We stand behind our quality with a lifetime guarantee.' },
]

async function TestimonialsSection() {
  const testimonials = await getTestimonials();
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary text-secondary-foreground">
      <div className="container px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-headline text-primary">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial: Testimonial) => (
            <div key={testimonial.name} className="bg-background/10 p-6 rounded-lg flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-primary fill-primary" />)}
              </div>
              <p className="text-lg italic mb-4">&quot;{testimonial.quote}&quot;</p>
              <p className="font-semibold font-headline text-lg">{testimonial.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center text-secondary-foreground">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Hero background"
            fill
            className="object-cover z-0"
            data-ai-hint="elegant jewelry lifestyle"
            priority
          />
          <div className="absolute inset-0 bg-black/70 z-10"></div>
          <div className="container relative z-20 px-4 md:px-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline tracking-tight">
              Timeless Elegance, Crafted For You
            </h1>
            <p className="max-w-[700px] mx-auto text-lg md:text-xl text-secondary-foreground/90">
              Discover our exquisite collection of handcrafted jewelry, where every piece tells a story of beauty, passion, and artisanal excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="#featured-products">Shop Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-secondary-foreground/50 hover:bg-secondary-foreground hover:text-secondary text-secondary-foreground">
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section id="collections" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-headline text-primary">Our Collections</h2>
              <p className="max-w-[600px] mx-auto text-muted-foreground md:text-lg">
                Explore our curated collections, each with a unique inspiration and story.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((collection) => (
                <Link key={collection.name} href={collection.href} className="group relative block overflow-hidden rounded-lg">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    width={400}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    data-ai-hint={collection.hint}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-2xl font-headline text-white text-center">{collection.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="featured-products" className="w-full py-12 md:py-24 lg:py-32 bg-accent">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">
                Featured Products
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From timeless classics to modern statements, find the perfect piece that tells your story.
              </p>
            </div>
            <div className="mx-auto max-w-7xl">
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                <ProductGrid />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-headline text-primary">Why Choose Sparkle</h2>
              <p className="max-w-[600px] mx-auto text-muted-foreground md:text-lg">
                We are dedicated to providing you with an exceptional experience.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center space-y-3">
                  <div className="bg-accent p-4 rounded-full">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TestimonialsSection />
        
        {/* Newsletter CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-accent">
            <div className="container px-4 md:px-6">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-headline text-primary">Join Our Exclusive Circle</h2>
                    <p className="text-muted-foreground md:text-lg">
                        Be the first to know about new collections, special events, and exclusive offers.
                    </p>
                    <form className="flex gap-2 max-w-md mx-auto">
                        <Input placeholder="Enter your email" type="email" className="flex-1"/>
                        <Button type="submit">Subscribe</Button>
                    </form>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
