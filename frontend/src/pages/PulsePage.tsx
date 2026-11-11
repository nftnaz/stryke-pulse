import { useEffect, useState } from "react";

import MetricCard from "../components/MetricCard";
import FlowCard from "../components/FlowCard";

import { getPulse } from "../services/pulse";
import { getOptionsSummary } from "../services/options";

export default function PulsePage() {
  const [pulse, setPulse] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);

  useEffect(() => {
    loadData();

    const timer = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  async function loadData() {
    try {
      const pulseData = await getPulse();
      const optionsData =
        await getOptionsSummary();

      setPulse(pulseData);
      setOptions(optionsData);
    } catch (err) {
      console.error(err);
    }
  }

  if (!pulse || !options) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-zinc-400">
        Loading market data...
      </div>
    );
  }

  const nifty = pulse.indices?.find(
    (item: any) => item.symbol === "NIFTY"
  );

  const bankNifty = pulse.indices?.find(
    (item: any) =>
      item.symbol === "BANKNIFTY"
  );

  return (
    <div className="space-y-10">

      <section>

        <h1 className="text-6xl font-bold tracking-tight">
          Market Pulse
        </h1>

        <p className="text-zinc-400 mt-3">
          Real-time market intelligence,
          money flow and options analytics.
        </p>

      </section>

      <section className="grid lg:grid-cols-4 gap-4">

        <MetricCard
          title="Market Mood"
          value={pulse.mood.score}
          subtitle={pulse.mood.label}
        />

        <MetricCard
          title="NIFTY"
          value={nifty?.ltp?.toFixed(2)}
          subtitle={`▲ ${nifty?.change?.toFixed(
            2
          )} pts`}
        />

        <MetricCard
          title="BANKNIFTY"
          value={bankNifty?.ltp?.toFixed(2)}
          subtitle={`▲ ${bankNifty?.change?.toFixed(
            2
          )} pts`}
        />

        <MetricCard
          title="INDIA VIX"
          value={pulse.india_vix}
          subtitle="Live Market"
        />

      </section>

      <section className="rounded-2xl border border-zinc-800 p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold">
            Money Rotation
          </h2>

          <div className="text-cyan-400 text-sm">
            Live Flow
          </div>

        </div>

        <div className="grid md:grid-cols-3 gap-4">

          <FlowCard
            from="IT"
            to="Banking"
          />

          <FlowCard
            from="Auto"
            to="Pharma"
          />

          <FlowCard
            from="PSU"
            to="Capital Goods"
          />

        </div>

      </section>

      <section className="rounded-2xl border border-zinc-800 p-6">

        <h2 className="text-2xl font-bold mb-6">
          Options Intelligence
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <MetricCard
            title="PCR"
            value={options.pcr?.toFixed(2)}
          />

          <MetricCard
            title="Support"
            value={options.support}
          />

          <MetricCard
            title="Resistance"
            value={options.resistance}
          />

          <MetricCard
            title="Max Pain"
            value={options.max_pain}
          />

        </div>

      </section>

      <section className="rounded-2xl border border-zinc-800 p-6">

        <h2 className="text-2xl font-bold mb-6">
          Market Insights
        </h2>

        <div className="space-y-3">

          {options.insights?.map(
            (
              insight: string,
              index: number
            ) => (
              <div
                key={index}
                className="
                  rounded-xl
                  border
                  border-zinc-800
                  bg-zinc-900/30
                  p-4
                  text-zinc-300
                  hover:border-cyan-500
                  transition-all
                "
              >
                {insight}
              </div>
            )
          )}

        </div>

      </section>

    </div>
  );
}