'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Delivery, DeliveryStatus } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeliveryStatusBadge } from '@/components/delivery/delivery-status-badge';
import { CheckCircle, Eye, ShieldCheck, Upload, Ban, Loader2 } from 'lucide-react';
import Image from 'next/image';

export function DeliveryDetailView({ initialDelivery }: { initialDelivery: Delivery }) {
  const router = useRouter();
  const { toast } = useToast();
  const [delivery, setDelivery] = useState<Delivery>(initialDelivery);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = (newStatus: DeliveryStatus) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        setDelivery(prev => prev ? { ...prev, status: newStatus } : prev);
        toast({
            title: `Order Status Updated`,
            description: `Order is now marked as "${newStatus.replace(/_/g, ' ')}".`,
        });
        if (newStatus === 'out_for_delivery') {
            toast({
                title: 'WhatsApp Notification Sent',
                description: 'Customer has been notified that their order is on the way.'
            });
        }
        setIsLoading(false);
    }, 1000);
  }

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
        toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please enter the 6-digit code.'});
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        if (otp === delivery.otpCode) {
            setDelivery(prev => prev ? { ...prev, verified: true, status: 'delivered' } : prev);
            toast({
                title: 'Delivery Verified!',
                description: 'OTP is correct. Order marked as delivered.',
            });
            // In a real app, you would redirect after success
            // router.push('/delivery-agent');
        } else {
            toast({ variant: 'destructive', title: 'Verification Failed', description: 'The OTP code is incorrect. Please try again.' });
        }
        setIsLoading(false);
        setOtp('');
    }, 1500);
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Delivery for {delivery.orderId}</h1>
                <p className="text-muted-foreground">To: {delivery.customer.name}</p>
            </div>
            <DeliveryStatusBadge status={delivery.status} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{delivery.customer.name}</p>
                <p className="text-muted-foreground">{delivery.customer.address}</p>
                <p className="text-muted-foreground">{delivery.customer.phone}</p>
                 <div className="h-48 mt-4 w-full bg-muted rounded-lg flex items-center justify-center">
                    <Image 
                        src="https://placehold.co/800x300.png"
                        width={800}
                        height={300}
                        alt="Map placeholder"
                        className="object-cover rounded-md"
                        data-ai-hint="city map route"
                    />
                </div>
            </CardContent>
        </Card>

        {delivery.status !== 'delivered' && !delivery.verified && (
        <Card>
            <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>Keep the customer and admin informed.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
                <Button 
                    onClick={() => handleStatusUpdate('out_for_delivery')} 
                    disabled={isLoading || delivery.status === 'out_for_delivery'}
                    className="flex-1"
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Eye className="mr-2 h-4 w-4" />}
                    Out for Delivery
                </Button>
                <Button 
                    variant="destructive"
                    onClick={() => handleStatusUpdate('failed')} 
                    disabled={isLoading}
                    className="flex-1"
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Ban className="mr-2 h-4 w-4" />}
                    Mark as Failed
                </Button>
            </CardContent>
        </Card>
        )}

        {delivery.status === 'out_for_delivery' && !delivery.verified && (
        <Card className="border-primary shadow-lg">
            <CardHeader>
                <CardTitle>Security Code Verification</CardTitle>
                <CardDescription>Enter the 6-digit code provided by the customer to complete the delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Label htmlFor="otp">Enter 6-Digit Code</Label>
                 <div className="flex gap-2">
                    <Input 
                        id="otp" 
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="_ _ _ _ _ _"
                        className="text-2xl tracking-[0.5em] text-center font-mono"
                    />
                    <Button onClick={handleVerifyOtp} disabled={isLoading} size="lg">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Verify
                    </Button>
                </div>
            </CardContent>
        </Card>
        )}
        
        {delivery.verified && delivery.status === 'delivered' && (
            <>
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400"/>
                    <div>
                        <CardTitle className="text-green-800 dark:text-green-300">Delivery Complete & Verified</CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-400">The customer has received their order securely.</CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Proof of Delivery</CardTitle>
                    <CardDescription>Upload a photo as final confirmation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {delivery.proofImageUrl ? (
                        <Image src={delivery.proofImageUrl} alt="Proof of delivery" width={600} height={400} className="rounded-md" data-ai-hint="delivered package"/>
                    ) : (
                        <>
                            <Label htmlFor="proof">Upload Photo</Label>
                            <Input id="proof" type="file" />
                            <Button className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                Upload Proof
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
            </>
        )}
    </div>
  );
}
