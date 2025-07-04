'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { getProducts } from '@/lib/db';
import type { Product } from '@/lib/mock-data';
import { StockStatusBadge } from './stock-status-badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function LiveInventoryTable() {
    const [inventory, setInventory] = useState<Product[]>([]);
    const [updatedRow, setUpdatedRow] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            const initialInventory = await getProducts();
            setInventory(initialInventory);
            setLoading(false);
        }
        fetchInventory();
    }, []);

    useEffect(() => {
        if (loading) return;

        const interval = setInterval(() => {
            setInventory(prevInventory => {
                const newInventory = [...prevInventory];
                if (newInventory.length === 0) return newInventory;

                const randomIndex = Math.floor(Math.random() * newInventory.length);
                const productToUpdate = { ...newInventory[randomIndex] };
                
                // Simulate stock change (decrease or small increase)
                const change = Math.random() > 0.8 ? 1 : -1 * Math.floor(Math.random() * 3);
                productToUpdate.stock = Math.max(0, productToUpdate.stock + change);
                
                newInventory[randomIndex] = productToUpdate;
                setUpdatedRow(productToUpdate.id);
                return newInventory;
            });

            // Reset highlight after animation
            setTimeout(() => setUpdatedRow(null), 1000);

        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [loading]);

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {inventory.map((product) => (
                    <TableRow key={product.id} className={cn(updatedRow === product.id ? 'bg-accent/80 transition-colors duration-1000' : 'transition-colors duration-1000')}>
                        <TableCell>
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={60}
                                height={60}
                                className="rounded-md"
                                data-ai-hint="jewelry piece"
                            />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-xs">SKL-{product.id.toUpperCase()}-00{product.stock}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-center font-bold text-lg">
                           <AnimatePresence mode="wait">
                                <motion.div
                                    key={product.stock}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {product.stock}
                                </motion.div>
                            </AnimatePresence>
                        </TableCell>
                        <TableCell className="text-right">
                            <StockStatusBadge stock={product.stock} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
