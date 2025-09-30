import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { validateEnvironment, getEnvironmentInfo } from "@/lib/env";
import { UIConfigProvider } from "@/contexts/UIConfigContext";
import { getUIConfig } from "@/actions/ui-config";
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Pete Intercom App",
  description: "Intercom Canvas Kit integration with Next.js",
};

// Validate environment variables at startup
// This will throw and crash the app if required variables are missing
try {
  validateEnvironment();
  const envInfo = getEnvironmentInfo();
  console.log('✅ Environment validated:', envInfo);
} catch (error) {
  console.error('❌ Environment validation failed');
  console.error(error);
  throw error; // Re-throw to prevent app from starting
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load UI configuration
  const configResult = await getUIConfig();
  const uiConfig = configResult.success && configResult.data ? configResult.data : undefined;

  if (!uiConfig) {
    console.error('Failed to load UI config:', configResult.error);
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <UIConfigProvider config={uiConfig!}>
            <div className="page-container">
              <Header />
              <Navigation />
              <main>{children}</main>
            </div>
          </UIConfigProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
