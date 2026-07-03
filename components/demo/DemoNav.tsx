"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface DemoNavProps {
  clinicName: string;
  logoUrl: string | null;
  color: string;
  phone: string;
}

export function DemoNav({ clinicName, logoUrl, color, phone }: DemoNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 60); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Services", "Why Us", "Journey", "Contact"];

  function scrollTo(id: string) {
    document.getElementById(id.toLowerCase().replace(/ /g, "-"))?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-100" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: color }}
              >
                {clinicName[0]}
              </div>
            )}
            <span className={`font-semibold text-sm tracking-tight ${scrolled ? "text-stone-900" : "text-white"}`}>
              {clinicName}
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <button
                key={l}
                onClick={() => scrollTo(l)}
                className={`text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                  scrolled ? "text-stone-500 hover:text-stone-900" : "text-white/70 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:${phone}`}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: color }}
            >
              {phone}
            </a>
            <button
              className={`md:hidden p-2 rounded-lg ${scrolled ? "text-stone-700" : "text-white"}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col pt-20 px-6 gap-2"
            onClick={e => e.stopPropagation()}
          >
            {links.map(l => (
              <button
                key={l}
                onClick={() => scrollTo(l)}
                className="text-left text-sm font-semibold uppercase tracking-[0.1em] text-stone-600 hover:text-stone-900 py-3 border-b border-stone-50"
              >
                {l}
              </button>
            ))}
            <a
              href={`tel:${phone}`}
              className="mt-4 text-center text-sm font-semibold py-3 rounded-xl text-white"
              style={{ backgroundColor: color }}
            >
              Call {phone}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
