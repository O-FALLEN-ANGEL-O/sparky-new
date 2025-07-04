'use server';

/**
 * @fileOverview An AI-powered smart search flow for product discovery.
 *
 * - aiSmartSearch - A function that performs the AI-based product search.
 * - AISmartSearchInput - The input type for the aiSmartSearch function.
 * - AISmartSearchOutput - The return type for the aiSmartSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AISmartSearchInputSchema = z.object({
  query: z.string().describe('The natural language query to search for products.'),
});
export type AISmartSearchInput = z.infer<typeof AISmartSearchInputSchema>;

const AISmartSearchOutputSchema = z.object({
  results: z.array(z.string()).describe('A list of product names that match the query.'),
});
export type AISmartSearchOutput = z.infer<typeof AISmartSearchOutputSchema>;

export async function aiSmartSearch(input: AISmartSearchInput): Promise<AISmartSearchOutput> {
  return aiSmartSearchFlow(input);
}

const aiSmartSearchPrompt = ai.definePrompt({
  name: 'aiSmartSearchPrompt',
  input: {schema: AISmartSearchInputSchema},
  output: {schema: AISmartSearchOutputSchema},
  prompt: `You are a helpful product search assistant. Given the user's query, find relevant products from the catalog.

  Query: {{{query}}}

  Return a list of product names that match the query.
  `,
});

const aiSmartSearchFlow = ai.defineFlow(
  {
    name: 'aiSmartSearchFlow',
    inputSchema: AISmartSearchInputSchema,
    outputSchema: AISmartSearchOutputSchema,
  },
  async input => {
    const {output} = await aiSmartSearchPrompt(input);
    return output!;
  }
);
