import Link from 'next/link';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Github, Twitter, Instagram } from 'lucide-react';

const footerLinks = {
  shop: [
    { title: 'Rings', href: '#' },
    { title: 'Necklaces', href: '#' },
    { title: 'Bracelets', href: '#' },
    { title: 'New Arrivals', href: '#' },
  ],
  about: [
    { title: 'Our Story', href: '#' },
    { title: 'Ethical Sourcing', href: '#' },
    { title: 'Press', href: '#' },
    { title: 'Careers', href: '/careers' },
  ],
  support: [
    { title: 'Contact Us', href: '#' },
    { title: 'FAQ', href: '#' },
    { title: 'Shipping & Returns', href: '#' },
    { title: 'Care Guide', href: '#' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', name: 'Twitter' },
  { icon: Instagram, href: '#', name: 'Instagram' },
  { icon: Github, href: '#', name: 'Github' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-secondary text-secondary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <Logo />
            <p className="mt-4 text-sm text-secondary-foreground/80">
              Crafting timeless memories, one jewel at a time.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-headline text-lg mb-4">Shop</h3>
                <ul className="space-y-2">
                  {footerLinks.shop.map(link => (
                    <li key={link.title}>
                      <Link href={link.href} className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-headline text-lg mb-4">About</h3>
                <ul className="space-y-2">
                  {footerLinks.about.map(link => (
                    <li key={link.title}>
                      <Link href={link.href} className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-headline text-lg mb-4">Support</h3>
                <ul className="space-y-2">
                  {footerLinks.support.map(link => (
                    <li key={link.title}>
                      <Link href={link.href} className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-headline text-lg mb-4">Stay Connected</h3>
            <p className="text-sm text-secondary-foreground/80 mb-4">
              Get updates on new collections and exclusive offers.
            </p>
            <form className="flex gap-2">
              <Input placeholder="Your Email" className="bg-muted border-border/30" />
              <Button>Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/60">
            © {new Date().getFullYear()} Sparkle. All rights reserved.
          </p>
          <div className="flex gap-4">
            {socialLinks.map(link => (
              <Link key={link.name} href={link.href} aria-label={link.name} className="text-secondary-foreground/60 hover:text-primary transition-colors">
                <link.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
