import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChampionship, getStandings, getEvenings, getScorers } from '../../api/championships';
import { getPlayers } from '../../api/players';
import StandingsTable from '../../components/StandingsTable';
import MatchCard from '../../components/MatchCard';
import type { Championship, TeamStanding, Evening, TopScorer, Player } from '../../types';

export default function ChampionshipPage() {
  const { id } = useParams<{ id: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [scorers, setScorers] = useState<TopScorer[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getChampionship(id),
      getStandings(id),
      getEvenings(id),
      getScorers(id),
      getPlayers(),
    ]).then(([c, s, e, sc, p]) => {
      setChampionship(c);
      setStandings(s);
      setEvenings(e);
      setScorers(sc);
      setPlayers(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-400">Se încarcă...</div>
    );
  }

  if (!championship) {
    return (
      <div className="text-center py-16 text-slate-500">
        Campionatul nu a fost găsit.{' '}
        <Link to="/" className="text-green-400">
          Înapoi
        </Link>
      </div>
    );
  }

  const getPlayerName = (id: string) => players.find((p) => p._id === id)?.name ?? id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div>
        <Link to="/history" className="text-sm text-slate-500 hover:text-slate-300">
          ← Istoric
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">{championship.name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-slate-400 text-sm">
            {new Date(championship.startDate).toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {championship.endDate && (
              <>
                {' '}—{' '}
                {new Date(championship.endDate).toLocaleDateString('ro-RO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </>
            )}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              championship.status === 'active'
                ? 'bg-green-800 text-green-200'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {championship.status === 'active' ? 'ACTIV' : 'TERMINAT'}
          </span>
        </div>
      </div>

      {/* Standings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Clasament final</h2>
        <StandingsTable standings={standings} />
      </section>

      {/* Top scorers */}
      {scorers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-3">Top marcatori</h2>
          <div className="space-y-2">
            {scorers.slice(0, 10).map((s, i) => (
              <div
                key={s.player_id}
                className="bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-4 border border-slate-700"
              >
                <span className="text-slate-500 font-mono w-5 text-sm">{i + 1}</span>
                <span className="flex-1 text-white font-medium">{getPlayerName(s.player_id)}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400 font-semibold">{s.goals} goluri</span>
                  <span className="text-blue-400">{s.assists} asisturi</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evenings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Meciuri pe seri</h2>
        <div className="space-y-6">
          {evenings.map((evening) => (
            <div key={evening.date}>
              <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">
                {new Date(evening.date).toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <div className="space-y-2">
                {evening.matches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))}
              </div>
            </div>
          ))}
          {evenings.length === 0 && (
            <p className="text-slate-500 text-sm">Niciun meci înregistrat.</p>
          )}
        </div>
      </section>
    </div>
  );
}
