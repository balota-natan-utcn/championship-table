import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChampionship } from '../../api/championships';
import { createTeam } from '../../api/teams';
import { getPlayers } from '../../api/players';
import type { Player } from '../../types';
import toast from 'react-hot-toast';

interface TeamDraft {
  name: string;
  color: string;
  player_ids: string[];
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

export default function NewChampionshipPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [teams, setTeams] = useState<TeamDraft[]>([
    { name: '', color: COLORS[0]!, player_ids: [] },
    { name: '', color: COLORS[1]!, player_ids: [] },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  function addTeam() {
    setTeams((prev) => [
      ...prev,
      { name: '', color: COLORS[prev.length % COLORS.length]!, player_ids: [] },
    ]);
  }

  function removeTeam(i: number) {
    setTeams((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTeam(i: number, patch: Partial<TeamDraft>) {
    setTeams((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function togglePlayer(teamIdx: number, playerId: string) {
    const team = teams[teamIdx]!;
    const already = team.player_ids.includes(playerId);
    updateTeam(teamIdx, {
      player_ids: already
        ? team.player_ids.filter((id) => id !== playerId)
        : [...team.player_ids, playerId],
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || teams.some((t) => !t.name)) {
      toast.error('Completați numele campionatului și al echipelor');
      return;
    }
    setSaving(true);
    try {
      const championship = await createChampionship({ name, startDate });
      await Promise.all(
        teams.map((t) =>
          createTeam({
            championship_id: championship._id,
            name: t.name,
            color: t.color,
            player_ids: t.player_ids,
          })
        )
      );
      toast.success('Campionat creat!');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Eroare la crearea campionatului');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Campionat nou</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Championship info */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Detalii campionat</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nume campionat</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Săptămâna 1 - Iunie 2026"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data de start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
              required
            />
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Echipe ({teams.length})</h2>
            <button
              type="button"
              onClick={addTeam}
              className="text-sm text-green-400 hover:text-green-300"
            >
              + Adaugă echipă
            </button>
          </div>

          {teams.map((team, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-300">Echipa {i + 1}</h3>
                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeTeam(i)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Șterge
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => updateTeam(i, { name: e.target.value })}
                  placeholder="Numele echipei"
                  className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
                  required
                />
                <div className="flex gap-1.5 items-center">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateTeam(i, { color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        team.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {players.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    Jucători ({team.player_ids.length} selectați)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => togglePlayer(i, p._id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          team.player_ids.includes(p._id)
                            ? 'border-transparent text-white'
                            : 'border-slate-600 text-slate-400 hover:text-white'
                        }`}
                        style={
                          team.player_ids.includes(p._id)
                            ? { backgroundColor: team.color }
                            : {}
                        }
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 transition-colors"
        >
          {saving ? 'Se salvează...' : 'Creează campionatul'}
        </button>
      </form>
    </div>
  );
}
