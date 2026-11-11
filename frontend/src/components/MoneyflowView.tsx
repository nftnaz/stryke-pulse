import { useMemo } from "react";
import { motion } from "motion/react";
import type { SectorFlowResponse } from "../services/analytics";

type Props = { flow: SectorFlowResponse };

function intensity(pct: number) {
  return Math.min(1, Math.abs(pct) / 5);
}

export default function MoneyflowView({ flow }: Props) {
  const sectors = useMemo(() => {
    return [...flow.all].sort(
      (a, b) => Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0)
    );
  }, [flow]);

  const inflows = flow.inflows;
  const outflows = flow.outflows;

  const totalIn = inflows.reduce((s, f) => s + Math.abs(f.change_pct ?? 0), 0);
  const totalOut = outflows.reduce((s, f) => s + Math.abs(f.change_pct ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span>
          <span className="text-zinc-300">Thickness</span> ≈ |change %|
        </span>
        <span>
          <span className="text-amber-400">●</span> stronger move
        </span>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr_260px] gap-4 items-start">
        {/* LEFT — sector bars */}
        <div className="space-y-1.5">
          {sectors.map((s) => {
            const pct = s.change_pct ?? 0;
            const w = Math.max(8, intensity(pct) * 100);
            const positive = pct >= 0;
            return (
              <div key={s.sector} className="flex items-center gap-2 text-sm">
                <div className="w-24 text-right text-zinc-400 truncate">
                  {s.sector}
                </div>
                <div className="flex-1 h-5 bg-zinc-900 rounded overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded ${
                      positive ? "bg-emerald-500/80" : "bg-rose-500/80"
                    }`}
                  />
                </div>
                <div
                  className={`w-14 text-right tabular-nums text-xs ${
                    positive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {pct >= 0 ? "+" : ""}
                  {pct.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* CENTER — bundling flow (SVG) */}
        <div className="relative min-h-[420px] rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
          <SectorBundleSVG
            sectors={sectors}
            inCount={Math.min(inflows.length, 8)}
            outCount={Math.min(outflows.length, 8)}
          />
          {/* center spine */}
          <div className="absolute left-1/2 top-8 bottom-8 -translate-x-1/2 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 via-zinc-600 to-rose-500 opacity-80" />
        </div>

        {/* RIGHT — inflow / outflow lists */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                Inflow
              </span>
              <span className="ml-auto text-emerald-400 font-semibold tabular-nums text-sm">
                +{totalIn.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1.5">
              {inflows.slice(0, 8).map((s) => (
                <div
                  key={s.sector}
                  className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {s.sector}
                  </span>
                  <span className="text-emerald-400 tabular-nums">
                    +{(s.change_pct ?? 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                Outflow
              </span>
              <span className="ml-auto text-rose-400 font-semibold tabular-nums text-sm">
                −{totalOut.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1.5">
              {outflows.slice(0, 8).map((s) => (
                <div
                  key={s.sector}
                  className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    {s.sector}
                  </span>
                  <span className="text-rose-400 tabular-nums">
                    {(s.change_pct ?? 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectorBundleSVG({
  sectors,
  inCount,
  outCount,
}: {
  sectors: { sector: string; change_pct?: number | null; direction: string }[];
  inCount: number;
  outCount: number;
}) {
  const h = 420;
  const w = 400;
  const midX = w / 2;

  const paths = useMemo(() => {
    const list: { d: string; positive: boolean; width: number; key: string }[] = [];
    sectors.forEach((s, i) => {
      const y = ((i + 0.5) / Math.max(sectors.length, 1)) * (h - 40) + 20;
      const positive = (s.change_pct ?? 0) >= 0;
      const targetY = positive
        ? ((Math.min(i, inCount - 1) + 0.5) / Math.max(inCount, 1)) * (h * 0.45) + 20
        : ((Math.min(i, outCount - 1) + 0.5) / Math.max(outCount, 1)) * (h * 0.45) +
          h * 0.52;
      const c1 = midX * 0.45;
      const c2 = midX * 0.75;
      const d = `M 0 ${y} C ${c1} ${y}, ${c2} ${targetY}, ${midX - 4} ${targetY}`;
      list.push({
        d,
        positive,
        width: 1 + intensity(s.change_pct ?? 0) * 4,
        key: s.sector,
      });
    });
    return list;
  }, [sectors, inCount, outCount]);

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <filter id="mf-glow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((p, idx) => (
        <g key={p.key}>
          <path
            d={p.d}
            fill="none"
            stroke={p.positive ? "#34d399" : "#fb7185"}
            strokeWidth={p.width}
            strokeOpacity={0.35}
            filter="url(#mf-glow)"
          />
          <motion.path
            d={p.d}
            fill="none"
            stroke={p.positive ? "#6ee7b7" : "#fda4af"}
            strokeWidth={p.width * 0.7}
            strokeLinecap="round"
            strokeDasharray="4 10"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -28 }}
            transition={{
              duration: 1.6 + (idx % 5) * 0.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </g>
      ))}
    </svg>
  );
}