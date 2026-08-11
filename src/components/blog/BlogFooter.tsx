import Link from "next/link";
import Image from "next/image";

export default function BlogFooter() {
  return (
    <footer className="border-t border-[#E3E0D8] bg-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[#8A8984] sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="VedaApex Logo"
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
          <span className="font-serif font-bold text-[#191919]">VedaApex</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5">
          <Link href="/" className="transition-colors hover:text-[#191919]">
            Home
          </Link>
          <Link href="/explore-vedas" className="transition-colors hover:text-[#191919]">
            Tools
          </Link>
          <Link href="/upgrade" className="transition-colors hover:text-[#191919]">
            Pricing
          </Link>
          <Link href="/blog" className="font-medium text-[#191919]">
            Blog
          </Link>
        </nav>
        <p className="text-xs">© 2026 VedaApex. All rights reserved.</p>
      </div>
    </footer>
  );
}
