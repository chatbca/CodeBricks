
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Sparkles, Save, Gauge } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeDisplay } from '@/components/code-display';
import { useToast } from '@/hooks/use-toast';
import { optimizeCodeSnippet, type OptimizeCodeSnippetOutput } from '@/ai/flows/optimize-code-snippet';
import { PROGRAMMING_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';
import type { SavedSnippet } from '@/types';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { addSnippet } from '@/lib/firestore'; // Firestore
import { useAuth } from '@/context/auth-context'; // Auth

const optimizationGoals = [
  { value: 'performance', label: 'Improve Performance' },
  { value: 'readability', label: 'Enhance Readability' },
  { value: 'conciseness', label: 'Reduce Code Length' },
  { value: 'modernize', label: 'Convert to Modern Syntax' },
  { value: 'general', label: 'General Optimization' },
] as const;

type OptimizationGoalValue = typeof optimizationGoals[number]['value'];

const optimizeCodeSchema = z.object({
  codeSnippet: z.string().min(1, { message: "Code snippet cannot be empty." }),
  language: z.string().min(1, { message: "Please select a language." }),
  optimizationGoal: z.enum(optimizationGoals.map(g => g.value) as [OptimizationGoalValue, ...OptimizationGoalValue[]], {
    errorMap: () => ({ message: "Please select an optimization goal." })
  }),
  snippetName: z.string().optional(),
});

type OptimizeCodeFormValues = z.infer<typeof optimizeCodeSchema>;

export function OptimizeCodeForm() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizeCodeSnippetOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<OptimizeCodeFormValues>({
    resolver: zodResolver(optimizeCodeSchema),
    defaultValues: {
      codeSnippet: '',
      language: DEFAULT_LANGUAGE,
      optimizationGoal: 'general',
      snippetName: '',
    },
  });

  const onSubmit: SubmitHandler<OptimizeCodeFormValues> = async (data) => {
    setIsLoading(true);
    setOptimizationResult(null);
    try {
      const result = await optimizeCodeSnippet({ 
        codeSnippet: data.codeSnippet, 
        language: data.language,
        optimizationGoal: data.optimizationGoal,
      });
      setOptimizationResult(result);
      form.setValue("snippetName", `${data.language}_${data.optimizationGoal}_${data.codeSnippet.substring(0,15).replace(/\s+/g, '_')}`);
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

  const handleSaveSnippet = async (codeToSave: string, type: 'original' | 'optimized') => {
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in to save snippets.", variant: "destructive" });
      return;
    }
    const values = form.getValues();
    if (!codeToSave) {
      toast({ title: "Nothing to save", description: "No code to save.", variant: "destructive" });
      return;
    }
    const name = values.snippetName 
      ? `${values.snippetName}_${type}`
      : `${type === 'optimized' ? 'Optimized' : 'Original'} ${values.language} snippet ${new Date().toLocaleTimeString()}`;
    
    const newSnippet: Omit<SavedSnippet, 'id' | 'createdAt'> = {
      userId: user.uid,
      name,
      code: codeToSave,
      language: values.language,
      description: type === 'optimized' ? optimizationResult?.explanation : `Original code for ${values.optimizationGoal} optimization.`,
      tags: [type, values.language, 'optimization-related', values.optimizationGoal],
    };

    try {
      await addSnippet(newSnippet);
      toast({ title: "Snippet Saved!", description: `"${name}" has been saved to Firestore.` });
    } catch (error: any) {
      console.error("Error saving snippet to Firestore:", error);
      let description = "Could not save snippet to cloud. Please try again.";
      if (error.message && (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("missing or insufficient permissions"))) {
        description = "Save failed due to permission issues. Ensure Firestore rules allow writes for authenticated users or that Firestore is enabled in your Firebase project.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: description,
        duration: 9000,
      });
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <FormField
                control={form.control}
                name="optimizationGoal"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Optimization Goal</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {optimizationGoals.map(goal => (
                           <FormItem key={goal.value} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={goal.value} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {goal.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
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
                <Gauge className="mr-2 h-4 w-4" />
              )}
              Optimize Code
            </Button>
            
            {optimizationResult && (
              <div className="mt-8 space-y-6 pt-4 border-t">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Optimized Code:</h3>
                  <CodeDisplay code={optimizationResult.optimizedCode} language={form.getValues("language")} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Explanation:</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none p-3 border rounded-md bg-secondary/30 whitespace-pre-wrap">{optimizationResult.explanation}</div>
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
                    <Button onClick={() => handleSaveSnippet(form.getValues("codeSnippet"), 'original')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={!user || isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Original
                    </Button>
                    <Button onClick={() => handleSaveSnippet(optimizationResult.optimizedCode, 'optimized')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={!user || isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Optimized
                    </Button>
                  </div>
                </div>
                 {!user && <p className="text-sm text-muted-foreground">Sign in to save snippets.</p>}
              </div>
            )}
          </form>
        </Form>

        {isLoading && !optimizationResult && (
          <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            <p>Optimizing your code brick...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
