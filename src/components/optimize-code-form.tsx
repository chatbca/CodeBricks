"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Sparkles, Save, Gauge } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeDisplay } from '@/components/code-display';
import { useToast } from '@/hooks/use-toast';
import { optimizeCodeSnippet, type OptimizeCodeSnippetOutput } from '@/ai/flows/optimize-code-snippet';
import { PROGRAMMING_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';
import type { SavedSnippet } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SNIPPETS_STORAGE_KEY } from '@/lib/snippet-storage';
import { Input } from './ui/input';

const optimizeCodeSchema = z.object({
  codeSnippet: z.string().min(1, { message: "Code snippet cannot be empty." }),
  language: z.string().min(1, { message: "Please select a language." }),
  snippetName: z.string().optional(),
});

type OptimizeCodeFormValues = z.infer<typeof optimizeCodeSchema>;

export function OptimizeCodeForm() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizeCodeSnippetOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [savedSnippets, setSavedSnippets] = useLocalStorage<SavedSnippet[]>(SNIPPETS_STORAGE_KEY, []);

  const form = useForm<OptimizeCodeFormValues>({
    resolver: zodResolver(optimizeCodeSchema),
    defaultValues: {
      codeSnippet: '',
      language: DEFAULT_LANGUAGE,
    },
  });

  const onSubmit: SubmitHandler<OptimizeCodeFormValues> = async (data) => {
    setIsLoading(true);
    setOptimizationResult(null);
    try {
      const result = await optimizeCodeSnippet({ codeSnippet: data.codeSnippet, language: data.language });
      setOptimizationResult(result);
      form.setValue("snippetName", `${data.language}_optimization_${data.codeSnippet.substring(0,20).replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error("Error optimizing code:", error);
      toast({
        variant: "destructive",
        title: "Error Optimizing Code",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnippet = (codeToSave: string, type: 'original' | 'optimized') => {
    const values = form.getValues();
    if (!codeToSave) {
      toast({ title: "Nothing to save", description: "No code to save.", variant: "destructive" });
      return;
    }
    const name = values.snippetName 
      ? `${values.snippetName}_${type}`
      : `${type === 'optimized' ? 'Optimized' : 'Original'} ${values.language} snippet ${new Date().toLocaleTimeString()}`;
    
    const newSnippet: SavedSnippet = {
      id: Date.now().toString(),
      name,
      code: codeToSave,
      language: values.language,
      description: type === 'optimized' ? optimizationResult?.explanation : 'Original code for optimization.',
      createdAt: new Date().toISOString(),
      tags: [type, values.language, 'optimization-related'],
    };
    setSavedSnippets([...savedSnippets, newSnippet]);
    toast({ title: "Snippet Saved!", description: `"${name}" has been saved.` });
  };

  return (
    <Card className="w-full animate-pop-out shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold">Optimize Code</CardTitle>
            <CardDescription>Improve performance and readability of your code with AI suggestions.</CardDescription>
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
                  <FormLabel>Code to Optimize</FormLabel>
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
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programming Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto animate-pop-out hover:pop-out active:pop-out">
              {isLoading ? (
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Gauge className="mr-2 h-4 w-4" />
              )}
              Optimize Code
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            <p>Optimizing your code brick...</p>
          </div>
        )}

        {optimizationResult && (
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Optimized Code:</h3>
              <CodeDisplay code={optimizationResult.optimizedCode} language={form.getValues("language")} />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Explanation:</h3>
              <p className="prose prose-sm max-w-none p-3 border rounded-md bg-secondary/30">{optimizationResult.explanation}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <FormField
                control={form.control}
                name="snippetName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Snippet Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Base name for saved snippets" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleSaveSnippet(form.getValues("codeSnippet"), 'original')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out">
                  <Save className="mr-2 h-4 w-4" />
                  Save Original
                </Button>
                <Button onClick={() => handleSaveSnippet(optimizationResult.optimizedCode, 'optimized')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out">
                  <Save className="mr-2 h-4 w-4" />
                  Save Optimized
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
