'use server';

/**
 * @fileOverview Explains a code snippet in plain English.
 *
 * - explainCodeSnippet - A function that handles the code explanation process.
 * - ExplainCodeSnippetInput - The input type for the explainCodeSnippet function.
 * - ExplainCodeSnippetOutput - The return type for the explainCodeSnippet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainCodeSnippetInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be explained.'),
  programmingLanguage: z.string().describe('The programming language of the code snippet.'),
});
export type ExplainCodeSnippetInput = z.infer<typeof ExplainCodeSnippetInputSchema>;

const ExplainCodeSnippetOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the code snippet in plain English, formatted neatly.'),
});
export type ExplainCodeSnippetOutput = z.infer<typeof ExplainCodeSnippetOutputSchema>;

export async function explainCodeSnippet(input: ExplainCodeSnippetInput): Promise<ExplainCodeSnippetOutput> {
  return explainCodeSnippetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCodeSnippetPrompt',
  input: {schema: ExplainCodeSnippetInputSchema},
  output: {schema: ExplainCodeSnippetOutputSchema},
  prompt: `You are an expert software developer, skilled at explaining code to junior developers.

  Please explain the following code snippet in plain English, so that a junior developer can understand it.
  Structure your explanation in a neat and organized format.
  Follow these guidelines for the explanation:
  1.  **Overall Purpose:** Start with a brief, high-level summary of what the code does.
  2.  **Key Components/Steps:** Break down the explanation into logical sections or steps. Describe what each major part of the code is responsible for.
  3.  **Clarity and Conciseness:** Use clear, simple language. Avoid jargon where possible, or explain it if necessary.
  4.  **Formatting:** Use markdown formatting (like headings, subheadings, bullet points, or bold text for emphasis) to make the explanation easy to read and digest.

  Programming Language: {{{programmingLanguage}}}

  Code Snippet:
  \`\`\`{{{programmingLanguage}}}
  {{{codeSnippet}}}
  \`\`\`

  Your well-formatted explanation:
  `,
});

const explainCodeSnippetFlow = ai.defineFlow(
  {
    name: 'explainCodeSnippetFlow',
    inputSchema: ExplainCodeSnippetInputSchema,
    outputSchema: ExplainCodeSnippetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
