import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getActiveChampionship,
  getStandings,
  getEvenings,
  finishChampionship,
} from '../../api/championships';
import StandingsTable from '../../components/StandingsTable';
import MatchCard from '../../components/MatchCard';
import type { Championship, TeamStanding, Evening } from '../../types';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  async function reload() {
    try {
      const active = await getActiveChampionship().catch(() => null);
      setChampionship(active);
      if (active) {
        const [s, e] = await Promise.all([getStandings(active._id), getEvenings(active._id)]);
        setStandings(s);
        setEvenings(e);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function handleFinish() {
    if (!championship) return;
    if (!confirm('Ești sigur că vrei să termini campionatul?')) return;
    setFinishing(true);
    try {
      await finishChampionship(championship._id);
      toast.success('Campionat terminat!');
      await reload();
    } catch {
      toast.error('Eroare la terminarea campionatului');
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-400">Se încarcă...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link
            to="/admin/players"
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg px-4 py-2 transition-colors"
          >
            Jucători
          </Link>
          {championship && (
            <Link
              to="/admin/teams"
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg px-4 py-2 transition-colors"
            >
              Echipe
            </Link>
          )}
          {championship ? (
            <>
              <Link
                to="/admin/match/live"
                className="bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg px-4 py-2 transition-colors"
              >
                Timer meci
              </Link>
              <Link
                to="/admin/matches/add"
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg px-4 py-2 transition-colors"
              >
                + Meci manual
              </Link>
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded-lg px-4 py-2 transition-colors"
              >
                Termină campionatul
              </button>
            </>
          ) : (
            <Link
              to="/admin/championship/new"
              className="bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg px-4 py-2 transition-colors"
            >
              + Campionat nou
            </Link>
          )}
        </div>
      </div>

      {!championship ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-4">Niciun campionat activ</p>
          <Link
            to="/admin/championship/new"
            className="text-green-400 hover:text-green-300 underline"
          >
            Creează unul nou
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-4">
            <h2 className="text-lg font-semibold text-white">{championship.name}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Din{' '}
              {new Date(championship.startDate).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">Clasament curent</h2>
            <StandingsTable standings={standings} />
          </section>

          {evenings.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">
                Ultima seară —{' '}
                {new Date(evenings[evenings.length - 1]!.date).toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h2>
              <div className="space-y-2">
                {evenings[evenings.length - 1]!.matches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
