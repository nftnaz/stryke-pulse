import { useMemo, useId } from "react";
import { motion } from "motion/react";
import type { SectorFlow } from "../types/market";

type Props = {
  inflows: SectorFlow[];
  outflows: SectorFlow[];
  neutral?: SectorFlow[];
};

function SectorChip({
  flow,
  side,
  id,
}: {
  flow: SectorFlow;
  side: "in" | "out";
  id: string;
}) {
  const positive = side === "in";
  return (
    <div
      id={id}
      className={`
        relative z-10 rounded-xl border px-4 py-3 min-w-[150px]
        backdrop-blur-sm
        ${positive
          ? "border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          : "border-rose-500/50 bg-rose-950/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]"}
      `}
    >
      <div className="font-medium text-white text-sm">{flow.sector}</div>
      <div
        className={`text-sm mt-0.5 tabular-nums font-semibold ${
          positive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {flow.change_pct != null
          ? `${flow.change_pct >= 0 ? "+" : ""}${flow.change_pct.toFixed(2)}%`
          : "—"}
      </div>
    </div>
  );
}

/** One animated particle riding a path */
function PathParticle({
  pathId,
  delay,
  duration,
  color,
}: {
  pathId: string;
  delay: number;
  duration: number;
  color: string;
}) {
  return (
    <motion.circle
      r="3.5"
      fill={color}
      filter="url(#glow)"
      initial={{ offsetDistance: "0%" }}
      animate={{ offsetDistance: "100%" }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        offsetPath: `url(#${pathId})`,
        offsetRotate: "0deg",
      }}
    />
  );
}

/**
 * Builds smooth cubic curves from left column (outflows)
 * to right column (inflows).
 */
function FlowPaths({
  outCount,
  inCount,
  width,
  height,
  leftX,
  rightX,
}: {
  outCount: number;
  inCount: number;
  width: number;
  height: number;
  leftX: number;
  rightX: number;
}) {
  const uid = useId().replace(/:/g, "");

  const paths = useMemo(() => {
    if (outCount === 0 || inCount === 0) return [];

    const result: { d: string; id: string }[] = [];
    const maxLinks = Math.min(outCount * inCount, 12); // cap for performance

    let link = 0;
    for (let i = 0; i < outCount && link < maxLinks; i++) {
      const y1 = ((i + 0.5) / outCount) * height;
      // connect each outflow to up to 2 strongest inflows (top of list)
      const targets = Math.min(2, inCount);
      for (let j = 0; j < targets && link < maxLinks; j++) {
        const y2 = ((j + 0.5) / inCount) * height;
        const midX = (leftX + rightX) / 2;
        // cubic bezier: control points pull toward center for a nice arc
        const d = `M ${leftX} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${rightX} ${y2}`;
        result.push({ d, id: `${uid}-p${link}` });
        link++;
      }
    }
    return result;
  }, [outCount, inCount, height, leftX, rightX, uid]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${uid}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(244,63,94)" stopOpacity="0.7" />
          <stop offset="50%" stopColor="rgb(34,211,238)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {paths.map((p, idx) => (
        <g key={p.id}>
          {/* static soft path */}
          <path
            d={p.d}
            fill="none"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
          {/* dashed animated overlay */}
          <motion.path
            d={p.d}
            fill="none"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 14"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -40 }}
            transition={{
              duration: 1.8 + idx * 0.15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* particles */}
          <PathParticle
            pathId={p.id}
            delay={idx * 0.4}
            duration={2.4 + (idx % 3) * 0.3}
            color={idx % 2 === 0 ? "#22d3ee" : "#34d399"}
          />
          {/* hidden path element for offset-path reference */}
          <path id={p.id} d={p.d} fill="none" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

export default function FlowBoard({ inflows, outflows }: Props) {
  // limit columns so layout stays readable
  const outs = outflows.slice(0, 6);
  const ins = inflows.slice(0, 8);

  const rowHeight = 64;
  const padY = 16;
  const boardHeight = Math.max(
    outs.length * rowHeight,
    ins.length * rowHeight,
    180
  ) + padY * 2;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Money Rotation</h2>
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          Live Flow
        </div>
      </div>

      <div
        className="relative grid grid-cols-[auto_1fr_auto] gap-2 items-start"
        style={{ minHeight: boardHeight }}
      >
        {/* LEFT — Outflows */}
        <div className="flex flex-col gap-3 z-10 pt-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-rose-400/70 mb-1 px-1">
            Outflows
          </div>
          {outs.length === 0 ? (
            <p className="text-zinc-600 text-sm px-1">None</p>
          ) : (
            outs.map((f, i) => (
              <SectorChip
                key={f.sector}
                flow={f}
                side="out"
                id={`out-${i}`}
              />
            ))
          )}
        </div>

        {/* CENTER — SVG paths */}
        <div className="relative w-full h-full min-h-[160px]">
          {(outs.length > 0 && ins.length > 0) && (
            <FlowPaths
              outCount={outs.length}
              inCount={ins.length}
              width={400}
              height={boardHeight}
              leftX={8}
              rightX={392}
            />
          )}
          {/* fallback center label when no paths */}
          {(outs.length === 0 || ins.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-full max-w-[200px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            </div>
          )}
        </div>

        {/* RIGHT — Inflows */}
        <div className="flex flex-col gap-3 z-10 pt-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/70 mb-1 px-1 text-right">
            Inflows
          </div>
          {ins.length === 0 ? (
            <p className="text-zinc-600 text-sm px-1 text-right">None</p>
          ) : (
            ins.map((f, i) => (
              <SectorChip
                key={f.sector}
                flow={f}
                side="in"
                id={`in-${i}`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}