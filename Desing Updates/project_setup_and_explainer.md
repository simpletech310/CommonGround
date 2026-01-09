# CommonGround MVP - Project Explainer & Setup Guide

## 1. Project Overview
**Name**: CommonGround MVP
**Stack**:
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **UI**: React 19.2, Tailwind CSS v4
- **Real-time Video**: Daily.co
- **AI**: OpenAI (GPT-4o) for ARIA safe-guarding
- **Icons**: Lucide React

This project is a high-fidelity collaboration platform designed for safe, conflict-free communication, featuring real-time video, collaborative games (Arcade), shared movie watching (Theater), and AI-moderated chat.

---

## 2. Folder Structure Breakdown
Here is the high-level structure of the application:

```text
mvp/
├── .env.local              # Local environment variables (API Keys) - NOT COMMITTED
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # Tailwind CSS configuration
├── public/                 # Static assets (images, fonts, this file)
│   ├── Kids Movies/        # Media assets for Theater
│   ├── *.svg               # UI icons
│   └── *_poster_*.png      # Game posters
├── src/
│   ├── app/                # App Router (Pages & API Routes)
│   │   ├── api/            # Backend API Endpoints
│   │   │   ├── analyze-sentiment/ # OpenAI Sentiment Analysis
│   │   │   └── create-room/       # Daily.co Room Management
│   │   ├── call/           # Video Call Route
│   │   ├── layout.tsx      # Root Layout
│   │   └── page.tsx        # Landing Page / Home
│   ├── components/         # Reusable UI Components
│   │   ├── Arcade.tsx      # Games interface
│   │   ├── Chat.tsx        # Secure Chat with AI moderation
│   │   ├── Theater.tsx     # Synchronized Video Player
│   │   ├── VideoCall.tsx   # Main Daily.co wrapper
│   │   ├── VideoTile.tsx   # Individual video participant component
│   │   └── Whiteboard.tsx  # Collaborative canvas
│   └── hooks/              # Custom React Hooks
│       └── useAriaMonitor.ts # Hook for AI text monitoring
└── tsconfig.json           # TypeScript configuration
```

---

## 3. Required API Keys & Configuration
To run this application, you must create a `.env.local` file in the root `mvp/` directory.

### `.env.local` Template:
```bash
# Required for ARIA (AI Sentiment Analysis)
OPENAI_API_KEY=sk-proj-... 

# Required for Video Calls
DAILY_API_KEY=your_daily_co_api_key
```

### Key Descriptions:
1.  **`OPENAI_API_KEY`**: Used by `/api/analyze-sentiment`. This powers the "ARIA" safety monitor which analyzes chat messages for hostility, self-harm, or profanity before they are sent.
2.  **`DAILY_API_KEY`**: Used by `/api/create-room`. This allows the server to securely create video call rooms via the Daily.co API. You can get this from [daily.co](https://www.daily.co/).

---

## 4. Components & Modules Explained

### A. Core Features (Client-Side)
*   **`VideoCall.tsx`**: The heart of the application. It initializes the Daily.co call object (`useCallObject`), handles joining rooms, and manages the layout of the "Sub-Apps" (Arcade, Theater, Whiteboard).
*   **`Arcade.tsx`**: A game center overlay. It displays game posters and managing the state of active games.
*   **`Theater.tsx`**: A synchronized media player. It allows users to watch videos together.
*   **`Chat.tsx`**: A real-time chat interface. It integrates with `useAriaMonitor` to "intercept" messages. If ARIA flags a message, the user is warned; otherwise, it is sent to other participants via Daily.co's `sendAppMessage`.

### B. Backend Services (API Routes)
*   **`/api/analyze-sentiment`**:
    *   **Input**: JSON `{ text: "message content" }`
    *   **Logic**: Sends prompt to OpenAI (GPT-4o) acting as "Aria" to classify text for safety violations.
    *   **Output**: JSON `{ is_violation: boolean, category: string, reason: string }`
*   **`/api/create-room`**:
    *   **Logic**: Checks if a room exists on Daily.co; if not, creates it with specific properties (e.g., chat enabled, 24h expiry).
    *   **Output**: Room URL and details.

### C. Utilities
*   **`useAriaMonitor.ts`**: A custom hook that abstracts the fetch call to the sentiment analysis API, simplifying the logic in `Chat.tsx`.

---

## 5. How to Recreate This Setup (Step-by-Step)

If you needed to rebuild this from scratch, follow these steps:

### Phase 1: Scaffolding
1.  **Initialize Next.js**:
    ```bash
    npx create-next-app@latest mvp --typescript --tailwind --eslint
    ```
    *   Select "Yes" for App Router and "No" for `src/` directory (or "Yes" if you prefer, this repo uses `src/`).
2.  **Install Dependencies**:
    ```bash
    npm install @daily-co/daily-js @daily-co/daily-react lucide-react openai react-pdf pdfjs-dist tailwind-merge clsx
    ```
    *   `daily-js` / `daily-react`: For video calls.
    *   `openai`: For backend AI helpers.
    *   `lucide-react`: For icons.

### Phase 2: Configuration
1.  **Tailwind**: Ensure `globals.css` imports tailwind directives.
2.  **Environment**: Create `.env.local` and add your keys (see Section 3).

### Phase 3: Implementation
1.  **Create API Routes**:
    *   Create `src/app/api/create-room/route.ts` to handle Daily.co room creation.
    *   Create `src/app/api/analyze-sentiment/route.ts` to handle OpenAI requests.
2.  **Build Components**:
    *   Build `VideoCall.tsx` to wrap the Daily provider `<DailyProvider>`.
    *   Build sub-features (`Chat`, `Arcade`) and ensure they use the `useDailyEvent` or `useAppMessage` hooks to synchronize state across clients.
3.  **Integrate**:
    *   Update `page.tsx` to provide a login or room entry UI.
    *   Ensure the entry point calls the `/api/create-room` endpoint to get a valid URL before loading the `VideoCall` component.

### Phase 4: Running
1.  Start development server:
    ```bash
    npm run dev
    ```
2.  Open `http://localhost:3000`.

---

*Generated by CommonGround Intelligent Assistant*
