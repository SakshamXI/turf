"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-pitch text-cream relative">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-lg tracking-tight" onClick={() => setMenuOpen(false)}>
          Game on Arena
        </Link>

        {/* Desktop nav — hidden on small screens, shown from sm breakpoint up */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link href="/#gallery" className="hover:text-floodlight transition-colors">
            Gallery
          </Link>
          <Link href="/pricing" className="hover:text-floodlight transition-colors">
            Pricing
          </Link>
          <Link href="/#contact" className="hover:text-floodlight transition-colors">
            Contact
          </Link>
          <Link href="/book" className="hover:text-floodlight transition-colors">
            Book a slot
          </Link>
        </nav>

        {/* Mobile hamburger — shown only below sm breakpoint */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="sm:hidden p-2 -mr-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <path d="M6 6L18 18M6 18L18 6" />
            ) : (
              <path d="M4 7H20M4 12H20M4 17H20" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="sm:hidden flex flex-col border-t border-cream/10 px-6 py-2 text-sm font-medium animate-fade-up">
          <Link href="/#gallery" className="py-3 hover:text-floodlight transition-colors" onClick={() => setMenuOpen(false)}>
            Gallery
          </Link>
          <Link href="/pricing" className="py-3 hover:text-floodlight transition-colors" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          <Link href="/#contact" className="py-3 hover:text-floodlight transition-colors" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
          <Link href="/book" className="py-3 hover:text-floodlight transition-colors" onClick={() => setMenuOpen(false)}>
            Book a slot
          </Link>
        </nav>
      )}
    </header>
  );
}
