import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import HomePage from './pages/public/HomePage';
import ChampionshipPage from './pages/public/ChampionshipPage';
import HistoryPage from './pages/public/HistoryPage';
import PlayersPage from './pages/public/PlayersPage';
import PlayerDetailPage from './pages/public/PlayerDetailPage';
import MatchDetailPage from './pages/public/MatchDetailPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import NewChampionshipPage from './pages/admin/NewChampionshipPage';
import AddMatchPage from './pages/admin/AddMatchPage';
import PlayersAdminPage from './pages/admin/PlayersAdminPage';
import TeamsAdminPage from './pages/admin/TeamsAdminPage';
import LiveMatchPage from './pages/admin/LiveMatchPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename="/championship-table">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
        }}
      />
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/championship/:id" element={<ChampionshipPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />

          {/* Admin */}
          <Route path="/admin" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={<RequireAuth><DashboardPage /></RequireAuth>}
          />
          <Route
            path="/admin/championship/new"
            element={<RequireAuth><NewChampionshipPage /></RequireAuth>}
          />
          <Route
            path="/admin/matches/add"
            element={<RequireAuth><AddMatchPage /></RequireAuth>}
          />
          <Route
            path="/admin/players"
            element={<RequireAuth><PlayersAdminPage /></RequireAuth>}
          />
          <Route
            path="/admin/teams"
            element={<RequireAuth><TeamsAdminPage /></RequireAuth>}
          />
          <Route
            path="/admin/match/live"
            element={<RequireAuth><LiveMatchPage /></RequireAuth>}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
