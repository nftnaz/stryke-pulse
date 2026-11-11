// frontend/src/pages/OptionsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import MetricCard from "../components/MetricCard";
import {
  getOptionsSummary,
  getOptionsChain,
} from "../services/options";
import type {
  OptionsSummary,
  OptionsChainResponse,
  StrikeRow,
} from "../types/market";

function fmt(n?: number | null, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function changeClass(n?: number | null): string {
  if (n == null) return "text-zinc-500";
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-rose-400";
  return "text-zinc-400";
}

export default function OptionsPage() {
  const [summary, setSummary] = useState<OptionsSummary | null>(null);
  const [chain, setChain] = useState<OptionsChainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol] = useState("NIFTY");

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, c] = await Promise.all([
        getOptionsSummary(symbol),
        getOptionsChain(symbol),
      ]);
      setSummary(s);
      setChain(c);
    } catch (err) {
      console.error(err);
      setError("Failed to load options data.");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  // Sort strikes and keep a reasonable window around spot
  const strikes = useMemo(() => {
    if (!chain?.strikes?.length) return [];
    const sorted = [...chain.strikes].sort((a, b) => a.strike - b.strike);
    const spot = chain.spot ?? summary?.spot;
    if (!spot) return sorted;

    // Keep ±800 points around spot for readability
    return sorted.filter((r) => Math.abs(r.strike - spot) <= 800);
  }, [chain, summary]);

  // Highlight max OI walls
  const maxCallOi = useMemo(
    () => Math.max(...strikes.map((s) => s.call_oi ?? 0), 0),
    [strikes]
  );
  const maxPutOi = useMemo(
    () => Math.max(...strikes.map((s) => s.put_oi ?? 0), 0),
    [strikes]
  );

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-zinc-400">
        Loading options intelligence…
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
        <p className="text-rose-400">{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Options Intelligence
          </h1>
          <p className="text-zinc-400 mt-2">
            {symbol}
            {summary?.expiry && (
              <span className="ml-2 text-zinc-500">
                · Expiry {summary.expiry}
              </span>
            )}
            {summary?.spot != null && (
              <span className="ml-2">
                · Spot {fmt(summary.spot, 2)}
              </span>
            )}
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          Source: {summary?.source ?? "—"}
        </div>
      </section>

      {/* Summary cards */}
      {summary && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="PCR"
            value={summary.pcr != null ? summary.pcr.toFixed(2) : "—"}
            subtitle={
              summary.pcr == null
                ? undefined
                : summary.pcr > 1.2
                  ? "Bullish bias"
                  : summary.pcr < 0.8
                    ? "Bearish bias"
                    : "Neutral"
            }
          />
          <MetricCard
            title="Max Pain"
            value={fmt(summary.max_pain)}
          />
          <MetricCard
            title="Support"
            value={fmt(summary.support)}
            subtitleClassName="text-emerald-400"
          />
          <MetricCard
            title="Resistance"
            value={fmt(summary.resistance)}
            subtitleClassName="text-rose-400"
          />
        </section>
      )}

      {/* Top walls */}
      {summary &&
        (summary.top_call_walls.length > 0 ||
          summary.top_put_walls.length > 0) && (
          <section className="grid md:grid-cols-2 gap-4">
            <WallList
              title="Top Call Walls (Resistance)"
              walls={summary.top_call_walls}
              side="call"
            />
            <WallList
              title="Top Put Walls (Support)"
              walls={summary.top_put_walls}
              side="put"
            />
          </section>
        )}

      {/* Insights */}
      {summary?.insights && summary.insights.length > 0 && (
        <section className="rounded-2xl border border-zinc-800 p-6">
          <h2 className="text-xl font-bold mb-4">Insights</h2>
          <div className="space-y-2">
            {summary.insights.map((text, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-zinc-300"
              >
                {text}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OI table */}
      <section className="rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Strike-wise Open Interest</h2>
          <span className="text-sm text-zinc-500">
            {strikes.length} strikes shown
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-900/60 text-zinc-400">
                <th className="text-left p-3 font-medium">Strike</th>
                <th className="text-right p-3 font-medium">Call OI</th>
                <th className="text-right p-3 font-medium">Call ΔOI</th>
                <th className="text-right p-3 font-medium">Put OI</th>
                <th className="text-right p-3 font-medium">Put ΔOI</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map((row: StrikeRow) => {
                const isCallWall =
                  maxCallOi > 0 && (row.call_oi ?? 0) === maxCallOi;
                const isPutWall =
                  maxPutOi > 0 && (row.put_oi ?? 0) === maxPutOi;
                const nearSpot =
                  summary?.spot != null &&
                  Math.abs(row.strike - summary.spot) < 50;

                return (
                  <tr
                    key={row.strike}
                    className={`
                      border-b border-zinc-900/80
                      ${nearSpot ? "bg-cyan-950/30" : ""}
                      ${isCallWall || isPutWall ? "bg-zinc-900/50" : ""}
                      hover:bg-zinc-900/40
                    `}
                  >
                    <td className="p-3 font-medium tabular-nums">
                      {fmt(row.strike)}
                      {nearSpot && (
                        <span className="ml-2 text-xs text-cyan-400">ATM</span>
                      )}
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums ${
                        isCallWall ? "text-rose-300 font-semibold" : ""
                      }`}
                    >
                      {fmt(row.call_oi)}
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums ${changeClass(
                        row.call_change_oi
                      )}`}
                    >
                      {row.call_change_oi != null
                        ? (row.call_change_oi > 0 ? "+" : "") +
                          fmt(row.call_change_oi)
                        : "—"}
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums ${
                        isPutWall ? "text-emerald-300 font-semibold" : ""
                      }`}
                    >
                      {fmt(row.put_oi)}
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums ${changeClass(
                        row.put_change_oi
                      )}`}
                    >
                      {row.put_change_oi != null
                        ? (row.put_change_oi > 0 ? "+" : "") +
                          fmt(row.put_change_oi)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WallList({
  title,
  walls,
  side,
}: {
  title: string;
  walls: { strike: number; oi: number }[];
  side: "call" | "put";
}) {
  if (!walls.length) return null;
  return (
    <div className="rounded-2xl border border-zinc-800 p-5">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">{title}</h3>
      <div className="space-y-2">
        {walls.slice(0, 5).map((w) => (
          <div
            key={w.strike}
            className="flex justify-between text-sm tabular-nums"
          >
            <span>{fmt(w.strike)}</span>
            <span
              className={
                side === "call" ? "text-rose-400" : "text-emerald-400"
              }
            >
              {fmt(w.oi)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}