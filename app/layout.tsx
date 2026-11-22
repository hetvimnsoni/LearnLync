
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NexconnProvider } from "@/components/providers/NexconnProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { NotificationToasts } from "@/components/notifications/NotificationToasts";
import { ServerAppShell } from "@/components/layout/ServerAppShell";
import { LumiProvider } from "@/components/mascot/LumiContext";
import { LumiFloatingLauncher } from "@/components/mascot/LumiFloatingLauncher";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#090c17" },
  ],
};

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
              <LumiProvider>
                <ServerAppShell>{children}</ServerAppShell>
                <NotificationToasts />
                <LumiFloatingLauncher />
              </LumiProvider>
            </NotificationProvider>
          </NexconnProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
