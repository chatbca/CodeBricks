'use server';

/**
 * @fileOverview This file defines a Genkit flow for optimizing code snippets.
 *
 * - optimizeCodeSnippet - A function that takes a code snippet and suggests improvements.
 * - OptimizeCodeSnippetInput - The input type for the optimizeCodeSnippet function.
 * - OptimizeCodeSnippetOutput - The output type for the optimizeCodeSnippet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeCodeSnippetInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be optimized.'),
  language: z.string().describe('The programming language of the code snippet.'),
});

export type OptimizeCodeSnippetInput = z.infer<typeof OptimizeCodeSnippetInputSchema>;

const OptimizeCodeSnippetOutputSchema = z.object({
  optimizedCode: z.string().describe('The optimized code snippet with improvements.'),
  explanation: z
    .string()
    .describe('An explanation of the optimizations made to the code snippet.'),
});

export type OptimizeCodeSnippetOutput = z.infer<typeof OptimizeCodeSnippetOutputSchema>;

export async function optimizeCodeSnippet(
  input: OptimizeCodeSnippetInput
): Promise<OptimizeCodeSnippetOutput> {
  return optimizeCodeSnippetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeCodeSnippetPrompt',
  input: {schema: OptimizeCodeSnippetInputSchema},
  output: {schema: OptimizeCodeSnippetOutputSchema},
  prompt: `You are an expert code optimizer. You will receive a code snippet and your task is to improve the code for performance and readability.

    Language: {{{language}}}
    Code Snippet:
    \`\`\`{{{language}}}
    {{{codeSnippet}}}
    \`\`\`

    Provide the optimized code snippet and explain the optimizations you made.
    `,
});

const optimizeCodeSnippetFlow = ai.defineFlow(
  {
    name: 'optimizeCodeSnippetFlow',
    inputSchema: OptimizeCodeSnippetInputSchema,
    outputSchema: OptimizeCodeSnippetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
