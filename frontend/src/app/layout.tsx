import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "AAROH - Time-Aware, Context-Aware Navigation Platform",
  description: "Navigate with context, not just directions. Understand how a route changes with time, activity, support, lighting, and connectivity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0713] text-[#f5edfc] min-h-screen antialiased flex flex-col selection:bg-[#ff1493]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
