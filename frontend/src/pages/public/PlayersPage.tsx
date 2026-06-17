import { useEffect, useState } from 'react';
import { getPlayerStats } from '../../api/players';
import type { PlayerStat } from '../../api/players';

type Scope = 'alltime' | 'current' | 'evening';

const TABS: { key: Scope; label: string }[] = [
  { key: 'alltime', label: 'All-time' },
  { key: 'current', label: 'Curent' },
  { key: 'evening', label: 'Seară' },
];

function UserAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function PlayersPage() {
  const [scope, setScope] = useState<Scope>('current');
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPlayerStats(scope)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [scope]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <h1 className="text-xl font-bold text-white mb-4">Statistici jucători</h1>

      <div className="flex bg-slate-800 rounded-lg p-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setScope(tab.key)}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              scope === tab.key
                ? 'bg-green-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : stats.length === 0 ? (
        <div className="text-slate-500 py-10 text-center">
          {scope === 'current'
            ? 'Niciun campionat activ sau niciun meci jucat.'
            : scope === 'evening'
            ? 'Nicio seară jucată.'
            : 'Nicio statistică disponibilă.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-3 py-3 text-left w-8">#</th>
                <th className="px-3 py-3 text-left">Jucător</th>
                <th className="px-2 py-3 text-center" title="Goluri">G</th>
                <th className="px-2 py-3 text-center" title="Asisturi">A</th>
                <th className="hidden sm:table-cell px-2 py-3 text-center" title="Meciuri câștigate">V</th>
                <th className="hidden sm:table-cell px-2 py-3 text-center" title="Meciuri jucate">MJ</th>
                <th className="px-2 py-3 text-center" title="Contribuții (goluri + asisturi)">G+A</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.player_id}
                  className="border-t border-slate-700"
                >
                  <td className="px-3 py-3 text-slate-500 font-mono">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      {s.player?.photo_url ? (
                        <img
                          src={s.player.photo_url}
                          alt={s.player.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-600 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <UserAvatarIcon />
                        </div>
                      )}
                      <span className="font-medium text-white leading-tight">{s.player?.name ?? s.player_id}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center font-semibold text-green-400">{s.goals}</td>
                  <td className="px-2 py-3 text-center text-blue-400">{s.assists}</td>
                  <td className="hidden sm:table-cell px-2 py-3 text-center text-yellow-400">{s.wins}</td>
                  <td className="hidden sm:table-cell px-2 py-3 text-center text-slate-400">{s.matches_played}</td>
                  <td className="px-2 py-3 text-center font-semibold text-slate-200">
                    {s.goals + s.assists}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-3">
        G=Goluri · A=Asisturi · V=Victorii · MJ=Meciuri jucate · G+A=Contribuții
      </p>
    </div>
  );
}
