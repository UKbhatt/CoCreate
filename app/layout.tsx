// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Work_Sans } from "next/font/google";
import "./globals.css";
import { Room } from "./Room";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400","600"] });

export const metadata: Metadata = {
  title: "CoCreate",
  description: "It is collaborative work space for building design for Web Apps , mobile Apps etc",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#242424]`}>
        {/* Wrap everything that uses <Tooltip> inside exactly ONE provider */}
        <TooltipProvider>
          <Room>{children}</Room>
        </TooltipProvider>
      </body>
    </html>
  );
}
