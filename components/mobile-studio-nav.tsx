"use client";

import Link from "next/link";

export type StudioScreen = "home" | "tools" | "edit" | "profile";

const ITEMS: { id: StudioScreen; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "tools", label: "Tools" },
  { id: "edit", label: "Edit" },
  { id: "profile", label: "Profile" },
];

export function MobileStudioNav({
  active,
  onSelect,
}: {
  active?: StudioScreen | null;
  onSelect?: (id: StudioScreen) => void;
}) {
  return (
    <nav className="relative z-10 grid grid-cols-4 gap-1 border-t border-primary/15 bg-white px-1 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(76,45,120,0.10)]">
      {ITEMS.map((item) => {
        const selected = active === item.id;
        const className = `flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-bold ${
          selected ? "bg-primary text-white" : "text-foreground/55"
        }`;
        const inner = (
          <>
            <NavIcon id={item.id} />
            {item.label}
          </>
        );
        if (onSelect) {
          return (
            <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={className}>
              {inner}
            </button>
          );
        }
        return (
          <Link key={item.id} href={`/?screen=${item.id}`} className={className}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ id }: { id: StudioScreen }) {
  const common = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    );
  }
  if (id === "tools") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect {...common} x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect {...common} x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect {...common} x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect {...common} x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "edit") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path {...common} d="M4 20h4l11-11-4-4L4 16v4z" />
        <path {...common} d="m13 7 4 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle {...common} cx="12" cy="8" r="3.5" />
      <path {...common} d="M5 19.5c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}
