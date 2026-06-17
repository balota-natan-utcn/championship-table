import type { TeamStanding } from '../types';

interface Props {
  standings: TeamStanding[];
}

export default function StandingsTable({ standings }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
            <th className="px-3 py-3 text-left w-8">#</th>
            <th className="px-3 py-3 text-left">Echipă</th>
            <th className="hidden sm:table-cell px-3 py-3 text-center" title="Meciuri jucate">MJ</th>
            <th className="px-3 py-3 text-center" title="Victorii">V</th>
            <th className="hidden sm:table-cell px-3 py-3 text-center" title="Înfrângeri">Î</th>
            <th className="hidden sm:table-cell px-3 py-3 text-center" title="Seri câștigate">SC</th>
            <th className="hidden sm:table-cell px-3 py-3 text-center" title="Goluri marcate">GM</th>
            <th className="px-3 py-3 text-center font-bold text-white" title="Puncte">Pct</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.team_id}
              className={`border-t border-slate-700 transition-colors ${
                i === 0 ? 'bg-green-950/30' : ''
              }`}
            >
              <td className="px-3 py-3 text-slate-500 font-mono">{i + 1}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: row.team?.color ?? '#3B82F6' }}
                  />
                  <span className="font-medium text-white">{row.team?.name ?? row.team_id}</span>
                  {i === 0 && (
                    <span className="hidden xs:inline text-xs bg-green-700 text-green-100 px-1.5 py-0.5 rounded">
                      LIDER
                    </span>
                  )}
                </div>
              </td>
              <td className="hidden sm:table-cell px-3 py-3 text-center text-slate-300">{row.matches_played}</td>
              <td className="px-3 py-3 text-center text-green-400 font-semibold">{row.wins}</td>
              <td className="hidden sm:table-cell px-3 py-3 text-center text-red-400">{row.losses}</td>
              <td className="hidden sm:table-cell px-3 py-3 text-center text-blue-400">{row.evenings_won}</td>
              <td className="hidden sm:table-cell px-3 py-3 text-center text-slate-300">{row.goals_for}</td>
              <td className="px-3 py-3 text-center font-bold text-white text-base">{row.points}</td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                Niciun meci jucat încă
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
