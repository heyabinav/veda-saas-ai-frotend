import Link from "next/link";
import Image from "next/image";

export default function BlogHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E3E0D8] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E3E0D8] bg-[#F5F4F0]">
            <Image
              src="/logo.svg"
              alt="VedaApex Logo"
              width={22}
              height={22}
              className="h-5 w-5 object-contain"
            />
          </span>
          <span className="font-serif text-lg font-bold tracking-wide text-[#191919]">
            VedaApex
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-[#6D6C67] sm:gap-4">
          <Link href="/" className="hidden rounded-lg px-2.5 py-1.5 transition-colors hover:bg-black/5 hover:text-[#191919] sm:block">
            Home
          </Link>
          <Link href="/explore-vedas" className="hidden rounded-lg px-2.5 py-1.5 transition-colors hover:bg-black/5 hover:text-[#191919] sm:block">
            Tools
          </Link>
          <Link href="/upgrade" className="hidden rounded-lg px-2.5 py-1.5 transition-colors hover:bg-black/5 hover:text-[#191919] sm:block">
            Pricing
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Start Free
          </Link>
        </nav>
      </div>
    </header>
  );
}
