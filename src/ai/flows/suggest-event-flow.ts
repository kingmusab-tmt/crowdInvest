
'use server';
/**
 * @fileOverview An AI flow for suggesting event descriptions.
 * 
 * - suggestEventDescription - A function that generates an event description based on a title.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestEventDescriptionInputSchema = z.string();
const SuggestEventDescriptionOutputSchema = z.string();

export async function suggestEventDescription(title: string): Promise<string> {
    return suggestEventDescriptionFlow(title);
}

const prompt = ai.definePrompt({
    name: 'suggestEventDescriptionPrompt',
    input: { schema: SuggestEventDescriptionInputSchema },
    output: { schema: SuggestEventDescriptionOutputSchema },
    prompt: `You are an expert event planner. Given the following event title, write a short, engaging description for it. The description should be suitable for a community investment platform.

Event Title: {{{input}}}

Description:`,
});

const suggestEventDescriptionFlow = ai.defineFlow(
    {
        name: 'suggestEventDescriptionFlow',
        inputSchema: SuggestEventDescriptionInputSchema,
        outputSchema: SuggestEventDescriptionOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

    