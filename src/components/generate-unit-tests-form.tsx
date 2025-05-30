
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardCheck, Sparkles, Save, Loader2 } from 'lucide-react'; // Added Loader2

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeDisplay } from '@/components/code-display';
import { ModelSelector } from '@/components/model-selector';
import { useToast } from '@/hooks/use-toast';
import { generateUnitTests } from '@/ai/flows/generate-unit-tests-flow';
import { PROGRAMMING_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants';
import type { SavedSnippet } from '@/types';
import { Input } from './ui/input';
import { addSnippet } from '@/lib/firestore';
import { useAuth } from '@/context/auth-context';

const TESTING_FRAMEWORKS = [
  { value: 'jest', label: 'Jest (JavaScript/TypeScript)' },
  { value: 'pytest', label: 'PyTest (Python)' },
  { value: 'junit', label: 'JUnit (Java)' },
  { value: 'nunit', label: 'NUnit (C#)' },
  { value: 'phpunit', label: 'PHPUnit (PHP)' },
  { value: 'rspec', label: 'RSpec (Ruby)' },
  { value: 'golang_test', label: 'Go Testing Package' },
  { value: 'xctest', label: 'XCTest (Swift)' },
  { value: 'mocha', label: 'Mocha (JavaScript/TypeScript)' },
  { value: 'vitest', label: 'Vitest (JavaScript/TypeScript)' },
  { value: 'cypress', label: 'Cypress (E2E JavaScript/TypeScript)' },
  { value: 'playwright', label: 'Playwright (E2E JavaScript/TypeScript)' },
  { value: 'other', label: 'Other/Generic' },
];
const DEFAULT_FRAMEWORK = 'jest';


const generateTestsSchema = z.object({
  codeSnippet: z.string().min(1, { message: "Code snippet cannot be empty." }),
  language: z.string().min(1, { message: "Please select a language." }),
  testFramework: z.string().min(1, { message: "Please select a testing framework." }),
  aiModel: z.string().min(1, { message: "Please select an AI model."}),
  snippetName: z.string().optional(),
});

type GenerateTestsFormValues = z.infer<typeof generateTestsSchema>;

export function GenerateUnitTestsForm() {
  const [generatedTests, setGeneratedTests] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingOriginal, setIsSavingOriginal] = useState(false); // New state
  const [isSavingTest, setIsSavingTest] = useState(false); // New state
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<GenerateTestsFormValues>({
    resolver: zodResolver(generateTestsSchema),
    defaultValues: {
      codeSnippet: '',
      language: DEFAULT_LANGUAGE,
      testFramework: DEFAULT_FRAMEWORK,
      aiModel: 'gemini',
      snippetName: '',
    },
  });

  const onSubmit: SubmitHandler<GenerateTestsFormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedTests(null);
    try {
      const result = await generateUnitTests({ 
        codeToTest: data.codeSnippet, 
        language: data.language,
        testingFramework: data.testFramework,
      });
      setGeneratedTests(result.unitTests);
      form.setValue("snippetName", `${data.language}_${data.testFramework}_tests_for_${data.codeSnippet.substring(0,10).replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error("Error generating unit tests:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Tests",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSnippet = async (codeToSave: string, type: 'original_code' | 'test_code') => {
    if (!user) {
      toast({ title: "Sign In Required", description: "Please sign in to save snippets.", variant: "destructive" });
      return;
    }
    const values = form.getValues();
    if (!codeToSave) {
      toast({ title: "Nothing to save", description: "No code to save.", variant: "destructive" });
      return;
    }

    if (type === 'original_code') setIsSavingOriginal(true);
    if (type === 'test_code') setIsSavingTest(true);
    
    const name = values.snippetName 
      ? `${values.snippetName}_${type}` 
      : `${type === 'test_code' ? 'Tests for' : 'Original'} ${values.language} snippet ${new Date().toLocaleTimeString()}`;
    
    const newSnippet: Omit<SavedSnippet, 'id' | 'createdAt'> = {
      userId: user.uid,
      name,
      code: codeToSave,
      language: type === 'test_code' ? values.language : values.language, 
      description: type === 'test_code' ? `Generated ${values.testFramework} tests for the original code.` : 'Original code for which tests were generated.',
      tags: [type, values.language, values.testFramework, values.aiModel, 'unit-tests'],
    };
    
    try {
      await addSnippet(newSnippet);
      toast({ title: "Snippet Saved!", description: `"${name}" has been saved. View it in 'Saved Snippets'.` });
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
    } finally {
      if (type === 'original_code') setIsSavingOriginal(false);
      if (type === 'test_code') setIsSavingTest(false);
    }
  };

  return (
    <Card className="w-full animate-pop-out shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold">Generate Unit Tests</CardTitle>
            <CardDescription>Provide your code and let AI generate unit test cases for you.</CardDescription>
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
                  <FormLabel>Code to Test</FormLabel>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="language"
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
                name="testFramework"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testing Framework</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select framework" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TESTING_FRAMEWORKS.map((fw) => (
                          <SelectItem key={fw.value} value={fw.value}>
                            {fw.label}
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
                <ClipboardCheck className="mr-2 h-4 w-4" />
              )}
              Generate Tests
            </Button>

            {generatedTests && (
              <div className="mt-8 space-y-4 pt-4 border-t">
                <h3 className="text-xl font-semibold">Generated Unit Tests:</h3>
                <CodeDisplay code={generatedTests} language={form.getValues("language")} />
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
                        <Button onClick={() => handleSaveSnippet(form.getValues("codeSnippet"), 'original_code')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={!user || isLoading || isSavingOriginal || isSavingTest}>
                          {isSavingOriginal ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {isSavingOriginal ? 'Saving...' : 'Save Original Code'}
                        </Button>
                        <Button onClick={() => handleSaveSnippet(generatedTests, 'test_code')} variant="outline" className="animate-pop-out hover:pop-out active:pop-out" disabled={!user || isLoading || isSavingOriginal || isSavingTest}>
                          {isSavingTest ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {isSavingTest ? 'Saving...' : 'Save Test Code'}
                        </Button>
                    </div>
                  </div>
                  {!user && <p className="text-sm text-muted-foreground">Sign in to save snippets.</p>}
              </div>
            )}
          </form>
        </Form>

        {isLoading && !generatedTests && (
          <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            <p>Generating your test bricks...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
