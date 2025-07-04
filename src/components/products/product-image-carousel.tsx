'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ProductImageCarouselProps = {
  images: string[];
  alt: string;
};

export function ProductImageCarousel({ images, alt }: ProductImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="space-y-4">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((src, index) => (
            <CarouselItem key={index}>
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-0">
                  <Image
                    src={src}
                    alt={`${alt} - view ${index + 1}`}
                    width={600}
                    height={600}
                    className="object-cover rounded-lg"
                    data-ai-hint="jewelry detail"
                    priority={index === 0}
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4"/>
        <CarouselNext className="right-4"/>
      </Carousel>
      <div className="flex gap-2 justify-center">
        {images.map((_, index) => (
            <button key={index} onClick={() => api?.scrollTo(index)}>
                <div className={cn("h-2 w-10 rounded-full", current === index + 1 ? "bg-primary" : "bg-muted-foreground/50")}></div>
            </button>
        ))}
      </div>
    </div>
  );
}
