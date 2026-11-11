import { useMemo } from "react";
import { motion } from "motion/react";
import type { SectorFlowResponse } from "../services/analytics";

type Props = { flow: SectorFlowResponse };

export default function OrderflowView({ flow }: Props) {
  const topSectors = useMemo(
    () =>
      [...flow.all]
        .sort((a, b) => Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0))
        .slice(0, 6),
    [flow]
  );

  // Until we have real F&O stock flow, show sector as the "node"
  // and duplicate strongest as right-hand "names" so the layout matches.
  const rightNodes = topSectors.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Market → Sectors → Leaders
        </p>
        <h2 className="text-2xl font-bold mt-1">Follow the money</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Sector pressure from stored index data. Stock-level order blocks come next.
        </p>
      </div>

      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 min-h-[360px] overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_200px_1fr_220px] gap-2 items-center">
          {/* Hub */}
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-cyan-500/50 bg-cyan-950/40 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.2)]">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                NSE
              </span>
              <span className="font-bold text-sm">MARKET</span>
              <span className="text-[10px] text-zinc-500 mt-1">
                {flow.all.length} sectors
              </span>
            </div>
          </div>

          {/* paths left → mid */}
          <OrderflowPaths count={topSectors.length} side="left" />

          {/* Sector column */}
          <div className="space-y-2 z-10">
            {topSectors.map((s) => {
              const pct = s.change_pct ?? 0;
              const up = pct >= 0;
              return (
                <div
                  key={s.sector}
                  className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.sector}</span>
                    <span
                      className={`tabular-nums ${
                        up ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {up ? "+" : ""}
                      {pct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 uppercase">
                    {s.direction === "in" ? "Inflow est." : s.direction === "out" ? "Outflow est." : "Neutral"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* paths mid → right */}
          <OrderflowPaths count={rightNodes.length} side="right" />

          {/* Right leaders */}
          <div className="space-y-2 z-10">
            {rightNodes.map((s) => {
              const pct = s.change_pct ?? 0;
              const up = pct >= 0;
              return (
                <div
                  key={`r-${s.sector}`}
                  className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 flex items-center justify-between"
                >
                  <span className="font-medium text-sm">{s.sector}</span>
                  <span
                    className={`text-sm tabular-nums ${
                      up ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {up ? "+" : ""}
                    {pct.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderflowPaths({
  count,
  side,
}: {
  count: number;
  side: "left" | "right";
}) {
  const h = 320;
  const w = 120;
  const paths = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const y = ((i + 0.5) / count) * (h - 40) + 20;
      const y2 = y;
      if (side === "left") {
        return `M 0 ${h / 2} C ${w * 0.4} ${h / 2}, ${w * 0.5} ${y2}, ${w} ${y2}`;
      }
      return `M 0 ${y} C ${w * 0.5} ${y}, ${w * 0.6} ${y2}, ${w} ${y2}`;
    });
  }, [count, side, h]);

  return (
    <svg className="w-full h-[320px]" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#22d3ee" strokeOpacity="0.25" strokeWidth="1.5" />
          <motion.path
            d={d}
            fill="none"
            stroke="#67e8f9"
            strokeWidth="1.5"
            strokeDasharray="5 12"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: side === "left" ? -30 : -30 }}
            transition={{
              duration: 2 + i * 0.15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </g>
      ))}
    </svg>
  );
}