'use server';
/**
 * @fileOverview This file defines a Genkit flow for identifying and fixing bugs in code snippets.
 *
 * - fixBugsInCode - A function that takes a code snippet and returns a suggestion for fixing bugs.
 * - FixBugsInCodeInput - The input type for the fixBugsInCode function.
 * - FixBugsInCodeOutput - The return type for the fixBugsInCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FixBugsInCodeInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be analyzed for bugs.'),
  language: z.string().describe('The programming language of the code snippet.'),
});
export type FixBugsInCodeInput = z.infer<typeof FixBugsInCodeInputSchema>;

const FixBugsInCodeOutputSchema = z.object({
  bugIdentification: z.string().describe('A description of the bug identified in the code snippet.'),
  suggestedFix: z.string().describe('A suggestion for fixing the identified bug.'),
  fixedCodeSnippet: z.string().optional().describe('The code snippet with the bug fixed, if applicable.'),
});
export type FixBugsInCodeOutput = z.infer<typeof FixBugsInCodeOutputSchema>;

export async function fixBugsInCode(input: FixBugsInCodeInput): Promise<FixBugsInCodeOutput> {
  return fixBugsInCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fixBugsInCodePrompt',
  input: {schema: FixBugsInCodeInputSchema},
  output: {schema: FixBugsInCodeOutputSchema},
  prompt: `You are an expert software developer specializing in debugging code.

You will analyze the provided code snippet and identify any bugs present. Then, you will suggest a fix for the bug.

If no bug is found, explicitly state that no bug was found.  Provide the fixed code snippet only if a bug was found and fixed.

Language: {{{language}}}
Code Snippet:
{{codeSnippet}}`,
});

const fixBugsInCodeFlow = ai.defineFlow(
  {
    name: 'fixBugsInCodeFlow',
    inputSchema: FixBugsInCodeInputSchema,
    outputSchema: FixBugsInCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
