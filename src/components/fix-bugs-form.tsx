
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bug, Sparkles, Save, ShieldAlert, Loader2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeDisplay } from '@/components/code-display';
import { useToast } from '@/hooks/use-toast';
import { fixBugsInCode, type FixBugsInCodeOutput } from '@/ai/flows/fix-bugs-in-code';
import { PROGRAMMING_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';
import type { SavedSnippet } from '@/types';
import { Input } from './ui/input';
import { addSnippet } from '@/lib/firestore';
import { useAuth } from '@/context/auth-context';

const fixBugsSchema = z.object({
  codeSnippet: z.string().min(1, { message: "Code snippet cannot be empty." }),
  language: z.string().min(1, { message: "Please select a language." }),
  snippetName: z.string().optional(),
});

type FixBugsFormValues = z.infer<typeof fixBugsSchema>;

export function FixBugsForm() {
  const [fixResult, setFixResult] = useState<FixBugsInCodeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingOriginal, setIsSavingOriginal] = useState(false);
  const [isSavingFixed, setIsSavingFixed] = useState(false);
  const { toast } = useToast();
  const { user, signInWithGoogle } = useAuth();

  const form = useForm<FixBugsFormValues>({
    resolver: zodResolver(fixBugsSchema),
    defaultValues: {
      codeSnippet: '',
      language: DEFAULT_LANGUAGE,
      snippetName: '',
    },
  });

  const onSubmit: SubmitHandler<FixBugsFormValues> = async (data) => {
    setIsLoading(true);
    setFixResult(null);
    try {
      const result = await fixBugsInCode({ codeSnippet: data.codeSnippet, language: data.language });
      setFixResult(result);
      form.setValue("snippetName", `${data.language}_fix_${data.codeSnippet.substring(0,20).replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error("Error fixing bugs:", error);
      toast({
        variant: "destructive",
        title: "Error Fixing Bugs",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnippet = async (codeToSave: string, type: 'original' | 'fixed') => {
    if (!user) {
      toast({ 
        title: "Authentication Required", 
        description: `Please sign in to save the ${type} code snippet.`, 
        variant: "destructive",
        action: <Button onClick={signInWithGoogle} className="animate-pop-out hover:pop-out active:pop-out">Sign In</Button>,
        duration: 7000,
      });
      return;
    }
    const values = form.getValues();
    if (!codeToSave) {
      toast({ title: "Nothing to save", description: "No code to save.", variant: "destructive" });
      return;
    }

    if (type === 'original') setIsSavingOriginal(true);
    if (type === 'fixed') setIsSavingFixed(true);

    const name = values.snippetName 
      ? `${values.snippetName}_${type}` 
      : `${type === 'fixed' ? 'Fixed' : 'Original'} ${values.language} snippet ${new Date().toLocaleTimeString()}`;
    
    const newSnippet: Omit<SavedSnippet, 'id' | 'createdAt'> = {
      userId: user.uid,
      name,
      code: codeToSave,
      language: values.language,
      description: type === 'fixed' ? fixResult?.suggestedFix : 'Original buggy code.',
      tags: [type, values.language, 'bug-fix-related'],
    };

    try {
      await addSnippet(newSnippet);
      toast({ title: "Snippet Saved!", description: `"${name}" has been saved. View it in 'Saved Snippets'.` });
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
      if (type === 'original') setIsSavingOriginal(false);
      if (type === 'fixed') setIsSavingFixed(false);
    }
  };


  return (
    <Card className="w-full animate-pop-out shadow-xl">
      <CardHeader className="bg-primary/10 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bug className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold">Fix Bugs</CardTitle>
            <CardDescription>Identify and fix bugs in your code with AI-powered suggestions.</CardDescription>
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
                  <FormLabel>Buggy Code Snippet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your buggy code here..."
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
                <ShieldAlert className="mr-2 h-4 w-4" />
              )}
              Find & Fix Bugs
            </Button>

            {fixResult && (
              <div className="mt-8 space-y-6 pt-4 border-t">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bug Identification:</h3>
                  <p className="prose prose-sm dark:prose-invert max-w-none p-3 border rounded-md bg-secondary/30">{fixResult.bugIdentification}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Suggested Fix:</h3>
                  <p className="prose prose-sm dark:prose-invert max-w-none p-3 border rounded-md bg-secondary/30">{fixResult.suggestedFix}</p>
                </div>
                {fixResult.fixedCodeSnippet && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fixed Code Snippet:</h3>
                    <CodeDisplay code={fixResult.fixedCodeSnippet} language={form.getValues("language")} />
                  </div>
                )}
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
                    <Button onClick={() => handleSaveSnippet(form.getValues("codeSnippet"), 'original')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={isLoading || isSavingOriginal || isSavingFixed}>
                      {isSavingOriginal ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isSavingOriginal ? 'Saving...' : (user ? 'Save Original' : 'Sign In to Save')}
                    </Button>
                    {fixResult.fixedCodeSnippet && (
                      <Button onClick={() => handleSaveSnippet(fixResult.fixedCodeSnippet!, 'fixed')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={isLoading || isSavingOriginal || isSavingFixed}>
                        {isSavingFixed ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isSavingFixed ? 'Saving...' : (user ? 'Save Fixed' : 'Sign In to Save')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>

        {isLoading && !fixResult && (
          <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            <p>Debugging your code brick...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
