"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  type PublicModelTemplate,
  type TemplateCategory,
} from "@/lib/model-template-categories";

let cachedTemplates: PublicModelTemplate[] | null = null;

function useModelTemplates(): PublicModelTemplate[] | null {
  const [templates, setTemplates] = useState<PublicModelTemplate[] | null>(cachedTemplates);
  useEffect(() => {
    if (cachedTemplates) return;
    let cancelled = false;
    void fetch("/api/model-templates")
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((d: { templates?: PublicModelTemplate[] }) => {
        cachedTemplates = d.templates ?? [];
        if (!cancelled) setTemplates(cachedTemplates);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return templates;
}

export function templateTitle(t: Pick<PublicModelTemplate, "category">): string {
  return `${TEMPLATE_CATEGORY_LABELS[t.category]} model`;
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#fff" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#fff" strokeWidth="2.4" />
    </svg>
  );
}

export function ModelTemplatePicker({
  selectedId,
  onSelect,
  canUse,
  signedIn,
}: {
  selectedId: string | null;
  onSelect: (template: PublicModelTemplate | null) => void;
  canUse: boolean;
  signedIn: boolean;
}) {
  const templates = useModelTemplates();
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [triedLocked, setTriedLocked] = useState(false);

  const categories = useMemo(
    () => TEMPLATE_CATEGORIES.filter((c) => templates?.some((t) => t.category === c)),
    [templates],
  );
  const visible = useMemo(
    () => (templates ?? []).filter((t) => category === "all" || t.category === category),
    [templates, category],
  );
  const selected = canUse ? templates?.find((t) => t.id === selectedId) ?? null : null;

  useEffect(() => {
    if (templates && selectedId && !templates.some((t) => t.id === selectedId)) onSelect(null);
  }, [templates, selectedId, onSelect]);

  if (!templates || templates.length === 0) return null;

  const chip = (id: TemplateCategory | "all", label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setCategory(id)}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        category === id
          ? "border-primary bg-primary text-white"
          : "border-primary/20 bg-white text-foreground/75"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Model templates</p>
        <p className="mt-0.5 text-[11px] text-foreground/55">
          Pick a model. Your jewelry is put on this exact person.
        </p>
      </div>

      {categories.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {chip("all", "All")}
          {categories.map((c) => chip(c, TEMPLATE_CATEGORY_LABELS[c]))}
        </div>
      ) : null}

      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setTriedLocked(false);
            onSelect(null);
          }}
          className={`grid h-[108px] w-[84px] shrink-0 place-items-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-[11px] text-foreground/55 ${
            !selected ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          No template
        </button>
        {visible.map((t) => {
          const on = selected?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={templateTitle(t)}
              aria-pressed={on}
              onClick={() => {
                if (!canUse) {
                  setTriedLocked(true);
                  return;
                }
                onSelect(t);
              }}
              className={`relative block h-[108px] w-[84px] shrink-0 overflow-hidden rounded-2xl ${
                on ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              {!canUse ? (
                <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60">
                  <LockIcon />
                </span>
              ) : null}
              {on ? (
                <span className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-primary">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
                    <path
                      d="m5 12 5 5 9-10"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="flex items-center gap-3 rounded-2xl bg-primary/8 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.imageUrl} alt="" className="h-28 w-[88px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{templateTitle(selected)}</p>
            <p className="mb-2 mt-0.5 text-[11px] leading-relaxed text-foreground/60">
              {selected.description ? `${selected.description.replace(/[.\s]+$/, "")}. ` : ""}
              Your uploaded jewelry replaces the jewelry in this photo.
            </p>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="rounded-full border border-primary/25 bg-white px-3 py-1.5 text-xs font-semibold text-primary"
            >
              Remove model
            </button>
          </div>
        </div>
      ) : null}

      {!canUse && triedLocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed">
          <p>
            <span className="font-semibold">Model templates are on paid plans.</span>{" "}
            {signedIn
              ? "Upgrade to put your jewelry on this model in every photo."
              : "Log in and pick a plan to put your jewelry on this model."}
          </p>
          <Link
            href={signedIn ? "/pricing" : "/login"}
            className="mt-2 inline-block rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
          >
            {signedIn ? "See plans" : "Log in"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
