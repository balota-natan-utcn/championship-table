import { useEffect, useState } from 'react';
import { getPlayerStats } from '../../api/players';
import type { PlayerStat } from '../../api/players';

type Scope = 'alltime' | 'current' | 'evening';

const TABS: { key: Scope; label: string }[] = [
  { key: 'alltime', label: 'All-time' },
  { key: 'current', label: 'Campionat curent' },
  { key: 'evening', label: 'Ultima seară' },
];

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Statistici jucători</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1 mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setScope(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
        <div className="text-slate-400 py-8">Se încarcă...</div>
      ) : stats.length === 0 ? (
        <div className="text-slate-500 py-8">
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
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Jucător</th>
                <th className="px-4 py-3 text-center" title="Goluri">G</th>
                <th className="px-4 py-3 text-center" title="Asisturi">A</th>
                <th className="px-4 py-3 text-center" title="Meciuri câștigate">V</th>
                <th className="px-4 py-3 text-center" title="Meciuri jucate">MJ</th>
                <th className="px-4 py-3 text-center" title="Contribuții (goluri + asisturi)">G+A</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.player_id}
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-500 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.player?.photo_url ? (
                        <img
                          src={s.player.photo_url}
                          alt={s.player.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-600"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                          👤
                        </div>
                      )}
                      <span className="font-medium text-white">{s.player?.name ?? s.player_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-green-400">{s.goals}</td>
                  <td className="px-4 py-3 text-center text-blue-400">{s.assists}</td>
                  <td className="px-4 py-3 text-center text-yellow-400">{s.wins}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{s.matches_played}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-200">
                    {s.goals + s.assists}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-3">
        G=Goluri · A=Asisturi · V=Meciuri câștigate · MJ=Meciuri jucate · G+A=Contribuții totale
      </p>
    </div>
  );
}
