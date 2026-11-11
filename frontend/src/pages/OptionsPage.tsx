import { useEffect, useState } from "react";

import {
  getOptionsSummary,
  getOptionsChain,
} from "../services/options";

export default function OptionsPage() {

  const [summary, setSummary] =
    useState<any>(null);

  const [chain, setChain] =
    useState<any>(null);

  useEffect(() => {

    getOptionsSummary()
      .then(setSummary)
      .catch(console.error);

    getOptionsChain()
      .then(setChain)
      .catch(console.error);

  }, []);

  return (

    <div className="space-y-6">

      <h1 className="text-4xl font-bold">
        Options Intelligence
      </h1>

      {summary && (

        <div className="grid md:grid-cols-4 gap-4">

          <MetricCard
            title="PCR"
            value={summary.pcr}
          />

          <MetricCard
            title="Max Pain"
            value={summary.max_pain}
          />

          <MetricCard
            title="Support"
            value={summary.support}
          />

          <MetricCard
            title="Resistance"
            value={summary.resistance}
          />

        </div>

      )}

      {chain && (

        <div className="rounded-xl border border-zinc-800 p-4">

          <h2 className="text-xl font-semibold mb-4">
            Strike-wise OI
          </h2>

          <div className="overflow-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-zinc-700">

                  <th className="text-left p-2">
                    Strike
                  </th>

                  <th className="text-left p-2">
                    Call OI
                  </th>

                  <th className="text-left p-2">
                    Put OI
                  </th>

                  <th className="text-left p-2">
                    Call Chg OI
                  </th>

                  <th className="text-left p-2">
                    Put Chg OI
                  </th>

                </tr>

              </thead>

              <tbody>

                {chain.strikes?.map(
                  (row: any) => (

                    <tr
                      key={row.strike}
                      className="border-b border-zinc-900"
                    >

                      <td className="p-2">
                        {row.strike}
                      </td>

                      <td className="p-2">
                        {row.call_oi}
                      </td>

                      <td className="p-2">
                        {row.put_oi}
                      </td>

                      <td className="p-2">
                        {row.call_change_oi}
                      </td>

                      <td className="p-2">
                        {row.put_change_oi}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>

  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: any;
}) {

  return (
    <div className="rounded-xl border border-zinc-800 p-6">

      <p className="text-zinc-400">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

    </div>
  );
}