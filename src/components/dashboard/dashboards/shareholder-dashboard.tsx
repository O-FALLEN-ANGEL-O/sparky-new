'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RevenueChart } from "../owner/revenue-chart";
import { PayrollChart } from "../charts/payroll-chart";
import { InventoryPieChart } from "../charts/inventory-pie-chart";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getProducts, getPayrollData } from "@/lib/db";
import type { Product, Payroll } from "@/lib/mock-data";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        </div>
    )
}

export function ShareholderDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [payrollData, setPayrollData] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        const [productsData, payroll] = await Promise.all([
            getProducts(),
            getPayrollData()
        ]);
        setProducts(productsData);
        setPayrollData(payroll);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
      return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shareholder Dashboard</h1>
        <p className="text-muted-foreground">High-level view of company growth and key performance indicators.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Profit & Margin Trends</CardTitle>
                <CardDescription>Showing financial performance for the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <RevenueChart />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Top Performing Stores</CardTitle>
                <CardDescription>Revenue by store location.</CardDescription>
            </CardHeader>
            <CardContent>
                <PayrollChart data={payrollData} />
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Our most popular items this quarter.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Carousel opts={{ loop: true }}>
                        <CarouselContent>
                            {products.slice(0, 5).map(product => (
                                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center p-2 aspect-square">
                                            <Image src={product.images[0]} alt={product.name} width={150} height={150} className="rounded-md" data-ai-hint="jewelry piece" />
                                            <p className="font-semibold mt-2 text-center text-sm">{product.name}</p>
                                            <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </CardContent>
            </Card>
        </div>
        <div>
            <InventoryPieChart />
        </div>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Monthly Report Highlights</CardTitle>
          <CardDescription>
            Download your comprehensive monthly shareholder reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <h3 className="font-semibold">Q3 2024 Shareholder Summary</h3>
                    <p className="text-sm text-muted-foreground">Complete financial and performance breakdown.</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
