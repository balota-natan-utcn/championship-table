import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveChampionship } from '../../api/championships';
import { getTeams } from '../../api/teams';
import { createMatch } from '../../api/matches';
import type { Team, Player } from '../../types';
import toast from 'react-hot-toast';

interface GoalEntry {
  scorer_id: string;
  team_id: string;
  assist_id: string;
  is_penalty_decider: boolean;
}

export default function AddMatchPage() {
  const navigate = useNavigate();
  const [championshipId, setChampionshipId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [eveningDate, setEveningDate] = useState(new Date().toISOString().slice(0, 10));
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [penaltyWinnerId, setPenaltyWinnerId] = useState('');
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActiveChampionship().then((c) => {
      setChampionshipId(c._id);
      return getTeams(c._id);
    }).then(setTeams);
  }, []);

  const isPenaltyNeeded = score1 === score2;

  const allPlayers: Player[] = teams.flatMap((t) =>
    (t.player_ids as Player[]).map((p) => ({ ...p, teamId: t._id } as Player & { teamId: string }))
  );

  const playersForTeam = (teamId: string) =>
    teams.find((t) => t._id === teamId)?.player_ids as Player[] ?? [];

  function addGoal(isPenaltyDecider = false) {
    setGoals((prev) => [
      ...prev,
      { scorer_id: '', team_id: '', assist_id: '', is_penalty_decider: isPenaltyDecider },
    ]);
  }

  function updateGoal(i: number, patch: Partial<GoalEntry>) {
    setGoals((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }

  function removeGoal(i: number) {
    setGoals((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!team1Id || !team2Id || team1Id === team2Id) {
      toast.error('Selectează două echipe diferite');
      return;
    }
    if (isPenaltyNeeded && !penaltyWinnerId) {
      toast.error('Scoruri egale — selectează câștigătorul la penalty');
      return;
    }

    setSaving(true);
    try {
      await createMatch({
        championship_id: championshipId,
        evening_date: eveningDate,
        team1_id: team1Id,
        team2_id: team2Id,
        score1,
        score2,
        penalty_winner_id: isPenaltyNeeded ? penaltyWinnerId : undefined,
        goals: goals
          .filter((g) => g.scorer_id && g.team_id)
          .map((g) => ({
            scorer_id: g.scorer_id,
            team_id: g.team_id,
            assist_id: g.assist_id || undefined,
            is_penalty_decider: g.is_penalty_decider,
          })),
      });
      toast.success('Meci adăugat!');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Eroare la salvarea meciului');
    } finally {
      setSaving(false);
    }
  }

  const regularGoals = goals.filter((g) => !g.is_penalty_decider);
  const penaltyGoal = goals.find((g) => g.is_penalty_decider);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Adaugă meci</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <label className="block text-sm text-slate-400 mb-1">Data serii</label>
          <input
            type="date"
            value={eveningDate}
            onChange={(e) => setEveningDate(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
            required
          />
        </div>

        {/* Teams & Score */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-200">Echipe și scor</h2>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Team 1 */}
            <select
              value={team1Id}
              onChange={(e) => setTeam1Id(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
              required
            >
              <option value="">Echipa 1</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id} disabled={t._id === team2Id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Score */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={score1}
                onChange={(e) => setScore1(Number(e.target.value))}
                className="w-14 bg-slate-700 border border-slate-600 text-white text-center rounded-lg px-2 py-2.5 focus:outline-none focus:border-green-500 text-lg font-bold"
              />
              <span className="text-slate-500 font-bold">-</span>
              <input
                type="number"
                min={0}
                value={score2}
                onChange={(e) => setScore2(Number(e.target.value))}
                className="w-14 bg-slate-700 border border-slate-600 text-white text-center rounded-lg px-2 py-2.5 focus:outline-none focus:border-green-500 text-lg font-bold"
              />
            </div>

            {/* Team 2 */}
            <select
              value={team2Id}
              onChange={(e) => setTeam2Id(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
              required
            >
              <option value="">Echipa 2</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id} disabled={t._id === team1Id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Penalty winner */}
          {isPenaltyNeeded && team1Id && team2Id && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
              <p className="text-yellow-400 text-sm mb-2">Scoruri egale — câștigător penalty:</p>
              <div className="flex gap-3">
                {[team1Id, team2Id].map((tid) => {
                  const team = teams.find((t) => t._id === tid);
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => setPenaltyWinnerId(tid)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        penaltyWinnerId === tid
                          ? 'border-yellow-500 text-yellow-300 bg-yellow-900/30'
                          : 'border-slate-600 text-slate-400 hover:text-white'
                      }`}
                    >
                      {team?.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-200">
              Goluri ({regularGoals.length})
            </h2>
            <button
              type="button"
              onClick={() => addGoal(false)}
              disabled={!team1Id || !team2Id}
              className="text-sm text-green-400 hover:text-green-300 disabled:opacity-40"
            >
              + Adaugă gol
            </button>
          </div>

          {regularGoals.map((goal, idx) => {
            const realIdx = goals.indexOf(goal);
            return (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={goal.team_id}
                  onChange={(e) => updateGoal(realIdx, { team_id: e.target.value, scorer_id: '' })}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">Echipă</option>
                  {[team1Id, team2Id].filter(Boolean).map((tid) => {
                    const team = teams.find((t) => t._id === tid);
                    return (
                      <option key={tid} value={tid}>
                        {team?.name}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={goal.scorer_id}
                  onChange={(e) => updateGoal(realIdx, { scorer_id: e.target.value })}
                  disabled={!goal.team_id}
                  className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 disabled:opacity-50"
                >
                  <option value="">Marcator</option>
                  {playersForTeam(goal.team_id).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={goal.assist_id}
                  onChange={(e) => updateGoal(realIdx, { assist_id: e.target.value })}
                  disabled={!goal.team_id}
                  className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 disabled:opacity-50"
                >
                  <option value="">Assist (opțional)</option>
                  {playersForTeam(goal.team_id)
                    .filter((p) => p._id !== goal.scorer_id)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeGoal(realIdx)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Penalty decider goal */}
          {isPenaltyNeeded && penaltyWinnerId && (
            <div className="border-t border-slate-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-yellow-400">Gol penalty decisiv (opțional)</p>
                {!penaltyGoal && (
                  <button
                    type="button"
                    onClick={() => addGoal(true)}
                    className="text-xs text-yellow-400 hover:text-yellow-300"
                  >
                    + Adaugă
                  </button>
                )}
              </div>
              {penaltyGoal && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-slate-500 w-20">
                    {teams.find((t) => t._id === penaltyWinnerId)?.name}
                  </span>
                  <select
                    value={penaltyGoal.scorer_id}
                    onChange={(e) => updateGoal(goals.indexOf(penaltyGoal), { scorer_id: e.target.value, team_id: penaltyWinnerId })}
                    className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">Executant penalty</option>
                    {playersForTeam(penaltyWinnerId).map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeGoal(goals.indexOf(penaltyGoal))}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {allPlayers.length === 0 && (
            <p className="text-xs text-slate-500">
              Adaugă jucători la echipe pentru a putea înregistra goluri.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 transition-colors"
        >
          {saving ? 'Se salvează...' : 'Salvează meciul'}
        </button>
      </form>
    </div>
  );
}
