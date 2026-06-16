import { useEffect, useState } from 'react';
import { getPlayers } from '../../api/players';
import type { Player } from '../../types';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayers()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-400">Se încarcă...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Jucători</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {players.map((player) => (
          <div
            key={player._id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col items-center gap-3"
          >
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={player.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <span className="text-white font-medium text-sm text-center">{player.name}</span>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-slate-500 col-span-full">Niciun jucător înregistrat.</p>
        )}
      </div>
    </div>
  );
}
