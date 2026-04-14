import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyBack | EU261 Flight Compensation",
  description: "Get up to €600 for flight delays and cancellations under EU261/UK261. No win, no fee.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        style={{
          fontFamily:
            "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
        className="bg-[#08090a] text-[#f7f8f8] min-h-screen antialiased"
      >
        {children}
      </body>
    </html>
  );
}
