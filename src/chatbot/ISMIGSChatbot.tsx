import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendChatMessage, convertToGeminiHistory } from "./geminiChat";
import { cn } from "@/lib/utils";

export interface ISMIGSChatbotProps {
  /**
   * Optional context string (e.g., current page/section) to help the chatbot
   * align responses with dashboard data. Can be passed from parent components
   * when the chatbot is used on specific pages.
   */
  context?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * ISMIGS AI Chatbot Component
 * 
 * A fully functional AI chatbot powered by Google Gemini that answers
 * questions about Energy, WPI, IIP, GDP, GVA, and macro outlooks.
 * 
 * Usage:
 * ```tsx
 * <ISMIGSChatbot />
 * // or with context:
 * <ISMIGSChatbot context="Energy Analytics - Current page showing electricity trends" />
 * ```
 */
export default function ISMIGSChatbot({ context }: ISMIGSChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('ismigs-chatbot-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    }
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('ismigs-chatbot-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Open dialog when Farmers page dispatches open event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("ismigs-open-chatbot", handler);
    return () => window.removeEventListener("ismigs-open-chatbot", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Add user message
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Convert to Gemini format
      const history = convertToGeminiHistory(newMessages);

      // Send to Gemini
      const response = await sendChatMessage(history, userMessage, context);

      // Add assistant response
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response from AI";
      setError(errorMessage);
      console.error("Chatbot error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (content: string) => {
    // Simple formatting: preserve line breaks and basic markdown-like structure
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Bold headings (lines ending with ** or starting with **)
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <div key={idx} className="font-semibold text-foreground mt-3 mb-1 first:mt-0">
            {trimmed.slice(2, -2)}
          </div>
        );
      }
      
      // Bullet points
      if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        return (
          <div key={idx} className="ml-4 mb-1">
            {trimmed}
          </div>
        );
      }
      
      // Regular line
      if (trimmed) {
        return <div key={idx} className="mb-1">{line}</div>;
      }
      
      // Empty line
      return <br key={idx} />;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-16 right-20 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
          aria-label="Open ISMIGS AI Chatbot"
        >
          <Bot className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="fixed bottom-6 right-6 left-auto top-auto z-50 flex h-[min(85vh,36rem)] w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 rounded-xl border p-0 shadow-[0_8px_30px_rgba(0,0,0,0.25)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4 sm:rounded-xl"
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <DialogTitle>ISMIGS AI</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Ask questions about Energy, WPI, IIP, GDP, GVA, and macro outlooks
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Welcome to ISMIGS AI. How can I help you understand India's macro-economic indicators?
                </p>
              </div>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.role === "user" ? (
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">
                      {formatMessage(message.content)}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error.includes("quota exceeded") ? (
                    <span>
                      Free-tier quota is used for now. Quota often resets in a few minutes or the next day. You can{" "}
                      <a
                        href="https://ai.google.dev/gemini-api/docs/rate-limits"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        check limits
                      </a>{" "}
                      or enable billing in Google AI Studio for more.
                    </span>
                  ) : (
                    error
                  )}
                </AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Energy, WPI, IIP, GDP, GVA, or macro trends..."
              className="min-h-[60px] resize-none"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="self-end"
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
