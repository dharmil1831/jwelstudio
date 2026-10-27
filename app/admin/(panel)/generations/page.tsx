import {
  adminGenerationsByDay,
  adminGenerationsForDay,
} from "@/lib/admin-data";
import Link from "next/link";

const MODE_LABELS: Record<string, string> = {
  model: "Model shots",
  background: "Backgrounds",
  video: "Videos",
};

function oneParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function AdminGenerationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[]; email?: string | string[] }>;
}) {
  const sp = await searchParams;
  const date = oneParam(sp.date);
  const email = oneParam(sp.email);
  const byDay = await adminGenerationsByDay(email);
  const report = date ? await adminGenerationsForDay(date, email) : null;
  const dayLabel = date
    ? new Date(`${date}T12:00:00+05:30`).toLocaleDateString(
    "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        },
      )
    : "";

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Generations</h1>
      <p className="mt-1 text-sm text-foreground/70">
        One row per account per day. Leave the email blank to see every account. Open a row to see that account's images and videos.
      </p>

      <form
        action="/admin/generations"
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <label className="block text-xs font-medium text-foreground/70">
          Account email
          <input
            name="email"
            type="search"
            defaultValue={email}
            placeholder="name@email.com"
            className="mt-1 block w-64 rounded-lg border border-primary/25 bg-secondary px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block text-xs font-medium text-foreground/70">
          Day
          <input
            name="date"
            type="date"
            defaultValue={date}
            className="mt-1 block rounded-lg border border-primary/25 bg-secondary px-3 py-2 text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background"
        >
          Show
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-primary/20 bg-secondary shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-primary/15 bg-background/40 text-xs uppercase tracking-wide text-foreground/55">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Background</th>
              <th className="px-4 py-3">Video</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {byDay.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-foreground/55" colSpan={7}>
                  No saved generations{email ? " for this account" : ""}.
                </td>
              </tr>
            ) : (
              byDay.map((row) => {
                const params = new URLSearchParams({
                  date: row.day,
                  email: row.email,
                });
                const label = new Date(`${row.day}T12:00:00+05:30`).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  },
                );
                const selected = date === row.day && email === row.email;
                return (
                  <tr
                    key={`${row.day}-${row.email}`}
                    className={selected ? "bg-primary/10" : undefined}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/generations?${params.toString()}`}
                        className="font-medium text-primary hover:text-accent"
                      >
                        {label}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3 text-foreground/70">
                      {row.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.count}</td>
                    <td className="px-4 py-3">{row.model}</td>
                    <td className="px-4 py-3">{row.background}</td>
                    <td className="px-4 py-3">{row.video}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {date && report === null ? (
        <p className="mt-6 text-sm text-foreground/70">
          That date is not valid. Use a day like 2026-10-25.
        </p>
      ) : report ? (
        <>
          <div className="mt-6 rounded-xl border border-primary/20 bg-secondary p-5 shadow-sm">
            <p className="text-sm text-foreground/70">
              {email ? email : "All accounts"} · {dayLabel} · midnight to midnight IST
            </p>
            <p className="mt-1 text-3xl font-light text-foreground">
              {report.count}
            </p>
            <p className="text-sm text-foreground/60">
              saved generation{report.count === 1 ? "" : "s"}
            </p>
            {report.byMode.length > 0 ? (
              <p className="mt-3 text-sm text-foreground/75">
                {report.byMode
                  .map(
                    (row) =>
                      `${MODE_LABELS[row.mode] ?? row.mode}: ${row.count}`,
                  )
                  .join(" · ")}
              </p>
            ) : null}
            {report.byUser.length > 1 ? (
              <ul className="mt-3 space-y-1 text-sm text-foreground/80">
                {report.byUser.map((row) => (
                  <li key={row.email}>
                    {row.email}: {row.count}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.generations.length === 0 ? (
              <p className="text-sm text-foreground/55">
                No saved generations for this day
                {email ? " and account" : ""}.
              </p>
            ) : (
              report.generations.map((g) => (
                <div
                  key={g.id}
                  className="overflow-hidden rounded-xl border border-primary/20 bg-secondary shadow-sm"
                >
                  <Link href={g.resultUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.resultUrl}
                      alt={g.mode === "background" ? "Background still" : "Model shot"}
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </Link>
                  <div className="px-3 py-2 text-xs text-foreground/70">
                    <p className="truncate font-medium text-foreground">
                      {g.user.email}
                    </p>
                    <p className="mt-0.5 text-foreground/55">
                      {[
                        MODE_LABELS[g.mode] ?? g.mode,
                        g.format,
                        g.mode === "background" ? g.shot : g.placement,
                        g.vibe,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                        .replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-foreground/45">
                      {g.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {report.count > report.generations.length ? (
            <p className="mt-4 text-sm text-foreground/60">
              Showing the latest {report.generations.length} of {report.count}.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
