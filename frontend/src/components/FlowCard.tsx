import { motion } from "motion/react";
import type { SectorFlow } from "../types/market";

type Props = {
  sector: SectorFlow;
};

export default function FlowCard({ sector }: Props) {
  const isIn = sector.direction === "in";
  const isOut = sector.direction === "out";

  const directionColor = isIn
    ? "text-emerald-400"
    : isOut
      ? "text-rose-400"
      : "text-zinc-400";

  const flowLabel =
    sector.net_flow_cr != null
      ? `${sector.net_flow_cr >= 0 ? "+" : ""}${sector.net_flow_cr.toFixed(0)} Cr`
      : null;

  const pctLabel =
    sector.change_pct != null
      ? `${sector.change_pct >= 0 ? "+" : ""}${sector.change_pct.toFixed(1)}%`
      : null;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="
        relative overflow-hidden rounded-xl
        border border-zinc-800 bg-zinc-950
        px-4 py-4
      "
    >
      {/* subtle moving glow */}
      <motion.div
        animate={{ x: [-100, 280] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 h-full w-14 bg-cyan-500/10 blur-xl pointer-events-none"
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-white truncate">{sector.sector}</div>
          <div className={`text-xs mt-0.5 ${directionColor}`}>
            {isIn ? "Inflow" : isOut ? "Outflow" : "Neutral"}
            {flowLabel && <span className="ml-1.5 text-zinc-400">· {flowLabel}</span>}
          </div>
        </div>

        {pctLabel && (
          <div className={`text-sm font-semibold tabular-nums ${directionColor}`}>
            {pctLabel}
          </div>
        )}
      </div>
    </motion.div>
  );
}