"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Phone, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNavigation, siteConfig } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="header-inner shell">
        <Link className="brand" href="/" aria-label="Ramnova Healthcare home">
          <Image
            src="/images/brand/ramnova-logo.webp"
            alt=""
            width={72}
            height={72}
            className="brand-mark"
            priority
          />
          <span className="brand-type">
            <strong>RAMNOVA</strong>
            <small>HEALTHCARE</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNavigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <Link
                key={item.href}
                className={active ? "active" : ""}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <Link className="icon-link" href="/products/#catalog-search" aria-label="Search products">
            <Search size={18} aria-hidden="true" />
          </Link>
          <a className="header-call" href={`tel:${siteConfig.phoneHref}`}>
            <Phone size={16} aria-hidden="true" />
            <span>Talk to us</span>
          </a>
          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-navigation" className="mobile-nav open" aria-label="Mobile navigation">
          <div className="shell mobile-nav-inner">
            {primaryNavigation.map((item, index) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href.replace(/\/$/, ""));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>0{index + 1}</span>
                  {item.label}
                </Link>
              );
            })}
            <a className="button button-primary mobile-contact" href={siteConfig.whatsappHref}>
              WhatsApp enquiry
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
