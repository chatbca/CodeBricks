
"use client";

import React, { useState, Suspense, useEffect } from 'react';
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
import { GenerateUnitTestsForm } from '@/components/generate-unit-tests-form'; // Added Unit Test Form
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context'; // Added useTheme
import { LogIn, LogOut, User as UserIcon, Settings, MessageSquare, Wand2, BookOpenText, Bug, Zap, Archive, Loader2, Sun, Moon, Monitor, ClipboardCheck } from 'lucide-react'; // Added Sun, Moon, Monitor, ClipboardCheck

type FeatureKey = 'chat' | 'generate' | 'explain' | 'fix' | 'optimize' | 'saved' | 'test';

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
  { key: 'test', label: 'Generate Tests', icon: ClipboardCheck, component: GenerateUnitTestsForm }, // Added Unit Test Nav
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
  const [activeFeatureKey, setActiveFeatureKey] = useState<FeatureKey>('chat');
  const { user, loading: authLoading, signInWithGoogle, signOutUser } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activeNavItem = navItems.find(item => item.key === activeFeatureKey);
  const ActiveFeatureComponent = activeNavItem ? activeNavItem.component : ChatView;

  const UserAuthDisplay = () => {
    if (!isClient || authLoading) { // Ensure client-side before rendering auth state
      return <Button variant="ghost" size="icon" disabled><Loader2 className="h-5 w-5 animate-spin" /></Button>;
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full h-10 w-10 p-0 animate-pop-out hover:pop-out active:pop-out">
              <Avatar className="h-8 w-8">
                {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={18}/>}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{user.displayName || "User"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {resolvedTheme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                {resolvedTheme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <Sun className="mr-2 h-4 w-4" /> Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon className="mr-2 h-4 w-4" /> Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Monitor className="mr-2 h-4 w-4" /> System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem disabled onClick={() => {/* TODO: Navigate to profile or settings */}}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOutUser} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button onClick={signInWithGoogle} variant="outline" className="animate-pop-out hover:pop-out active:pop-out">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    );
  };


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
      </Sidebar>
      <SidebarInset>
        <div className="p-2 md:p-4 border-b bg-background sticky top-0 z-10 flex items-center justify-between">
          <div className="md:hidden">
             <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <UserAuthDisplay />
          </div>
        </div>
        <main className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto min-h-0">
          <Suspense fallback={<FeatureLoadingSkeleton />}>
            <ActiveFeatureComponent />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
