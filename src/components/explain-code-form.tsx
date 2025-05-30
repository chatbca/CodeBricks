
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpenText, Sparkles, Save, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModelSelector } from '@/components/model-selector';
import { useToast } from '@/hooks/use-toast';
import { explainCodeSnippet } from '@/ai/flows/explain-code-snippet';
import { PROGRAMMING_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';
import type { SavedSnippet } from '@/types';
import { Input } from './ui/input';
import { addSnippet } from '@/lib/firestore';
import { useAuth } from '@/context/auth-context';

const explainCodeSchema = z.object({
  codeSnippet: z.string().min(1, { message: "Code snippet cannot be empty." }),
  programmingLanguage: z.string().min(1, { message: "Please select a language." }),
  aiModel: z.string().min(1, { message: "Please select an AI model."}),
  snippetName: z.string().optional(),
});

type ExplainCodeFormValues = z.infer<typeof explainCodeSchema>;

export function ExplainCodeForm() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ExplainCodeFormValues>({
    resolver: zodResolver(explainCodeSchema),
    defaultValues: {
      codeSnippet: '',
      programmingLanguage: DEFAULT_LANGUAGE,
      aiModel: 'gemini',
      snippetName: '',
    },
  });

  const onSubmit: SubmitHandler<ExplainCodeFormValues> = async (data) => {
    setIsLoading(true);
    setExplanation(null);
    try {
      const result = await explainCodeSnippet({ 
        codeSnippet: data.codeSnippet, 
        programmingLanguage: data.programmingLanguage 
      });
      setExplanation(result.explanation);
      form.setValue("snippetName", `${data.programmingLanguage}_explanation_${data.codeSnippet.substring(0,20).replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error("Error explaining code:", error);
      toast({
        variant: "destructive",
        title: "Error Explaining Code",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveSnippet = async () => {
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in to save snippets.", variant: "destructive" });
      return;
    }
    const values = form.getValues();
    if (!values.codeSnippet) {
      toast({ title: "Nothing to save", description: "Enter some code first.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    const name = values.snippetName || `Explained ${values.programmingLanguage} snippet ${new Date().toLocaleTimeString()}`;
    
    const newSnippet: Omit<SavedSnippet, 'id' | 'createdAt'> = {
      userId: user.uid,
      name,
      code: values.codeSnippet,
      language: values.programmingLanguage,
      description: explanation || `Original code for explanation (Model: ${values.aiModel}).`,
      tags: ['explained', values.programmingLanguage, values.aiModel],
    };

    try {
      await addSnippet(newSnippet);
      toast({ title: "Snippet Saved!", description: `"${name}" (original code) has been saved. View it in 'Saved Snippets'.` });
    } catch (error: any) {
      console.error("Error saving snippet to Firestore:", error);
      let description = "Could not save snippet to cloud. Please try again.";
      if (error.message && (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("missing or insufficient permissions"))) {
        description = "Save failed: Permission denied. Please ensure Firestore rules allow writes for authenticated users or that Firestore is enabled and rules are published in your Firebase project.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: description,
        duration: 9000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full animate-pop-out shadow-xl">
      <CardHeader className="bg-primary/10 rounded-t-lg">
        <div className="flex items-center gap-3">
          <BookOpenText className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold">Explain Code</CardTitle>
            <CardDescription>Understand complex code snippets with clear, plain language explanations.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="codeSnippet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code Snippet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your code here..."
                      rows={8}
                      className="font-mono text-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="programmingLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programming Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROGRAMMING_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aiModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Model</FormLabel>
                    <FormControl>
                      <ModelSelector
                        id={field.name} 
                        onValueChange={field.onChange}
                        value={field.value}
                        showLabel={false} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto animate-pop-out hover:pop-out active:pop-out">
              {isLoading ? (
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookOpenText className="mr-2 h-4 w-4" />
              )}
              Explain Code
            </Button>

            {explanation && (
              <div className="mt-8 space-y-4 pt-4 border-t">
                <h3 className="text-xl font-semibold">Explanation:</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md bg-secondary/30 whitespace-pre-wrap">
                  {explanation}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <FormField
                      control={form.control}
                      name="snippetName"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel>Snippet Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Name for the original code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <Button onClick={handleSaveSnippet} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={!user || isLoading || isSaving}>
                     {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Original Code'}
                  </Button>
                </div>
                {!user && <p className="text-sm text-muted-foreground">Sign in to save snippets.</p>}
              </div>
            )}
          </form>
        </Form>

        {isLoading && !explanation && (
          <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            <p>Analyzing your code brick...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
