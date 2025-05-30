
'use server';
/**
 * @fileOverview A Genkit flow for handling chat interactions with the AI, including multimodal inputs and conversation history.
 *
 * - chatWithAi - A function that handles the chat interaction process.
 * - ChatWithAiInput - The input type for the chatWithAi function.
 * - ChatWithAiOutput - The return type for the chatWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageHistoryItemSchema = z.object({
  sender: z.enum(['user', 'ai']),
  text: z.string().optional(),
  imageDataUri: z.string().optional().describe(
    "An optional image from a past message, as a data URI that must include a MIME type and use Base64 encoding."
  ),
  // audioDataUri could be added for history if needed in the future
});

const ChatWithAiInputSchema = z.object({
  history: z.array(ChatMessageHistoryItemSchema).optional().describe("The conversation history."),
  message: z.string().optional().describe("The user's current text message."),
  imageDataUri: z.string().optional().describe(
    "An optional image provided by the user for the current message, as a data URI."
  ),
  audioDataUri: z.string().optional().describe(
    "An optional audio recording provided by the user for the current message, as a data URI."
  ),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user's message."),
});
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  if (!input.message && !input.imageDataUri && !input.audioDataUri && (!input.history || input.history.length === 0)) {
    return { response: "Please provide some input to chat." };
  }
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
Consider the conversation history provided.

{{#if history}}
Conversation History:
{{#each history}}
{{this.sender}}:{{#if this.text}} {{this.text}}{{/if}}{{#if this.imageDataUri}} [Image: {{media url=this.imageDataUri}}]{{/if}}
{{/each}}
---
{{/if}}

Current User Input:
{{#if message}}Text: {{{message}}}{{/if}}
{{#if imageDataUri}}
Image: {{media url=imageDataUri}}
{{/if}}
{{#if audioDataUri}}
Audio: {{media url=audioDataUri}}
{{/if}}

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

