import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import UnlockPage from './pages/UnlockPage';
import HomePage from './pages/HomePage';
import PlayersPage from './pages/PlayersPage';
import DecksPage from './pages/DecksPage';
import NewGamePage from './pages/NewGamePage';
import GamePage from './pages/GamePage';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { isUnlocked } from './lib/appCode';

function Guard({ children }: { children: React.ReactNode }) {
  if (!isUnlocked()) return <Navigate to="/unlock" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/unlock" element={<UnlockPage />} />

      <Route
        path="/"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="decks" element={<DecksPage />} />
        <Route path="new" element={<NewGamePage />} />
        <Route path="game/:gameId" element={<GamePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
