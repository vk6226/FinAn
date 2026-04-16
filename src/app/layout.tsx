import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinAn | Corporate Financial Analysis",
  description: "Professional financial analysis platform for M&A and DCF models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
