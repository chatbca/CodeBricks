
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Archive, Trash2, Eye, Tag, Search, CornerDownLeft, LogIn, User, AlertTriangle, Loader2 } from 'lucide-react';
import type { SavedSnippet } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeDisplay } from '@/components/code-display';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { getSnippetsForUser, deleteSnippet as deleteSnippetFromFirestore } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';


export function SavedSnippetsManager() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // To display persistent fetch error
  const { toast } = useToast();

  const fetchSnippets = useCallback(async () => {
    if (user) {
      setIsLoadingSnippets(true);
      setFetchError(null); // Clear previous errors
      try {
        const userSnippets = await getSnippetsForUser(user.uid);
        setSnippets(userSnippets);
      } catch (error: any) {
        console.error("Failed to fetch snippets:", error);
        let description = "Could not load your saved snippets. Please try again.";
        if (error.message && (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("missing or insufficient permissions"))) {
            description = "Failed to load snippets due to permission issues. Ensure Firestore rules allow reads for authenticated users or that Firestore is enabled in your Firebase project.";
        } else if (error.message) {
            description = error.message;
        }
        setFetchError(description); // Set persistent error message
        toast({
          variant: "destructive",
          title: "Error Fetching Snippets",
          description: description,
          duration: 9000,
        });
        setSnippets([]); 
      } finally {
        setIsLoadingSnippets(false);
      }
    } else {
      setSnippets([]); 
      setIsLoadingSnippets(false); 
      setFetchError(null); // Clear errors if user is not logged in
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const filteredSnippets = useMemo(() => {
    if (!user) return []; 
    return snippets
      .filter(snippet => 
        snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [snippets, searchTerm, user]);

  const handleDeleteSnippet = async (id: string) => {
    try {
      await deleteSnippetFromFirestore(id);
      setSnippets(prev => prev.filter(s => s.id !== id));
      toast({ title: "Snippet Deleted", description: "The snippet has been removed from Firestore."});
    } catch (error: any) {
      console.error("Failed to delete snippet:", error);
      let description = "Could not delete the snippet. Please try again.";
       if (error.message && (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("missing or insufficient permissions"))) {
        description = "Delete failed due to permission issues. Ensure Firestore rules allow deletes for authenticated users.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: description,
        duration: 9000,
      });
    }
  };

  if (authLoading) {
    return (
      <Card className="w-full animate-pop-out shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Archive className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold">Saved Snippets</CardTitle>
              <CardDescription>Manage your saved code bricks here.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full animate-pop-out shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Archive className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold">Saved Snippets</CardTitle>
            <CardDescription>
              {user ? "Manage your code bricks saved to your account in the cloud." : "Sign in to manage and save your code bricks."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!user ? (
          <Alert variant="default" className="bg-secondary/30">
            <User className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Sign In to Access Snippets</AlertTitle>
            <AlertDescription>
              Please sign in to view, save, and manage your code snippets. Your snippets will be stored in the cloud and accessible across your devices.
            </AlertDescription>
            <div className="mt-4">
              <Button onClick={signInWithGoogle} className="animate-pop-out hover:pop-out active:pop-out">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In with Google
              </Button>
            </div>
          </Alert>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="search"
                placeholder="Search snippets by name, code, language, or tag..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoadingSnippets && (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading your snippets...</p>
                </div>
            )}

            {!isLoadingSnippets && fetchError && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Could Not Load Snippets</AlertTitle>
                    <AlertDescription>
                      {fetchError} Please ensure your Firestore database is set up correctly and security rules are in place.
                      <Button variant="link" onClick={fetchSnippets} className="p-0 h-auto ml-1">Try again</Button>.
                    </AlertDescription>
                </Alert>
            )}

            {!isLoadingSnippets && !fetchError && filteredSnippets.length === 0 && searchTerm && (
                 <Alert>
                    <CornerDownLeft className="h-4 w-4" />
                    <AlertTitle>No Snippets Match Your Search</AlertTitle>
                    <AlertDescription>
                    Try a different search term.
                    </AlertDescription>
                </Alert>
            )}
             {!isLoadingSnippets && !fetchError && snippets.length === 0 && !searchTerm && (
                 <Alert>
                    <CornerDownLeft className="h-4 w-4" />
                    <AlertTitle>No Snippets Saved Yet</AlertTitle>
                    <AlertDescription>
                    Use the 'Save Snippet' button in other tools to save your code bricks to your account. They will appear here.
                    </AlertDescription>
                </Alert>
            )}


            {!isLoadingSnippets && !fetchError && filteredSnippets.length > 0 && (
              <ScrollArea className="h-[500px] pr-3">
                <div className="space-y-4">
                {filteredSnippets.map(snippet => (
                  <Card key={snippet.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{snippet.name}</CardTitle>
                          <CardDescription>
                            Saved {snippet.createdAt ? formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true }) : 'recently'}
                            {snippet.language && ` • ${snippet.language}`}
                          </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="animate-pop-out hover:pop-out active:pop-out">
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>{snippet.name}</DialogTitle>
                              <DialogDescription>
                                {snippet.language && <Badge variant="secondary" className="mr-2">{snippet.language}</Badge>}
                                Saved {snippet.createdAt ? formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true }) : 'recently'}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] mt-4">
                              {snippet.description && <p className="text-sm text-muted-foreground mb-2 p-2 bg-muted rounded-md whitespace-pre-wrap">{snippet.description}</p>}
                              <CodeDisplay code={snippet.code} language={snippet.language} />
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    {snippet.tags && snippet.tags.length > 0 && (
                      <CardContent className="pt-0 pb-2">
                        <div className="flex flex-wrap gap-2">
                          {snippet.tags.map(tag => (
                            <Badge key={tag} variant="outline">
                              <Tag className="mr-1 h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                    <CardFooter className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="animate-pop-out hover:pop-out active:pop-out">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the snippet "{snippet.name}"? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
                            <Button variant="destructive" onClick={() => handleDeleteSnippet(snippet.id)}>
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
