
'use server';
/**
 * @fileOverview Generates unit tests for a given code snippet.
 *
 * - generateUnitTests - A function that generates unit tests.
 * - GenerateUnitTestsInput - The input type for the generateUnitTests function.
 * - GenerateUnitTestsOutput - The return type for the generateUnitTests function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUnitTestsInputSchema = z.object({
  codeToTest: z.string().describe('The code snippet for which to generate unit tests.'),
  language: z.string().describe('The programming language of the code snippet.'),
  testingFramework: z.string().describe('The preferred testing framework (e.g., Jest, PyTest, JUnit).'),
});
export type GenerateUnitTestsInput = z.infer<typeof GenerateUnitTestsInputSchema>;

const GenerateUnitTestsOutputSchema = z.object({
  unitTests: z.string().describe('The generated unit tests as a code snippet.'),
  explanation: z.string().optional().describe('A brief explanation of the generated tests, if applicable.'),
});
export type GenerateUnitTestsOutput = z.infer<typeof GenerateUnitTestsOutputSchema>;

export async function generateUnitTests(input: GenerateUnitTestsInput): Promise<GenerateUnitTestsOutput> {
  return generateUnitTestsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUnitTestsPrompt',
  input: {schema: GenerateUnitTestsInputSchema},
  output: {schema: GenerateUnitTestsOutputSchema},
  prompt: `You are an expert software developer specializing in writing high-quality unit tests.
Your task is to generate unit tests for the provided code snippet.

Language: {{{language}}}
Testing Framework: {{{testingFramework}}}

Code to Test:
\`\`\`{{{language}}}
{{{codeToTest}}}
\`\`\`

Please generate comprehensive unit tests covering various scenarios, including edge cases if applicable.
Provide only the test code itself. If necessary, include a very brief explanation of the test cases.
If the testing framework implies a specific file structure or naming convention (e.g. \`*.test.js\`), assume the generated code will be placed in such a file.
`,
});

const generateUnitTestsFlow = ai.defineFlow(
  {
    name: 'generateUnitTestsFlow',
    inputSchema: GenerateUnitTestsInputSchema,
    outputSchema: GenerateUnitTestsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
