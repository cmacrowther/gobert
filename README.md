# Gobert Chat Interface

A modern, AI chat interface built with Next.js, Tailwind CSS, and shadcn/ui.
Designed to interface with a local Gobert instance.

## Features

- Real-time WebSocket communication with Gobert.
- Modern, clean UI with dark/light mode support (system default).
- Chat history persistence (localStorage).
- Responsive design.

## Prerequisites

- Node.js (v18+)
- A running instance of Gobert on `ws://localhost:18789`.

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Ensure Gobert is running:**

    Make sure your local Gobert instance is active and listening on port 18789.

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Open the app:**

    Navigate to [http://localhost:3000](http://localhost:3000).

## Troubleshooting

-   **"Not Connected"**: Ensure Gobert is running and accessible at `ws://localhost:18789`.
-   **No response**: Check if Gobert is receiving messages.

## Tech Stack

-   **Framework**: Next.js 15+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Components**: shadcn/ui
-   **Icons**: Lucide React
