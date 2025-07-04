'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { aiSmartSearch } from '@/ai/flows/ai-smart-search';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  query: z.string().min(3, 'Search query must be at least 3 characters.'),
});

export function AISearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResults([]);
    try {
      const response = await aiSmartSearch({ query: values.query });
      setResults(response.results);
      if (response.results.length === 0) {
        toast({
            title: 'No Results Found',
            description: "Your AI search didn't return any products.",
        });
      }
    } catch (error) {
      console.error('AI Search Error:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to perform AI search. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("hover:bg-white/10 data-[state=open]:bg-white/10", className)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Open AI Search</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
              <h4 className="font-medium leading-none">AI Smart Search</h4>
              <p className="text-sm text-muted-foreground">Describe the jewelry you're looking for.</p>
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g., a gold necklace with a small diamond"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </Form>
        {results.length > 0 && (
             <div className="p-4 border-t">
                <h4 className="font-medium leading-none mb-4">Search Results</h4>
                <ul className="grid gap-2">
                {results.map((item, index) => (
                    <li
                    key={index}
                    className="text-sm p-2 hover:bg-accent rounded-md"
                    >
                    {item}
                    </li>
                ))}
                </ul>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
