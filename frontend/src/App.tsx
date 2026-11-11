import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import AppLayout from "./layouts/AppLayout";

import PulsePage from "./pages/PulsePage";
import OptionsPage from "./pages/OptionsPage";
import HeatmapsPage from "./pages/HeatmapsPage";

function Placeholder({
  title,
}: {
  title: string;
}) {
  return (
    <div>

      <h1 className="text-4xl font-bold">
        {title}
      </h1>

      <p className="text-zinc-400 mt-2">
        Coming soon
      </p>

    </div>
  );
}

export default function App() {

  return (

    <BrowserRouter>

      <AppLayout>

        <Routes>

          <Route
            path="/"
            element={<PulsePage />}
          />

          <Route
            path="/options"
            element={<OptionsPage />}
          />

          <Route
            path="/news"
            element={
              <Placeholder title="News" />
            }
          />

          <Route
            path="/heatmaps"
            element={<HeatmapsPage />}
          />

          <Route
            path="/radar"
            element={
              <Placeholder title="Radar" />
            }
          />

          <Route
            path="/journal"
            element={
              <Placeholder title="Journal" />
            }
          />

        </Routes>

      </AppLayout>

    </BrowserRouter>

  );
}