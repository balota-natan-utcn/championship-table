import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchById } from '../../api/matches';
import type { Match, Player } from '../../types';

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function playerName(p: Player | string | undefined): string {
  if (!p) return '?';
  if (typeof p === 'object') return p.name;
  return '?';
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getMatchById(id)
      .then(setMatch)
      .catch(() => setError('Meciul nu a fost găsit.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8 space-y-4">
        <div className="h-5 w-20 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-40 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white mb-6 block">
          ← Înapoi
        </button>
        <p className="text-slate-500 text-center py-16">{error || 'Meciul nu a fost găsit.'}</p>
      </div>
    );
  }

  const t1 = match.team1_id;
  const t2 = match.team2_id;
  const winnerId = typeof match.winner_id === 'object' ? match.winner_id._id : match.winner_id;
  const isPenalty = !!match.penalty_winner_id;

  const regularGoals = match.goals.filter((g) => !g.is_penalty_decider);
  const penaltyGoal = match.goals.find((g) => g.is_penalty_decider);

  const sortedGoals = [...regularGoals].sort((a, b) => {
    if (a.minute != null && b.minute != null) return a.minute - b.minute;
    if (a.minute != null) return -1;
    if (b.minute != null) return 1;
    return 0;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8 space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Înapoi
      </button>

      {/* Score card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        {/* Date + end time */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {new Date(match.evening_date).toLocaleDateString('ro-RO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {match.end_time_seconds != null && (
            <span className="text-xs text-slate-500 font-mono">
              ⏱ {fmtTime(match.end_time_seconds)}
            </span>
          )}
        </div>

        {/* Teams + Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <span className={`font-semibold text-base truncate ${winnerId === t1._id ? 'text-white' : 'text-slate-400'}`}>
              {t1.name}
            </span>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t1.color }} />
          </div>

          <div className="text-center flex-shrink-0">
            <div className="flex items-center gap-1.5 font-mono font-black text-4xl">
              <span className={winnerId === t1._id ? 'text-white' : 'text-slate-500'}>{match.score1}</span>
              <span className="text-slate-700">–</span>
              <span className={winnerId === t2._id ? 'text-white' : 'text-slate-500'}>{match.score2}</span>
            </div>
            {isPenalty && (
              <span className="text-[11px] text-yellow-400 mt-0.5 block">după penalty</span>
            )}
          </div>

          <div className="flex items-center justify-start gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t2.color }} />
            <span className={`font-semibold text-base truncate ${winnerId === t2._id ? 'text-white' : 'text-slate-400'}`}>
              {t2.name}
            </span>
          </div>
        </div>
      </div>

      {/* Goals */}
      {sortedGoals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-1">Goluri</p>
          {sortedGoals.map((goal, i) => {
            const isTeam1Goal = goal.team_id === t1._id;
            const teamColor = isTeam1Goal ? t1.color : t2.color;
            const scorer = playerName(goal.scorer_id as Player | string);
            const assister = goal.assist_id ? playerName(goal.assist_id as Player | string) : null;

            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />

                {goal.minute != null ? (
                  <span className="text-slate-500 text-xs font-mono w-8 flex-shrink-0">{goal.minute}'</span>
                ) : (
                  <span className="w-8 flex-shrink-0" />
                )}

                <span className="text-white font-medium text-sm flex-1 truncate">{scorer}</span>

                {goal.is_own_goal && (
                  <span className="text-xs text-orange-400 font-bold flex-shrink-0">AG</span>
                )}

                {assister && !goal.is_own_goal && (
                  <span className="text-slate-500 text-xs truncate max-w-[90px]">+{assister}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Penalty decider goal */}
      {penaltyGoal && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-1">Penalty decisiv</p>
          <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-3">
            <span className="text-yellow-400 text-sm font-medium flex-1">
              {playerName(penaltyGoal.scorer_id as Player | string)}
            </span>
            <span className="text-xs text-yellow-600">executant</span>
          </div>
        </div>
      )}

      {sortedGoals.length === 0 && !penaltyGoal && (
        <p className="text-slate-600 text-sm text-center py-6">Niciun gol înregistrat.</p>
      )}
    </div>
  );
}
