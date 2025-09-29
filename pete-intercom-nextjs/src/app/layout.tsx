import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import { validateEnvironment, getEnvironmentInfo } from "@/lib/env";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="page-container">
          <Header />
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
