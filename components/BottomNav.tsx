"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const items: NavItem[] = [
  {
    href: "/",
    label: "Library",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
        <path
          d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14V4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/add",
    label: "Add",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 border-t border-line bg-canvas/85 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-terracotta"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
