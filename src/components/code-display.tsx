'use client';

import { Check, Clipboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface CodeDisplayProps {
  code: string;
  language?: string;
  maxHeight?: string;
}

export function CodeDisplay({ code, language, maxHeight = "400px" }: CodeDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    toast({ title: "Copied to clipboard!" });
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  // Ensure component only renders on client to avoid hydration issues with Math.random or navigator
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="relative rounded-md border bg-secondary/30 p-4 group">
      {language && (
        <div className="absolute top-2 left-2 bg-muted text-muted-foreground px-2 py-0.5 rounded-sm text-xs">
          {language}
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity animate-pop-out"
        onClick={onCopy}
        aria-label="Copy code"
      >
        {hasCopied ? <Check size={16} /> : <Clipboard size={16} />}
      </Button>
      <ScrollArea style={{ maxHeight }} className="mt-2">
        <pre className="text-sm whitespace-pre-wrap break-all">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
