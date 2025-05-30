
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

const optimizationGoals = [
  'performance', 
  'readability', 
  'conciseness', 
  'modernize',
  'general'
] as const;

const OptimizeCodeSnippetInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be optimized.'),
  language: z.string().describe('The programming language of the code snippet.'),
  optimizationGoal: z.enum(optimizationGoals).optional().describe('The specific goal for optimization (e.g., performance, readability). Default to general if not specified.'),
});

export type OptimizeCodeSnippetInput = z.infer<typeof OptimizeCodeSnippetInputSchema>;

const OptimizeCodeSnippetOutputSchema = z.object({
  optimizedCode: z.string().describe('The optimized code snippet with improvements.'),
  explanation: z
    .string()
    .describe('An explanation of the optimizations made to the code snippet, formatted neatly.'),
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
  prompt: `You are an expert code optimizer. You will receive a code snippet and your task is to improve the code based on the specified optimization goal.

    Language: {{{language}}}
    Optimization Goal: {{{optimizationGoal}}} (If 'general' or not specified, provide overall improvements for performance and readability)
    
    Code Snippet:
    \`\`\`{{{language}}}
    {{{codeSnippet}}}
    \`\`\`

    Provide the optimized code snippet and explain the optimizations you made in a neat, markdown-formatted explanation.
    Focus your explanation and optimizations on the specified goal.
    For 'modernize', focus on converting to modern syntax and patterns for the language.
    For 'conciseness', focus on reducing code length without sacrificing clarity too much.
    For 'performance', focus on speed and efficiency improvements.
    For 'readability', focus on clarity, naming, and structure.
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
