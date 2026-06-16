import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveChampionship, getStandings, getEvenings, getChampionships } from '../../api/championships';
import StandingsTable from '../../components/StandingsTable';
import MatchCard from '../../components/MatchCard';
import type { Championship, TeamStanding, Evening } from '../../types';

export default function HomePage() {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [prevChampion, setPrevChampion] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [active, all] = await Promise.all([
          getActiveChampionship().catch(() => null),
          getChampionships(),
        ]);

        setChampionship(active);

        const finished = all.filter((c) => c.status === 'finished');
        if (finished.length > 0) setPrevChampion(finished[0]!);

        if (active) {
          const [s, e] = await Promise.all([getStandings(active._id), getEvenings(active._id)]);
          setStandings(s);
          setEvenings(e);
        }
      } catch {
        setError('Eroare la încărcarea datelor');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const lastEvening = evenings[evenings.length - 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-400">
        Se încarcă...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Previous champion banner */}
      {prevChampion && (
        <Link
          to={`/championship/${prevChampion._id}`}
          className="block bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border border-yellow-700/50 rounded-lg px-5 py-3 hover:border-yellow-600/70 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-400 uppercase tracking-wider mb-0.5">Campion anterior</p>
              <p className="text-white font-semibold">{prevChampion.name}</p>
            </div>
            <span className="text-yellow-400 text-2xl">🏆</span>
          </div>
        </Link>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      {!championship ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-lg">Niciun campionat activ momentan</p>
        </div>
      ) : (
        <>
          {/* Championship header */}
          <div>
            <h1 className="text-2xl font-bold text-white">{championship.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Din{' '}
              {new Date(championship.startDate).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Standings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-3">Clasament</h2>
            <StandingsTable standings={standings} />
            <p className="text-xs text-slate-600 mt-2">
              MJ=Meciuri jucate · V=Victorii · Î=Înfrângeri · SC=Seri câștigate · GM=Goluri marcate · Pct=Puncte
            </p>
          </section>

          {/* Last evening */}
          {lastEvening && (
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">
                Ultima seară —{' '}
                {new Date(lastEvening.date).toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h2>
              <div className="space-y-2">
                {lastEvening.matches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* All evenings link */}
          {evenings.length > 1 && (
            <Link
              to={`/championship/${championship._id}`}
              className="block text-center text-sm text-slate-400 hover:text-green-400 transition-colors py-2"
            >
              Vezi toate serile →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
