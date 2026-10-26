"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Field = "name" | "businessName" | "email" | "phone";

const LABELS: Record<Field, string> = {
  name: "Name",
  businessName: "Business name",
  email: "Email",
  phone: "Phone",
};

const PLACEHOLDERS: Record<Field, string> = {
  name: "Your full name",
  businessName: "e.g. Shree Jewellers",
  email: "you@example.com",
  phone: "10-digit mobile number",
};

async function postJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    devCode?: string;
  };
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

/** Account details with inline editing. Email and phone changes need a one-time code. */
export function ProfileDetails({
  name,
  businessName,
  email,
  phone,
}: {
  name: string | null;
  businessName: string | null;
  /** null when the account only has a phone placeholder email */
  email: string | null;
  phone: string | null;
}) {
  const router = useRouter();
  const values: Record<Field, string | null> = { name, businessName, email, phone };

  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function startEdit(field: Field) {
    setEditing(field);
    setDraft(values[field] ?? "");
    setCode("");
    setCodeSent(false);
    setError(null);
    setNotice(null);
  }

  function cancel() {
    setEditing(null);
    setError(null);
    setNotice(null);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      if (editing === "name" || editing === "businessName") {
        await postJson("/api/account/profile", "PATCH", { [editing]: draft });
        setEditing(null);
        setNotice(`${LABELS[editing]} saved.`);
        router.refresh();
        return;
      }
      const channel = editing === "email" ? "email" : "sms";
      if (!codeSent) {
        const data = await postJson("/api/account/contact", "POST", {
          action: "send",
          channel,
          value: draft,
        });
        setCodeSent(true);
        setNotice(
          data.devCode ? `${data.message} (dev code: ${data.devCode})` : (data.message ?? null),
        );
        return;
      }
      await postJson("/api/account/contact", "POST", {
        action: "verify",
        channel,
        value: draft,
        code,
      });
      setEditing(null);
      setNotice(`${LABELS[editing]} updated.`);
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const fields: Field[] = ["name", "businessName", "email", "phone"];

  return (
    <section className="mt-4 rounded-2xl border border-primary/20 bg-white/70 p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/55">
          Account details
        </h2>
      </div>

      {notice && !editing ? (
        <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary" role="status">
          {notice}
        </p>
      ) : null}

      <ul className="mt-2 divide-y divide-primary/10">
        {fields.map((field) => {
          const value = values[field];
          const isContact = field === "email" || field === "phone";
          if (editing === field) {
            return (
              <li key={field} className="py-4">
                <label className="text-xs font-medium text-foreground/60" htmlFor={`profile-${field}`}>
                  {value || !isContact ? `${LABELS[field]}` : `Add ${LABELS[field].toLowerCase()}`}
                </label>
                <input
                  id={`profile-${field}`}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (codeSent) setCodeSent(false);
                  }}
                  placeholder={PLACEHOLDERS[field]}
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  inputMode={field === "phone" ? "numeric" : undefined}
                  autoComplete={
                    field === "name"
                      ? "name"
                      : field === "businessName"
                        ? "organization"
                        : field === "email"
                          ? "email"
                          : "tel"
                  }
                  maxLength={80}
                  autoFocus
                  className="mt-1.5 w-full rounded-xl border border-primary/25 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {isContact && codeSent ? (
                  <>
                    <label className="mt-3 block text-xs font-medium text-foreground/60" htmlFor="profile-code">
                      Verification code
                    </label>
                    <input
                      id="profile-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="Enter the code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="mt-1.5 w-full rounded-xl border border-primary/25 bg-white px-3.5 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </>
                ) : null}
                {isContact && !codeSent ? (
                  <p className="mt-2 text-xs text-foreground/55">
                    We&apos;ll send a code to confirm it. You can sign in with it afterwards.
                  </p>
                ) : null}
                {notice && codeSent ? (
                  <p className="mt-2 text-xs text-primary" role="status">
                    {notice}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-2 text-xs text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={busy}
                    className="rounded-xl border border-primary/25 bg-white py-2.5 text-sm font-medium text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={
                      busy ||
                      (isContact && !draft.trim()) ||
                      (isContact && codeSent && code.length < 4)
                    }
                    className="rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busy
                      ? "Please wait…"
                      : !isContact
                        ? "Save"
                        : codeSent
                          ? "Verify"
                          : "Send code"}
                  </button>
                </div>
              </li>
            );
          }
          return (
            <li key={field} className="flex items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground/55">{LABELS[field]}</p>
                <p
                  className={`mt-0.5 truncate text-[15px] ${
                    value ? "font-medium text-foreground" : "text-foreground/40"
                  }`}
                >
                  {value || "Not added"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(field)}
                disabled={editing !== null}
                className="shrink-0 rounded-full border border-primary/25 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-40"
              >
                {value ? "Edit" : "Add"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
