import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveChampionship } from '../../api/championships';
import { getTeams } from '../../api/teams';
import { createMatch } from '../../api/matches';
import type { Team, Player } from '../../types';
import toast from 'react-hot-toast';

type Phase = 'setup' | 'active' | 'paused' | 'extratime' | 'done';

interface GoalEntry {
  id: string;
  team_id: string;
  scorer_id: string;
  assist_id: string;
  elapsedAtGoal: number;
  is_penalty_decider: boolean;
}

function fmt(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
}

function goalMinute(secs: number) {
  return `${Math.floor(secs / 60) + 1}'`;
}

export default function LiveMatchPage() {
  const navigate = useNavigate();

  const [championshipId, setChampionshipId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup
  const [duration, setDuration] = useState(7);
  const [eveningDate, setEveningDate] = useState(new Date().toISOString().slice(0, 10));
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');

  // Timer
  const [phase, setPhase] = useState<Phase>('setup');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Goals
  const [goals, setGoals] = useState<GoalEntry[]>([]);

  // Goal panel
  const [panel, setPanel] = useState({ open: false, elapsedAtGoal: 0, teamId: '', scorerId: '', assistId: '' });

  // Penalty
  const [penaltyWinnerId, setPenaltyWinnerId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActiveChampionship()
      .then((c) => { setChampionshipId(c._id); return getTeams(c._id); })
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Timer tick
  useEffect(() => {
    if (phase === 'active' || phase === 'extratime') {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Normal time → extra time transition
  useEffect(() => {
    if (phase === 'active' && elapsed >= duration * 60) setPhase('extratime');
  }, [elapsed, phase, duration]);

  // Derived
  const score1 = goals.filter((g) => g.team_id === team1Id && !g.is_penalty_decider).length;
  const score2 = goals.filter((g) => g.team_id === team2Id && !g.is_penalty_decider).length;
  const team1 = teams.find((t) => t._id === team1Id);
  const team2 = teams.find((t) => t._id === team2Id);
  const isPenaltyNeeded = phase === 'done' && score1 === score2;
  const extraElapsed = Math.max(0, elapsed - duration * 60);

  function playersFor(teamId: string): Player[] {
    return (teams.find((t) => t._id === teamId)?.player_ids ?? []) as Player[];
  }

  function startMatch() {
    if (!team1Id || !team2Id || team1Id === team2Id) {
      toast.error('Selectează două echipe diferite');
      return;
    }
    setPhase('active');
    setElapsed(0);
    setGoals([]);
    setPenaltyWinnerId('');
  }

  function togglePause() {
    setPhase((prev) => {
      if (prev === 'paused') return elapsed >= duration * 60 ? 'extratime' : 'active';
      return 'paused';
    });
  }

  function stopMatch() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('done');
  }

  function openGoalPanel() {
    setPanel({ open: true, elapsedAtGoal: elapsed, teamId: '', scorerId: '', assistId: '' });
  }

  function submitGoal(e: FormEvent) {
    e.preventDefault();
    if (!panel.teamId || !panel.scorerId) { toast.error('Selectează echipa și marcatorul'); return; }
    setGoals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), team_id: panel.teamId, scorer_id: panel.scorerId, assist_id: panel.assistId, elapsedAtGoal: panel.elapsedAtGoal, is_penalty_decider: false },
    ]);
    setPanel({ open: false, elapsedAtGoal: 0, teamId: '', scorerId: '', assistId: '' });
  }

  async function handleSave() {
    if (isPenaltyNeeded && !penaltyWinnerId) { toast.error('Selectează câștigătorul la penalty'); return; }
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
        goals: goals.map((g) => ({ scorer_id: g.scorer_id, team_id: g.team_id, assist_id: g.assist_id || undefined, is_penalty_decider: false })),
      });
      toast.success('Meci salvat!');
      navigate('/admin/dashboard');
    } catch { toast.error('Eroare la salvare'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-64 text-slate-400">Se încarcă...</div>;

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Timer meci live</h1>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data serii</label>
            <input
              type="date"
              value={eveningDate}
              onChange={(e) => setEveningDate(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Durată meci (minute)</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setDuration((d) => Math.max(1, d - 1))} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xl font-bold transition-colors">−</button>
              <span className="text-3xl font-bold text-white w-12 text-center">{duration}</span>
              <button onClick={() => setDuration((d) => Math.min(20, d + 1))} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xl font-bold transition-colors">+</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Echipa 1</label>
              <select value={team1Id} onChange={(e) => setTeam1Id(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500">
                <option value="">Selectează</option>
                {teams.map((t) => <option key={t._id} value={t._id} disabled={t._id === team2Id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Echipa 2</label>
              <select value={team2Id} onChange={(e) => setTeam2Id(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500">
                <option value="">Selectează</option>
                {teams.map((t) => <option key={t._id} value={t._id} disabled={t._id === team1Id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {team1Id && team2Id && (
            <div className="flex items-center gap-3 py-2">
              <span className="flex-1 text-center font-semibold text-white" style={{ color: team1?.color }}>{team1?.name}</span>
              <span className="text-slate-500 font-mono">vs</span>
              <span className="flex-1 text-center font-semibold text-white" style={{ color: team2?.color }}>{team2?.name}</span>
            </div>
          )}
        </div>

        <button
          onClick={startMatch}
          disabled={!team1Id || !team2Id}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl px-4 py-4 text-lg transition-colors"
        >
          ▶ Start meci
        </button>
      </div>
    );
  }

  // ─── DONE ────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold text-white">Meci terminat</h1>

        {/* Final score */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white text-lg">{team1?.name}</span>
            <div className="font-mono font-bold text-4xl text-white px-4">{score1} — {score2}</div>
            <span className="font-bold text-white text-lg">{team2?.name}</span>
          </div>
          <p className="text-slate-500 text-sm">Durata: {fmt(elapsed)}</p>
        </div>

        {/* Goals summary */}
        {goals.length > 0 && (
          <div className="space-y-1">
            {goals.map((g) => {
              const team = teams.find((t) => t._id === g.team_id);
              const scorer = playersFor(g.team_id).find((p) => p._id === g.scorer_id);
              const assister = g.assist_id ? playersFor(g.team_id).find((p) => p._id === g.assist_id) : null;
              return (
                <div key={g.id} className="flex items-center gap-2 text-sm text-slate-300 px-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: team?.color }} />
                  <span className="text-slate-500 w-8">{goalMinute(g.elapsedAtGoal)}</span>
                  <span>{scorer?.name ?? '?'}</span>
                  {assister && <span className="text-slate-500">(assist: {assister.name})</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Penalty winner */}
        {isPenaltyNeeded && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4">
            <p className="text-yellow-400 text-sm font-medium mb-3">Egalitate — câștigător la penalty:</p>
            <div className="grid grid-cols-2 gap-3">
              {[team1Id, team2Id].map((tid) => {
                const team = teams.find((t) => t._id === tid);
                return (
                  <button key={tid} onClick={() => setPenaltyWinnerId(tid)}
                    className={`py-3 rounded-lg border font-semibold transition-colors ${penaltyWinnerId === tid ? 'border-yellow-500 bg-yellow-900/30 text-yellow-300' : 'border-slate-600 text-slate-300 hover:text-white'}`}>
                    {team?.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setPhase('setup'); setGoals([]); setElapsed(0); }}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-medium transition-colors">
            Refă meciul
          </button>
          <button onClick={handleSave} disabled={saving || (isPenaltyNeeded && !penaltyWinnerId)}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold rounded-xl py-3 transition-colors">
            {saving ? 'Se salvează...' : 'Salvează meciul'}
          </button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE / PAUSED / EXTRATIME ─────────────────────────────────────────
  const isExtra = phase === 'extratime';
  const isPaused = phase === 'paused';

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* Score */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="grid grid-cols-3 items-center">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: team1?.color }} />
            <p className="text-xs text-slate-400 mb-1 truncate">{team1?.name}</p>
            <p className="text-5xl font-bold font-mono text-white">{score1}</p>
          </div>
          <div className="text-center">
            {/* Timer */}
            <p className={`text-3xl font-mono font-bold ${isExtra ? 'text-orange-400' : isPaused ? 'text-yellow-400' : 'text-green-400'}`}>
              {isExtra ? fmt(duration * 60) : fmt(elapsed)}
            </p>
            {isExtra && (
              <p className="text-orange-400 font-mono font-bold text-xl">+{fmt(extraElapsed)}</p>
            )}
            {isPaused && <p className="text-xs text-yellow-400 mt-0.5">PAUZA</p>}
            {isExtra && !isPaused && <p className="text-xs text-orange-400 mt-0.5">EXTRA TIME</p>}
          </div>
          <div className="text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: team2?.color }} />
            <p className="text-xs text-slate-400 mb-1 truncate">{team2?.name}</p>
            <p className="text-5xl font-bold font-mono text-white">{score2}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={togglePause}
          className={`py-3 rounded-xl font-semibold text-sm transition-colors ${isPaused ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
          {isPaused ? '▶ Continuă' : '⏸ Pauză'}
        </button>
        <button onClick={stopMatch}
          className={`py-3 rounded-xl font-semibold text-sm transition-colors ${isExtra ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-slate-700 hover:bg-red-700'} text-white`}>
          ⏹ Oprește meciul
        </button>
      </div>

      {/* Goal button */}
      {!panel.open && (
        <button onClick={openGoalPanel}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-5 text-xl transition-colors">
          ⚽ GOL!
        </button>
      )}

      {/* Goal entry panel */}
      {panel.open && (
        <div className="bg-slate-800 border-2 border-green-600 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">⚽ Gol la {goalMinute(panel.elapsedAtGoal)}</p>
            <button onClick={() => setPanel((p) => ({ ...p, open: false }))} className="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <form onSubmit={submitGoal} className="space-y-3">
            {/* Team buttons */}
            <div className="grid grid-cols-2 gap-2">
              {[team1Id, team2Id].map((tid) => {
                const team = teams.find((t) => t._id === tid);
                return (
                  <button key={tid} type="button" onClick={() => setPanel((p) => ({ ...p, teamId: tid, scorerId: '', assistId: '' }))}
                    className={`py-2.5 rounded-lg border font-medium text-sm transition-colors ${panel.teamId === tid ? 'text-white border-transparent' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                    style={panel.teamId === tid ? { backgroundColor: team?.color, borderColor: team?.color } : {}}>
                    {team?.name}
                  </button>
                );
              })}
            </div>

            {/* Scorer */}
            <select value={panel.scorerId} onChange={(e) => setPanel((p) => ({ ...p, scorerId: e.target.value, assistId: '' }))}
              disabled={!panel.teamId}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500 disabled:opacity-50">
              <option value="">Marcator *</option>
              {playersFor(panel.teamId).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            {/* Assister */}
            <select value={panel.assistId} onChange={(e) => setPanel((p) => ({ ...p, assistId: e.target.value }))}
              disabled={!panel.scorerId}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500 disabled:opacity-50">
              <option value="">Assist (opțional)</option>
              {playersFor(panel.teamId).filter((p) => p._id !== panel.scorerId).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            <button type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg py-3 transition-colors">
              Confirmă golul
            </button>
          </form>
        </div>
      )}

      {/* Goals log */}
      {goals.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Goluri marcate</p>
          {[...goals].reverse().map((g) => {
            const team = teams.find((t) => t._id === g.team_id);
            const scorer = playersFor(g.team_id).find((p) => p._id === g.scorer_id);
            const assister = g.assist_id ? playersFor(g.team_id).find((p) => p._id === g.assist_id) : null;
            return (
              <div key={g.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: team?.color }} />
                <span className="text-slate-400 text-xs w-8">{goalMinute(g.elapsedAtGoal)}</span>
                <span className="text-white text-sm flex-1">{scorer?.name ?? '?'}</span>
                {assister && <span className="text-slate-500 text-xs">{assister.name}</span>}
                <button onClick={() => setGoals((prev) => prev.filter((x) => x.id !== g.id))}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20 transition-colors">
                  Anulează
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
