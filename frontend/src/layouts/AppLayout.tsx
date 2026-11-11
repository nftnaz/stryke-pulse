import { NavLink } from "react-router-dom";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">

      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur">

        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">

          <div className="font-bold text-xl">
            Stryke Pulse
          </div>

          <nav className="flex gap-6 text-sm">

            <NavLink to="/">
              Pulse
            </NavLink>

            <NavLink to="/news">
              News
            </NavLink>

            <NavLink to="/options">
              Options
            </NavLink>

            <NavLink to="/heatmaps">
              Heatmaps
            </NavLink>

            <NavLink to="/radar">
              Radar
            </NavLink>

            <NavLink to="/journal">
              Journal
            </NavLink>

          </nav>

        </div>

      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

    </div>
  );
}