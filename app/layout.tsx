import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NexconnProvider } from "@/components/providers/NexconnProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { NotificationToasts } from "@/components/notifications/NotificationToasts";
import { ServerAppShell } from "@/components/layout/ServerAppShell";

export const metadata: Metadata = {
  title: "LearnLync — Share What You Know. Discover What You Don't.",
  description:
    "Peer-to-peer skill exchange platform. Connect with learners worldwide to trade knowledge 1-for-1 with real-time chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appKey = process.env.NEXT_PUBLIC_NEXCONN_APP_KEY || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("learnlync_theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||(!t&&d)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased flex flex-col selection:bg-brand-500 selection:text-white">
        <ThemeProvider>
          <NexconnProvider appKey={appKey}>
            <NotificationProvider>
              <ServerAppShell>{children}</ServerAppShell>
              <NotificationToasts />
            </NotificationProvider>
          </NexconnProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
