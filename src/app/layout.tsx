import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Newsreader } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getInitialLocalePrefs, getInitialTheme } from "@/lib/current-user";
import { Providers } from "./providers";

const guardianSans = localFont({
  variable: "--font-guardian-sans",
  display: "swap",
  src: [
    { path: "../fonts/guardian/GuardianSansLight.woff2", weight: "300", style: "normal" },
    { path: "../fonts/guardian/GuardianSansLightIt.woff2", weight: "300", style: "italic" },
    { path: "../fonts/guardian/GuardianSansRegular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/guardian/GuardianSansRegularIt.woff2", weight: "400", style: "italic" },
    { path: "../fonts/guardian/GuardianSansMedium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/guardian/GuardianSansSemibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/guardian/GuardianSansBold.woff2", weight: "700", style: "normal" },
  ],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = await getInitialTheme();
  const initialLocale = await getInitialLocalePrefs();

  return (
    <html
      lang={initialLocale.spellcheckerLanguage}
      suppressHydrationWarning
      className={`${guardianSans.variable} ${newsreader.variable} h-full`}
    >
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
          <Providers
            defaultTheme={initialTheme}
            spellcheckerLanguage={initialLocale.spellcheckerLanguage}
            timezone={initialLocale.timezone}
          >
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
