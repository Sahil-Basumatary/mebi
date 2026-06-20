import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mebi",
  description:
    "Find serious project partners at KCL, build real projects, and turn them into CV-ready work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${newsreader.variable} h-full`}>
      <body className="bg-canvas text-foreground min-h-full font-sans antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              borderRadius: "0px",
              colorBackground: "#050505",
              colorPrimary: "#ffffff",
            },
            elements: {
              card: "border border-[#262626] bg-[#050505] shadow-none",
              cardBox: "shadow-none",
              footer: "bg-[#050505]",
              formButtonPrimary:
                "bg-[#ffffff] text-[#000000] hover:bg-[#e6e6e6] shadow-none",
              formFieldInput:
                "border-[#262626] bg-[#000000] text-[#ffffff] focus:border-[#ffffff]",
              headerSubtitle: "text-[#8f8f8f]",
              headerTitle: "font-serif font-light",
              socialButtonsBlockButton:
                "border-[#262626] bg-[#000000] text-[#ffffff] hover:bg-[#121212]",
            },
          }}
        >
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
