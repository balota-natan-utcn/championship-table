import type { Match } from '../types';

interface Props {
  match: Match;
  showDate?: boolean;
}

export default function MatchCard({ match, showDate }: Props) {
  const isPenalty = !!match.penalty_winner_id;
  const t1 = match.team1_id;
  const t2 = match.team2_id;
  const winnerId = match.winner_id?._id ?? match.winner_id;

  return (
    <div className="bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-3 border border-slate-700">
      {showDate && (
        <span className="text-xs text-slate-500 w-20 flex-shrink-0">
          {new Date(match.evening_date).toLocaleDateString('ro-RO', {
            day: '2-digit',
            month: '2-digit',
          })}
        </span>
      )}

      {/* Team 1 */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span
          className={`font-medium text-sm ${
            winnerId === t1._id ? 'text-white' : 'text-slate-400'
          }`}
        >
          {t1.name}
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: t1.color }}
        />
      </div>

      {/* Score */}
      <div className="flex items-center gap-1 font-mono font-bold text-lg min-w-[80px] justify-center">
        <span className={winnerId === t1._id ? 'text-white' : 'text-slate-500'}>
          {match.score1}
        </span>
        <span className="text-slate-600 mx-1">-</span>
        <span className={winnerId === t2._id ? 'text-white' : 'text-slate-500'}>
          {match.score2}
        </span>
        {isPenalty && (
          <span className="text-xs text-yellow-400 ml-1" title="Decis la penalty">P</span>
        )}
      </div>

      {/* Team 2 */}
      <div className="flex items-center gap-2 flex-1">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: t2.color }}
        />
        <span
          className={`font-medium text-sm ${
            winnerId === t2._id ? 'text-white' : 'text-slate-400'
          }`}
        >
          {t2.name}
        </span>
      </div>
    </div>
  );
}
