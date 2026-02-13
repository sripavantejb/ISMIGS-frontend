# ISMIGS AI Chatbot

A fully functional AI chatbot powered by Google Gemini that answers questions about Energy, WPI, IIP, GDP, GVA, and macro outlooks.

## Setup

1. Add your Gemini API key to `.env`:
   ```
   VITE_GEMINI_API_KEY=your-api-key-here
   ```
   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

The chatbot component can be dropped into any page. It appears as a floating button in the bottom-right corner.

### Basic Usage

```tsx
import ISMIGSChatbot from "@/components/chatbot/ISMIGSChatbot";

function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <ISMIGSChatbot />
    </div>
  );
}
```

### With Context (Optional)

You can pass context about the current page/section to help the chatbot align responses with dashboard data:

```tsx
<ISMIGSChatbot context="Energy Analytics - Current page showing electricity trends" />
```

## Features

- **Gemini-powered**: Uses Google's Gemini 1.5 Flash model
- **Context-aware**: Can receive optional context about current page/section
- **Date-aware**: Automatically includes current date/time in system prompt
- **Structured responses**: Follows ISMIGS system prompt for concise, formatted answers
- **Error handling**: Clear error messages for missing API key or API failures

## Component API

```tsx
interface ISMIGSChatbotProps {
  /**
   * Optional context string (e.g., current page/section) to help the chatbot
   * align responses with dashboard data.
   */
  context?: string;
}
```

## Files

- `ISMIGSChatbot.tsx` - Main UI component
- `geminiChat.ts` - Gemini API client
- `ismigsSystemPrompt.ts` - System prompt definition
