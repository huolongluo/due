import type { Metadata } from "next";
import { Newsreader, Figtree, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Due — the model cannot advance it",
  description:
    "BUIDL CTC 2026 Fall. Quay Factors. AI underwrites a trade invoice. Attestcoin must cite the Ethereum payment before Creditcoin advances.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <header className="wrap site-header">
          <Link href="/" className="brand">
            D<em>ue</em>
          </Link>
          <nav className="nav">
            <Link href="/desk">Desk</Link>
            <Link href="/how">How it cites</Link>
            <Link href="/open">Open</Link>
          </nav>
        </header>
        {children}
        <footer className="wrap site-footer">
          <span>BUIDL CTC 2026 Fall · AI + RWA</span>
          <span>Reed can underwrite. Attestcoin opens the vault.</span>
        </footer>
      </body>
    </html>
  );
}
