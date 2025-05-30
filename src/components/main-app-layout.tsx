
"use client";

import React, { useState, Suspense } from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { CodebricksLogo } from '@/components/codebricks-logo';
import { GenerateCodeForm } from '@/components/generate-code-form';
import { ExplainCodeForm } from '@/components/explain-code-form';
import { FixBugsForm } from '@/components/fix-bugs-form';
import { OptimizeCodeForm } from '@/components/optimize-code-form';
import { SavedSnippetsManager } from '@/components/saved-snippets-manager';
import { ChatView } from '@/components/chat-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Ensure Button is imported

import { MessageSquare, Wand2, BookOpenText, Bug, Zap, Archive, Settings } from 'lucide-react';

type FeatureKey = 'chat' | 'generate' | 'explain' | 'fix' | 'optimize' | 'saved';

interface NavItem {
  key: FeatureKey;
  label: string;
  icon: React.ElementType;
  component: React.ElementType;
}

const navItems: NavItem[] = [
  { key: 'chat', label: 'Chat', icon: MessageSquare, component: ChatView },
  { key: 'generate', label: 'Generate Code', icon: Wand2, component: GenerateCodeForm },
  { key: 'explain', label: 'Explain Code', icon: BookOpenText, component: ExplainCodeForm },
  { key: 'fix', label: 'Fix Bugs', icon: Bug, component: FixBugsForm },
  { key: 'optimize', label: 'Optimize Code', icon: Zap, component: OptimizeCodeForm },
  { key: 'saved', label: 'Saved Snippets', icon: Archive, component: SavedSnippetsManager },
];

function FeatureLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}


export function MainAppLayout() {
  const [activeFeatureKey, setActiveFeatureKey] = useState<FeatureKey>('chat'); // Default to chat

  const activeNavItem = navItems.find(item => item.key === activeFeatureKey);
  const ActiveFeatureComponent = activeNavItem ? activeNavItem.component : ChatView; // Fallback to chat

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <CodebricksLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton 
                  onClick={() => setActiveFeatureKey(item.key)}
                  isActive={activeFeatureKey === item.key}
                  tooltip={item.label}
                  className="animate-pop-out hover:pop-out focus:pop-out"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {/* SidebarFooter could be added here if needed */}
      </Sidebar>
      <SidebarInset> {/* This is already flex flex-col */}
        <div className="p-2 md:p-4 border-b bg-background sticky top-0 z-10 flex items-center justify-between md:justify-end">
          <div className="md:hidden">
             <SidebarTrigger />
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground animate-pop-out hover:pop-out active:pop-out">
            <Settings />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
        {/* This main content area needs to be flex and allow its child (ActiveFeatureComponent) to grow */}
        <main className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto min-h-0">
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <ActiveFeatureComponent />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
