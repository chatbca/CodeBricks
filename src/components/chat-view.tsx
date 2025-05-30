
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, User, Bot, Sparkles, Paperclip, Mic, StopCircle, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { chatWithAi } from '@/ai/flows/chat-with-ai-flow';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text?: string; // Text can be optional if only image/audio
  sender: 'user' | 'ai';
  timestamp: Date;
  imageDataUri?: string; // For user messages with images
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioDataUri, setRecordedAudioDataUri] = useState<string | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasMicrophonePermission(true);
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasMicrophonePermission(false);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings to record audio.',
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        setHasMicrophonePermission(permissionStatus.state === 'granted');
        permissionStatus.onchange = () => {
          setHasMicrophonePermission(permissionStatus.state === 'granted');
        };
      });
    }
  }, []);


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    let permissionGranted = hasMicrophonePermission;
    if (permissionGranted === null || !permissionGranted) {
        permissionGranted = await requestMicrophonePermission();
    }

    if (!permissionGranted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioDataUri(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordedAudioDataUri(null); 
    } catch (error) {
        console.error("Failed to start recording:", error);
        toast({
            variant: "destructive",
            title: "Recording Error",
            description: "Could not start audio recording.",
        });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleSendMessage = async () => {
    const textToSend = inputValue.trim();
    const imageToSend = selectedImage;
    let audioToSend = recordedAudioDataUri; // Use let as it might be updated if recording

    if (isRecording) {
        stopRecording(); // This will set recordedAudioDataUri via onstop after a short delay
        // We need to ensure audioToSend reflects the newly recorded audio.
        // Since onstop is async, we might not have audioToSend immediately here.
        // A better UX might be to disable send until audio is processed or change Send to "Stop & Send".
        // For now, we'll try to send. If audioDataUri is not set by the time AI call happens, it won't be included.
        // Or, we can await a promise that resolves when onstop sets the URI.
        // Let's try to use the state that will be updated by onstop
        toast({ title: "Audio recording stopped", description: "Preparing to send audio..."});
        // Attempt to get the latest audio after stopping. This is a bit racy.
        // It's better if stopRecording sets a flag and an effect sends the message.
        // For now, the user might have to click send again if the audio isn't ready immediately.
        // Let's assume if they clicked Send while recording, they intend for *that* audio.
        // We'll use the `recordedAudioDataUri` which *should* be set by stopRecording().
        // To make it more robust, we could delay the send slightly or use a callback.
        // A quick fix: if isRecording, stop, then re-evaluate audioToSend from state.
        // But state updates are async.
        // Let's show a toast and user may need to click again.
        // If audioDataUri is already set (from a previous recording they didn't clear), it will be sent.
        // If new audio is being processed, it might not be ready.
         // This is tricky. For simplicity, if recording and send is hit, stop recording.
        // The user will then see the recorded audio preview and can click send again.
        // This avoids complex state management for this interaction.
        if (recordedAudioDataUri) audioToSend = recordedAudioDataUri; // Use if already there
        else {
          // If we just stopped, recordedAudioDataUri might not be set yet.
          // Tell user to click send again.
           toast({ title: "Recording stopped.", description: "Audio is processing. Click send again to include it."});
           return;
        }
    }


    if (!textToSend && !imageToSend && !audioToSend) {
      return;
    }
    
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
      imageDataUri: imageToSend || undefined, // Add image to user message for display
    };
    
    // Prepare history for the AI flow (all messages *before* this new one)
    const historyForAI = messages.map(msg => ({
      sender: msg.sender,
      text: msg.text,
      imageDataUri: msg.imageDataUri,
    }));

    // Add user message to UI optimistically
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    setInputValue('');
    setSelectedImage(null);
    // We will clear recordedAudioDataUri after successful send.

    try {
      const aiResult = await chatWithAi({
        history: historyForAI,
        message: textToSend || undefined, 
        imageDataUri: imageToSend || undefined,
        audioDataUri: audioToSend || undefined, 
      });
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResult.response,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setRecordedAudioDataUri(null); // Clear audio after successful send
    } catch (error) {
      console.error("Error chatting with AI:", error);
      toast({
        variant: "destructive",
        title: "AI Chat Error",
        description: error instanceof Error ? error.message : "An unknown error occurred while fetching AI response.",
      });
      // Optionally, add an error message from AI to the chat
      // Or revert the optimistic user message (more complex)
      // For now, user message stays, AI error shown as toast.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    return () => { 
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        // Ensure media streams are cleaned up
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  if (!isClient) {
    return (
      <Card className="w-full animate-pop-out shadow-xl flex flex-col flex-grow min-h-0 max-h-[800px]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-semibold">Chat with CodeBricks AI</CardTitle>
              <CardDescription>Ask code-related questions and get assistance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-0">
          <div className="h-[500px] flex items-center justify-center text-muted-foreground">Loading Chat...</div>
        </CardContent>
      </Card>
    );
  }

  const canSend = !isLoading && (!!inputValue.trim() || !!selectedImage || !!recordedAudioDataUri);

  return (
    <Card className="w-full animate-pop-out shadow-xl flex flex-col flex-grow min-h-0 max-h-[800px]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold">Chat with CodeBricks AI</CardTitle>
            <CardDescription>Ask questions, attach images, or send audio. Considers history.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0 overflow-hidden"> {/* Added overflow-hidden */}
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2",
                  msg.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
                    msg.sender === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.imageDataUri && (
                    <img src={msg.imageDataUri} alt="User attachment" className="rounded-md max-w-full h-auto mb-2 max-h-60" />
                  )}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  <p className={cn(
                      "text-xs mt-1",
                      msg.sender === 'user' ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length -1]?.sender === 'user' && (
                 <div className="flex items-end space-x-2 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] rounded-lg px-3 py-2 text-sm shadow bg-muted text-muted-foreground">
                        <Sparkles className="h-4 w-4 animate-spin" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        {selectedImage && (
          <div className="p-4 border-t bg-background">
            <div className="relative w-32 h-32 group">
              <img src={selectedImage} alt="Preview" className="rounded-md object-cover w-full h-full" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute -top-2 -right-2 h-6 w-6 opacity-70 group-hover:opacity-100" 
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {(recordedAudioDataUri && !isRecording) && (
             <div className="p-2 px-4 border-t flex items-center justify-between text-sm text-muted-foreground bg-background">
                <span>Audio recorded. Ready to send.</span>
                <Button variant="ghost" size="sm" onClick={() => setRecordedAudioDataUri(null)}>Clear Audio</Button>
            </div>
        )}

        {hasMicrophonePermission === false && (
             <Alert variant="destructive" className="m-4">
              <Mic className="h-4 w-4" />
              <AlertTitle>Microphone Access Denied</AlertTitle>
              <AlertDescription>
                To record audio, please enable microphone permissions in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
        )}

        <div className="p-4 border-t bg-background"> {/* Ensure this part doesn't shrink */}
          <div className="flex items-center space-x-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isRecording} className="animate-pop-out hover:pop-out">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach image</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleToggleRecording} disabled={isLoading || (hasMicrophonePermission === false)} className={cn("animate-pop-out hover:pop-out", isRecording && "text-destructive")}>
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span className="sr-only">{isRecording ? 'Stop recording' : 'Start recording'}</span>
            </Button>
            <Input
              type="text"
              placeholder={isRecording ? "Recording audio..." : "Type your message..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && canSend && handleSendMessage()}
              className="flex-grow"
              disabled={isLoading || isRecording}
            />
            <Button 
              onClick={handleSendMessage} 
              className="animate-pop-out hover:pop-out active:pop-out" 
              disabled={!canSend}
            >
              {isLoading ? (
                <Sparkles className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
