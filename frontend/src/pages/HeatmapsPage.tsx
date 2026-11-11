import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { getHeatmap, type HeatmapCell } from "../services/analytics";

function intensityClass(change: number): string {
  // Strong green / red based on magnitude
  if (change >= 2) return "bg-emerald-500 text-black";
  if (change >= 1) return "bg-emerald-600/90 text-white";
  if (change >= 0.3) return "bg-emerald-800/80 text-emerald-100";
  if (change <= -2) return "bg-rose-500 text-black";
  if (change <= -1) return "bg-rose-600/90 text-white";
  if (change <= -0.3) return "bg-rose-900/80 text-rose-100";
  return "bg-zinc-800 text-zinc-300";
}

export default function HeatmapsPage() {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [lookback, setLookback] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getHeatmap(lookback);
      setCells(res.data);
    } catch (e) {
      console.error(e);
      setError("Failed to load heatmap. Is historical data backfilled?");
    } finally {
      setLoading(false);
    }
  }, [lookback]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Sector Heatmap
          </h1>
          <p className="text-zinc-400 mt-2">
            Performance of NSE sector indices over the last {lookback} sessions.
          </p>
        </div>

        <div className="flex gap-2">
          {[1, 5, 10, 20].map((d) => (
            <button
              key={d}
              onClick={() => setLookback(d)}
              className={`
                px-3 py-1.5 rounded-lg text-sm border transition
                ${lookback === d
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}
              `}
            >
              {d}D
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <div className="text-zinc-500 py-20 text-center">Loading heatmap…</div>
      )}

      {error && !loading && (
        <div className="text-rose-400 py-10 text-center">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cells.map((cell, i) => (
            <motion.div
              key={cell.symbol}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`
                relative overflow-hidden rounded-2xl p-4 min-h-[110px]
                flex flex-col justify-between
                ${intensityClass(cell.change_pct)}
              `}
            >
              <div className="font-semibold text-sm leading-tight">
                {cell.sector}
              </div>
              <div className="text-2xl font-bold tabular-nums mt-2">
                {cell.change_pct >= 0 ? "+" : ""}
                {cell.change_pct.toFixed(2)}%
              </div>
              {/* subtle shine */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {!loading && cells.length === 0 && !error && (
        <p className="text-zinc-500 text-center py-16">
          No sector data yet. Run the historical backfill first.
        </p>
      )}
    </div>
  );
}