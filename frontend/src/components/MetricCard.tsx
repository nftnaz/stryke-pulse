import { motion } from "motion/react";

type Props = {
  title: string;
  value: string | number | null | undefined;
  subtitle?: string;
  /** Optional class for the value (e.g. green/red for change) */
  valueClassName?: string;
  /** Optional class for the subtitle */
  subtitleClassName?: string;
};

export default function MetricCard({
  title,
  value,
  subtitle,
  valueClassName = "",
  subtitleClassName = "text-cyan-400",
}: Props) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.02 }}
      className="
        rounded-2xl border border-zinc-800 bg-zinc-900/50
        p-5 cursor-default transition-all
        hover:border-cyan-500/60
        hover:shadow-[0_0_28px_rgba(6,182,212,0.12)]
      "
    >
      <p className="text-zinc-500 text-sm font-medium tracking-wide">
        {title}
      </p>

      <motion.h2
        key={String(display)}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className={`text-3xl md:text-4xl font-bold mt-2.5 tabular-nums ${valueClassName}`}
      >
        {display}
      </motion.h2>

      {subtitle && (
        <p className={`mt-2.5 text-sm ${subtitleClassName}`}>{subtitle}</p>
      )}
    </motion.div>
  );
}