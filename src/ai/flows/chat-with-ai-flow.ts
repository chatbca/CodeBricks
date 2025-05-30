'use server';
/**
 * @fileOverview A Genkit flow for handling chat interactions with the AI.
 *
 * - chatWithAi - A function that handles the chat interaction process.
 * - ChatWithAiInput - The input type for the chatWithAi function.
 * - ChatWithAiOutput - The return type for the chatWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithAiInputSchema = z.object({
  message: z.string().describe("The user's message to the AI."),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user's message."),
});
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  input: {schema: ChatWithAiInputSchema},
  output: {schema: ChatWithAiOutputSchema},
  prompt: `You are CodeBricks AI, a helpful and friendly coding assistant.
You are an expert in NextJS, React, ShadCN UI components, Tailwind CSS, and Genkit.
Your goal is to assist users with their coding tasks, answer their questions, and help them understand code.
Be clear, concise, and provide helpful explanations. If asked to write code, provide only the code block.

User's message: {{{message}}}

Your response:`,
});

const chatWithAiFlow = ai.defineFlow(
  {
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
