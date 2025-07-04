'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, X } from 'lucide-react';
import { getCartItems } from '@/lib/db';
import type { Product } from '@/lib/mock-data';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(getCartItems());

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        removeItem(productId);
        return;
    };
    setCartItems(
      cartItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.product.id !== productId));
  };
  
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-16">
            <h1 className="text-4xl font-bold font-headline text-primary tracking-tight sm:text-5xl">Your Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
            <div className="text-center">
                <p className="text-xl text-muted-foreground mb-6">Your cart is empty.</p>
                <Button asChild size="lg">
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
        ) : (
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px]">Product</TableHead>
                        <TableHead></TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cartItems.map(({ product, quantity }) => (
                        <TableRow key={product.id}>
                            <TableCell>
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={100}
                                height={100}
                                className="rounded-lg"
                                data-ai-hint="jewelry piece"
                            />
                            </TableCell>
                            <TableCell className="font-medium">
                                <Link href={`/products/${product.id}`} className="hover:text-primary">{product.name}</Link>
                                <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
                            </TableCell>
                            <TableCell>
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity - 1)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center text-lg font-medium">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-lg">${(product.price * quantity).toFixed(2)}</TableCell>
                            <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(product.id)}>
                                <X className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                
                <Card className="sticky top-28 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Tax (8%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button size="lg" className="w-full">
                            Proceed to Checkout
                        </Button>
                        <Link href="/" className="text-sm text-primary hover:underline">
                            &larr; Continue Shopping
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
