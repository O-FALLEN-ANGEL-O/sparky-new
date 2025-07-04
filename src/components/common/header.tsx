'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '../logo';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { AISearch } from './ai-search';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { LoginDialog } from './login-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navLinks = [
  { href: '/#collections', label: 'Collections' },
  { href: '/#featured-products', label: 'Products' },
  { href: '/careers', label: 'Careers' },
  { href: '#', label: 'About Us' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user, logout } = useAuth();

  const textClass = 'text-secondary-foreground';

  const iconButtonClass = cn(
    'hover:bg-white/10 data-[state=open]:bg-white/10',
    textClass
  );

  const outlineButtonClass = cn(
    'transition-colors',
    'bg-transparent',
    'border-secondary-foreground/50 hover:bg-secondary-foreground hover:text-secondary',
    textClass
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'bg-secondary' // Always use the dark secondary background
      )}
    >
      <div className="container flex h-20 items-center">
        {/* Left Side (for mobile menu) */}
        <div className="flex items-center md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('md:hidden', iconButtonClass)}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-background w-3/4 sm:max-w-xs"
            >
              <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                <Logo />
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSheetOpen(false)}
                    className={cn(
                      'transition-colors hover:text-primary',
                      pathname === link.href ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex flex-1 justify-start">
          <Logo className={textClass} />
        </div>

        {/* Centered Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                textClass,
                pathname === link.href && 'text-primary'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Logo */}
        <div className="flex flex-1 justify-center md:hidden">
          <Logo className={textClass} />
        </div>

        {/* Right Side */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden md:flex">
            <AISearch className={iconButtonClass} />
            <ThemeToggle className={iconButtonClass} />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'relative h-10 w-10 rounded-full',
                    iconButtonClass
                  )}
                >
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hi, {user.name}!</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginDialog>
              <Button variant="outline" className={outlineButtonClass}>
                Login
              </Button>
            </LoginDialog>
          )}

          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn('relative', iconButtonClass)}
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                2
              </span>
              <span className="sr-only">Shopping Cart</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
