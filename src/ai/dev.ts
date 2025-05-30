import { config } from 'dotenv';
config();

import '@/ai/flows/fix-bugs-in-code.ts';
import '@/ai/flows/optimize-code-snippet.ts';
import '@/ai/flows/explain-code-snippet.ts';
import '@/ai/flows/generate-code-from-prompt.ts';
import '@/ai/flows/chat-with-ai-flow.ts'; // Added new chat flow
