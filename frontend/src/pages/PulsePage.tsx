// frontend/src/pages/PulsePage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import MetricCard from "../components/MetricCard";
import FlowBoard from "../components/FlowBoard";
import MoneyflowView from "../components/MoneyflowView";
import OrderflowView from "../components/OrderflowView";
import { getPulse } from "../services/pulse";
import { getOptionsSummary } from "../services/options";
import { getSectorFlow, type SectorFlowResponse } from "../services/analytics";
import type {
  PulseResponse,
  OptionsSummary,
  IndexSnapshot,
} from "../types/market";

type PulseTab = "overview" | "moneyflow" | "orderflow";

function formatPts(change?: number | null): string {
  if (change == null || Number.isNaN(change)) return "—";
  const arrow = change >= 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(change).toFixed(2)} pts`;
}

function changeColor(change?: number | null): string {
  if (change == null) return "text-zinc-400";
  return change >= 0 ? "text-emerald-400" : "text-rose-400";
}

function findIndex(indices: IndexSnapshot[], symbol: string) {
  return indices.find((i) => i.symbol.toUpperCase() === symbol.toUpperCase());
}

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

export default function PulsePage() {
  const [pulse, setPulse] = useState<PulseResponse | null>(null);
  const [options, setOptions] = useState<OptionsSummary | null>(null);
  const [flow, setFlow] = useState<SectorFlowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<PulseTab>("overview");

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [pulseData, optionsData, flowData] = await Promise.all([
        getPulse(),
        getOptionsSummary("NIFTY"),
        getSectorFlow(5),
      ]);
      setPulse(pulseData);
      setOptions(optionsData);
      setFlow(flowData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to load market data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30_000);
    return () => clearInterval(timer);
  }, [loadData]);

  const nifty = useMemo(
    () => (pulse ? findIndex(pulse.indices, "NIFTY") : undefined),
    [pulse]
  );
  const bankNifty = useMemo(
    () => (pulse ? findIndex(pulse.indices, "BANKNIFTY") : undefined),
    [pulse]
  );

  if (loading && !pulse) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-zinc-400">
        Loading market data…
      </div>
    );
  }

  if (error && !pulse) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
        <p className="text-rose-400">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!pulse || !options) return null;

  const marketStatusLabel =
    pulse.market_status === "open"
      ? "Live Market"
      : pulse.market_status === "closed"
        ? "Market Closed"
        : pulse.market_status;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Market Pulse
          </h1>
          <p className="text-zinc-400 mt-3 max-w-xl">
            Real-time market intelligence, money flow and options analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              pulse.market_status === "open"
                ? "border-emerald-500/40 text-emerald-400"
                : "border-zinc-700 text-zinc-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                pulse.market_status === "open"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            {marketStatusLabel}
          </span>
          {lastUpdated && (
            <span>Updated {formatTime(lastUpdated.toISOString())} IST</span>
          )}
        </div>
      </section>

      {/* Top metrics — always visible */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Market Mood"
          value={pulse.mood.score}
          subtitle={pulse.mood.label}
          subtitleClassName={
            pulse.mood.score >= 60
              ? "text-emerald-400"
              : pulse.mood.score <= 40
                ? "text-rose-400"
                : "text-cyan-400"
          }
        />
        <MetricCard
          title="NIFTY"
          value={nifty?.ltp != null ? nifty.ltp.toFixed(2) : "—"}
          subtitle={formatPts(nifty?.change)}
          subtitleClassName={changeColor(nifty?.change)}
        />
        <MetricCard
          title="BANKNIFTY"
          value={bankNifty?.ltp != null ? bankNifty.ltp.toFixed(2) : "—"}
          subtitle={formatPts(bankNifty?.change)}
          subtitleClassName={changeColor(bankNifty?.change)}
        />
        <MetricCard
          title="INDIA VIX"
          value={
            pulse.india_vix != null ? Number(pulse.india_vix).toFixed(2) : "—"
          }
          subtitle={marketStatusLabel}
        />
      </section>

      {/* Tabs: Overview · Moneyflow · Orderflow */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(
          [
            ["overview", "Overview"],
            ["moneyflow", "Moneyflow"],
            ["orderflow", "Orderflow"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`
              px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition
              ${
                tab === id
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---------- Overview ---------- */}
      {tab === "overview" && (
        <div className="space-y-10">
          {flow ? (
            <FlowBoard
              inflows={flow.inflows}
              outflows={flow.outflows}
              neutral={flow.neutral}
            />
          ) : (
            <p className="text-zinc-500 text-sm">
              No sector flow data available yet.
            </p>
          )}

          {/* Options Intelligence */}
          <section className="rounded-2xl border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-6">Options Intelligence</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="PCR"
                value={options.pcr != null ? options.pcr.toFixed(2) : "—"}
              />
              <MetricCard
                title="Support"
                value={
                  options.support != null
                    ? Math.round(options.support).toLocaleString("en-IN")
                    : "—"
                }
              />
              <MetricCard
                title="Resistance"
                value={
                  options.resistance != null
                    ? Math.round(options.resistance).toLocaleString("en-IN")
                    : "—"
                }
              />
              <MetricCard
                title="Max Pain"
                value={
                  options.max_pain != null
                    ? Math.round(options.max_pain).toLocaleString("en-IN")
                    : "—"
                }
              />
            </div>
          </section>

          {/* Market Insights */}
          <section className="rounded-2xl border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-6">Market Insights</h2>
            <div className="space-y-3">
              {(options.insights?.length
                ? options.insights
                : pulse.mood.notes?.length
                  ? pulse.mood.notes
                  : ["No insights available"]
              ).map((insight, index) => (
                <div
                  key={index}
                  className="
                    rounded-xl border border-zinc-800 bg-zinc-900/30
                    px-4 py-3.5 text-zinc-300
                    hover:border-cyan-500/50 transition-colors
                  "
                >
                  {insight}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ---------- Moneyflow ---------- */}
      {tab === "moneyflow" && (
        <div>
          {flow ? (
            <MoneyflowView flow={flow} />
          ) : (
            <p className="text-zinc-500 text-sm py-10 text-center">
              No sector flow data available yet. Run the historical backfill.
            </p>
          )}
        </div>
      )}

      {/* ---------- Orderflow ---------- */}
      {tab === "orderflow" && (
        <div>
          {flow ? (
            <OrderflowView flow={flow} />
          ) : (
            <p className="text-zinc-500 text-sm py-10 text-center">
              No sector flow data available yet. Run the historical backfill.
            </p>
          )}
        </div>
      )}
    </div>
  );
}