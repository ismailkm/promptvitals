import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptVitals - Your AI Prompt Health Checker',
  description: 'Get instant, actionable insights on your AI prompts. Identify weaknesses, boost clarity, and improve accuracy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-cyber-black text-gray-100">
        {children}
      </body>
    </html>
  );
}