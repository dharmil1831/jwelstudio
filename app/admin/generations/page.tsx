import { listAdminGenerations } from "@/lib/admin-data";
import Link from "next/link";

export default async function AdminGenerationsPage() {
  const generations = await listAdminGenerations();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Generations</h1>
      <p className="mt-1 text-sm text-stone-600">Recent model shots and background stills</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generations.length === 0 ? (
          <p className="text-sm text-stone-500">No generations yet</p>
        ) : (
          generations.map((g) => (
            <div
              key={g.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <Link href={g.resultUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.resultUrl}
                  alt={g.mode === "background" ? "Background still" : "Model shot"}
                  className="aspect-[4/5] w-full object-cover"
                />
              </Link>
              <div className="px-3 py-2 text-xs text-stone-600">
                <p className="truncate font-medium text-stone-800">{g.user.email}</p>
                <p className="mt-0.5 text-stone-500">
                  {[
                    g.mode === "background" ? "background" : "model",
                    g.mode === "background" ? g.shot : g.placement,
                    g.vibe,
                  ]
                    .join(" · ")
                    .replace(/_/g, " ")}
                </p>
                <p className="mt-0.5 text-stone-400">
                  {g.createdAt.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
