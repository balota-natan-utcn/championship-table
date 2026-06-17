import { useEffect, useState } from 'react';
import { getActiveChampionship } from '../../api/championships';
import { getTeams, updateTeam } from '../../api/teams';
import { getPlayers } from '../../api/players';
import type { Team, Player } from '../../types';
import toast from 'react-hot-toast';

export default function TeamsAdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function reload() {
    const active = await getActiveChampionship().catch(() => null);
    if (!active) { setLoading(false); return; }
    const [t, p] = await Promise.all([getTeams(active._id), getPlayers()]);
    setTeams(t);
    setAllPlayers(p);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  // Which players are assigned to any team
  const assignedIds = new Set(
    teams.flatMap((t) => (t.player_ids as Player[]).map((p) => p._id))
  );

  async function togglePlayer(team: Team, player: Player) {
    const currentIds = (team.player_ids as Player[]).map((p) => p._id);
    const already = currentIds.includes(player._id);
    const newIds = already
      ? currentIds.filter((id) => id !== player._id)
      : [...currentIds, player._id];

    setSaving(team._id);
    try {
      const updated = await updateTeam(team._id, { player_ids: newIds });
      setTeams((prev) => prev.map((t) => (t._id === team._id ? updated : t)));
    } catch {
      toast.error('Eroare la actualizarea echipei');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-64 text-slate-400">Se încarcă...</div>;
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500">
        Niciun campionat activ sau nicio echipă creată.
      </div>
    );
  }

  const unassignedPlayers = allPlayers.filter((p) => !assignedIds.has(p._id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestionare echipe</h1>
        {unassignedPlayers.length > 0 && (
          <span className="text-sm text-yellow-400">
            {unassignedPlayers.length} jucător{unassignedPlayers.length > 1 ? 'i' : ''} neasignat{unassignedPlayers.length > 1 ? 'i' : ''}
          </span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {teams.map((team) => {
          const teamPlayers = team.player_ids as Player[];
          const isSaving = saving === team._id;

          return (
            <div
              key={team._id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4"
            >
              {/* Team header */}
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <h2 className="font-semibold text-white text-lg">{team.name}</h2>
                <span className="text-xs text-slate-500 ml-auto">
                  {teamPlayers.length} jucători
                </span>
              </div>

              {/* Current players */}
              <div className="space-y-1.5">
                {teamPlayers.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Niciun jucător</p>
                )}
                {teamPlayers.map((player) => (
                  <div
                    key={player._id}
                    className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2"
                  >
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                        👤
                      </div>
                    )}
                    <span className="flex-1 text-sm text-white">{player.name}</span>
                    <button
                      onClick={() => togglePlayer(team, player)}
                      disabled={isSaving}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                    >
                      Scoate
                    </button>
                  </div>
                ))}
              </div>

              {/* Add players section */}
              {allPlayers.filter((p) => !(team.player_ids as Player[]).find((tp) => tp._id === p._id)).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Adaugă jucători:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allPlayers
                      .filter((p) => !(team.player_ids as Player[]).find((tp) => tp._id === p._id))
                      .map((player) => {
                        const isAssignedElsewhere = assignedIds.has(player._id);
                        return (
                          <button
                            key={player._id}
                            onClick={() => togglePlayer(team, player)}
                            disabled={isSaving}
                            className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                              isAssignedElsewhere
                                ? 'border-orange-700 text-orange-400 hover:bg-orange-900/20'
                                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                            }`}
                            title={isAssignedElsewhere ? 'Deja în altă echipă' : ''}
                          >
                            {isAssignedElsewhere && '⚠ '}{player.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {isSaving && (
                <p className="text-xs text-slate-500">Se salvează...</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Unassigned players summary */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4">
          <p className="text-sm text-yellow-400 font-medium mb-2">
            Jucători fără echipă:
          </p>
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((p) => (
              <span
                key={p._id}
                className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
