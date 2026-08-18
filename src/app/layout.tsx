import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Roboto } from "next/font/google";
import "./globals.css";
import { getInitialLocalePrefs, getInitialTheme } from "@/lib/current-user";
import { Providers } from "./providers";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hackollab",
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
      className={`${roboto.variable} h-full`}
    >
      <body className="bg-canvas text-foreground min-h-full font-sans antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              borderRadius: "0px",
              colorBackground: "#050505",
              colorPrimary: "#4d8fd6",
              fontFamily: "var(--font-roboto), ui-sans-serif, system-ui, sans-serif",
            },
            elements: {
              card: "border border-[#262626] bg-[#050505] shadow-none",
              cardBox: "shadow-none",
              footer: "bg-[#050505]",
              formButtonPrimary: "bg-[#4d8fd6] text-[#ffffff] hover:bg-[#3a7bc4] shadow-none",
              formFieldInput: "border-[#262626] bg-[#000000] text-[#ffffff] focus:border-[#4d8fd6]",
              headerSubtitle: "text-[#8f8f8f]",
              headerTitle: "font-medium",
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
