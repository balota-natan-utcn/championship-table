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
  team_id: string;      // benefiting team (for score calculation)
  scorer_id: string;
  assist_id: string;
  elapsedAtGoal: number;
  is_penalty_decider: boolean;
  is_own_goal: boolean;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function goalMinute(secs: number) {
  return `${Math.floor(secs / 60) + 1}'`;
}

export default function LiveMatchPage() {
  const navigate = useNavigate();

  const [championshipId, setChampionshipId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [duration, setDuration] = useState(7);
  const [eveningDate, setEveningDate] = useState(new Date().toISOString().slice(0, 10));
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');

  const [phase, setPhase] = useState<Phase>('setup');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [panel, setPanel] = useState({ open: false, elapsedAtGoal: 0, teamId: '', scorerId: '', assistId: '', isOwnGoal: false });
  const [penaltyWinnerId, setPenaltyWinnerId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActiveChampionship()
      .then((c) => { setChampionshipId(c._id); return getTeams(c._id); })
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (phase === 'active' || phase === 'extratime') {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Normal → extra time
  useEffect(() => {
    if (phase === 'active' && elapsed >= duration * 60) setPhase('extratime');
  }, [elapsed, phase, duration]);

  // Wake Lock — keep screen on during match
  useEffect(() => {
    const isPlaying = phase === 'active' || phase === 'extratime' || phase === 'paused';
    if (isPlaying && 'wakeLock' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).wakeLock.request('screen')
        .then((wl: unknown) => { wakeLockRef.current = wl; })
        .catch(() => {});
    }
    return () => { wakeLockRef.current?.release().catch(() => {}); wakeLockRef.current = null; };
  }, [phase]);

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
    if (!team1Id || !team2Id || team1Id === team2Id) { toast.error('Selectează două echipe diferite'); return; }
    setPhase('active'); setElapsed(0); setGoals([]); setPenaltyWinnerId('');
  }

  function togglePause() {
    setPhase((prev) => prev === 'paused' ? (elapsed >= duration * 60 ? 'extratime' : 'active') : 'paused');
  }

  function stopMatch() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('done');
  }

  function openGoalPanel() {
    setPanel({ open: true, elapsedAtGoal: elapsed, teamId: '', scorerId: '', assistId: '', isOwnGoal: false });
  }

  function submitGoal(e: FormEvent) {
    e.preventDefault();
    if (!panel.teamId || !panel.scorerId) { toast.error('Selectează echipa și marcatorul'); return; }
    navigator.vibrate?.(100);
    // For own goals: panel.teamId = the team whose player scored OG → benefiting team = opponent
    const benefitingTeamId = panel.isOwnGoal
      ? (panel.teamId === team1Id ? team2Id : team1Id)
      : panel.teamId;
    setGoals((prev) => [...prev, {
      id: crypto.randomUUID(),
      team_id: benefitingTeamId, scorer_id: panel.scorerId,
      assist_id: panel.isOwnGoal ? '' : panel.assistId,
      elapsedAtGoal: panel.elapsedAtGoal,
      is_penalty_decider: false,
      is_own_goal: panel.isOwnGoal,
    }]);
    setPanel({ open: false, elapsedAtGoal: 0, teamId: '', scorerId: '', assistId: '', isOwnGoal: false });
  }

  async function handleSave() {
    if (isPenaltyNeeded && !penaltyWinnerId) { toast.error('Selectează câștigătorul la penalty'); return; }
    setSaving(true);
    try {
      await createMatch({
        championship_id: championshipId, evening_date: eveningDate,
        team1_id: team1Id, team2_id: team2Id, score1, score2,
        penalty_winner_id: isPenaltyNeeded ? penaltyWinnerId : undefined,
        end_time_seconds: elapsed,
        goals: goals.map((g) => ({
          scorer_id: g.scorer_id,
          team_id: g.team_id,
          assist_id: g.assist_id || undefined,
          is_penalty_decider: false,
          is_own_goal: g.is_own_goal,
          minute: Math.floor(g.elapsedAtGoal / 60) + 1,
        })),
      });
      toast.success('Meci salvat!');
      navigate('/admin/dashboard');
    } catch { toast.error('Eroare la salvare'); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[100dvh] bg-slate-900 text-slate-400">
      Se încarcă...
    </div>
  );

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-[100dvh] bg-slate-900 px-4 py-6 pb-24 flex flex-col gap-5 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-white">Timer meci</h1>

        <div className="bg-slate-800 rounded-2xl p-5 space-y-5">
          {/* Duration */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">Durată meci</label>
            <div className="flex items-center justify-between bg-slate-700 rounded-xl px-2 py-2">
              <button onClick={() => setDuration((d) => Math.max(1, d - 1))}
                className="w-14 h-14 text-2xl font-bold text-white rounded-xl active:bg-slate-600 transition-colors flex items-center justify-center">
                −
              </button>
              <span className="text-4xl font-bold text-white">{duration} <span className="text-lg text-slate-400">min</span></span>
              <button onClick={() => setDuration((d) => Math.min(20, d + 1))}
                className="w-14 h-14 text-2xl font-bold text-white rounded-xl active:bg-slate-600 transition-colors flex items-center justify-center">
                +
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Data serii</label>
            <input type="date" value={eveningDate} onChange={(e) => setEveningDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white text-base rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500" />
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Echipa 1', value: team1Id, set: setTeam1Id, other: team2Id },
              { label: 'Echipa 2', value: team2Id, set: setTeam2Id, other: team1Id }].map(({ label, value, set, other }) => (
              <div key={label}>
                <label className="block text-sm text-slate-400 mb-2">{label}</label>
                <select value={value} onChange={(e) => set(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-base rounded-xl px-3 py-3.5 focus:outline-none focus:border-green-500">
                  <option value="">Alege</option>
                  {teams.map((t) => <option key={t._id} value={t._id} disabled={t._id === other}>{t.name}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          {team1Id && team2Id && (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team1?.color }} />
                <span className="font-semibold text-white">{team1?.name}</span>
              </div>
              <span className="text-slate-500 font-bold">vs</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{team2?.name}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team2?.color }} />
              </div>
            </div>
          )}
        </div>

        <button onClick={startMatch} disabled={!team1Id || !team2Id || team1Id === team2Id}
          className="w-full bg-green-600 active:bg-green-700 disabled:opacity-40 text-white font-bold rounded-2xl py-5 text-xl transition-colors">
          ▶ Start meci
        </button>
      </div>
    );
  }

  // ─── DONE ────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-[100dvh] bg-slate-900 px-4 py-6 pb-24 flex flex-col gap-5 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-white">Meci terminat</h1>

        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="grid grid-cols-3 items-center text-center mb-4">
            <div>
              <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: team1?.color }} />
              <p className="text-sm text-slate-400 mb-2">{team1?.name}</p>
              <p className="text-6xl font-bold font-mono text-white">{score1}</p>
            </div>
            <div className="text-slate-600 text-3xl font-bold">—</div>
            <div>
              <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: team2?.color }} />
              <p className="text-sm text-slate-400 mb-2">{team2?.name}</p>
              <p className="text-6xl font-bold font-mono text-white">{score2}</p>
            </div>
          </div>
          <p className="text-center text-slate-500 text-sm">Durata: {fmt(elapsed)}</p>
        </div>

        {goals.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4 space-y-2.5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Goluri</p>
            {goals.map((g) => {
              const team = teams.find((t) => t._id === g.team_id);
              const allP = [...playersFor(team1Id), ...playersFor(team2Id)];
              const scorer = allP.find((p) => p._id === g.scorer_id);
              const assister = g.assist_id ? allP.find((p) => p._id === g.assist_id) : null;
              return (
                <div key={g.id} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: team?.color }} />
                  <span className="text-slate-400 w-8 text-xs">{goalMinute(g.elapsedAtGoal)}</span>
                  <span className="text-white font-medium flex-1">{scorer?.name ?? '?'}</span>
                  {g.is_own_goal && <span className="text-xs text-orange-400 font-bold">AG</span>}
                  {assister && <span className="text-slate-500 text-xs">+{assister.name}</span>}
                </div>
              );
            })}
          </div>
        )}

        {isPenaltyNeeded && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-2xl p-4">
            <p className="text-yellow-400 font-semibold mb-3">Egalitate — câștigător penalty:</p>
            <div className="grid grid-cols-2 gap-3">
              {[team1Id, team2Id].map((tid) => {
                const team = teams.find((t) => t._id === tid);
                return (
                  <button key={tid} onClick={() => setPenaltyWinnerId(tid)}
                    className={`py-4 rounded-xl border font-bold text-base transition-colors active:scale-95 ${penaltyWinnerId === tid ? 'border-transparent text-white' : 'border-slate-600 text-slate-300'}`}
                    style={penaltyWinnerId === tid ? { backgroundColor: team?.color } : {}}>
                    {team?.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-auto">
          <button onClick={() => { setPhase('setup'); setGoals([]); setElapsed(0); }}
            className="flex-1 bg-slate-700 active:bg-slate-600 text-white rounded-2xl py-4 font-semibold text-base transition-colors">
            Refă meciul
          </button>
          <button onClick={handleSave} disabled={saving || (isPenaltyNeeded && !penaltyWinnerId)}
            className="flex-[2] bg-green-600 active:bg-green-700 disabled:opacity-40 text-white font-bold rounded-2xl py-4 text-base transition-colors">
            {saving ? 'Se salvează...' : '✓ Salvează meciul'}
          </button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE / PAUSED / EXTRATIME ─────────────────────────────────────────
  const isExtra = phase === 'extratime';
  const isPaused = phase === 'paused';

  const timerColor = isPaused ? 'text-yellow-400' : isExtra ? 'text-orange-400' : 'text-green-400';

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 max-w-md mx-auto select-none overflow-hidden">

      {/* ── STATUS BAR ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <span className="text-xs text-slate-600">{eveningDate}</span>
        {isExtra && (
          <span className="text-xs font-bold text-orange-400 bg-orange-950 px-2 py-0.5 rounded-full animate-pulse">
            EXTRA TIME
          </span>
        )}
        {isPaused && (
          <span className="text-xs font-bold text-yellow-400 bg-yellow-950 px-2 py-0.5 rounded-full">
            PAUZA
          </span>
        )}
        {!isExtra && !isPaused && <span className="text-xs text-green-500 font-medium">● LIVE</span>}
      </div>

      {/* ── SCORE ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 items-center px-4 py-3 flex-shrink-0">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: team1?.color }} />
          <p className="text-xs text-slate-400 leading-tight truncate px-1">{team1?.name}</p>
        </div>
        <div /> {/* spacer */}
        <div className="text-center">
          <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: team2?.color }} />
          <p className="text-xs text-slate-400 leading-tight truncate px-1">{team2?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center px-4 flex-shrink-0">
        <p className="text-7xl font-black font-mono text-white text-center">{score1}</p>
        <p className="text-3xl text-slate-700 font-bold text-center">—</p>
        <p className="text-7xl font-black font-mono text-white text-center">{score2}</p>
      </div>

      {/* ── TIMER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center py-4 flex-shrink-0">
        {isExtra ? (
          <>
            <p className="text-2xl font-mono text-slate-600 line-through">{fmt(duration * 60)}</p>
            <p className={`text-6xl font-black font-mono tracking-tight ${timerColor}`}>+{fmt(extraElapsed)}</p>
          </>
        ) : (
          <p className={`text-7xl font-black font-mono tracking-tight ${timerColor}`}>{fmt(elapsed)}</p>
        )}
      </div>

      {/* ── PAUSE / STOP ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 px-4 flex-shrink-0">
        <button onClick={togglePause}
          className={`py-6 rounded-2xl font-bold text-lg transition-all active:scale-95 ${isPaused ? 'bg-green-600 active:bg-green-700 text-white' : 'bg-slate-800 active:bg-slate-700 text-yellow-400 border border-yellow-800'}`}>
          {isPaused ? '▶ Continuă' : '⏸ Pauză'}
        </button>
        <button onClick={stopMatch}
          className={`py-6 rounded-2xl font-bold text-lg transition-all active:scale-95 border ${isExtra ? 'bg-red-600 active:bg-red-700 text-white border-transparent animate-pulse' : 'bg-slate-800 active:bg-slate-700 text-red-400 border-red-900'}`}>
          ⏹ Oprește
        </button>
      </div>

      {/* ── GOL BUTTON ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4 flex-shrink-0">
        <button onClick={openGoalPanel} disabled={panel.open}
          className="w-full bg-green-600 active:bg-green-700 disabled:opacity-50 text-white font-black rounded-2xl py-8 text-3xl tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-green-900/40">
          ⚽ GOL!
        </button>
      </div>

      {/* ── GOALS LOG ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-20 space-y-2 min-h-0">
        {goals.length === 0 ? (
          <p className="text-center text-slate-700 text-sm py-2">Niciun gol</p>
        ) : (
          [...goals].reverse().map((g) => {
            const team = teams.find((t) => t._id === g.team_id);
            const allP = [...playersFor(team1Id), ...playersFor(team2Id)];
            const scorer = allP.find((p) => p._id === g.scorer_id);
            const assister = g.assist_id ? allP.find((p) => p._id === g.assist_id) : null;
            return (
              <div key={g.id} className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: team?.color }} />
                <span className="text-slate-500 text-xs w-7 font-mono">{goalMinute(g.elapsedAtGoal)}</span>
                <span className="text-white text-sm font-medium flex-1 truncate">{scorer?.name ?? '?'}</span>
                {g.is_own_goal && <span className="text-xs text-orange-400 font-bold flex-shrink-0">AG</span>}
                {assister && <span className="text-slate-500 text-xs truncate max-w-[80px]">+{assister.name}</span>}
                <button onClick={() => setGoals((prev) => prev.filter((x) => x.id !== g.id))}
                  className="text-slate-600 active:text-red-400 text-xl px-1 py-1 flex-shrink-0 transition-colors">
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── GOAL ENTRY BOTTOM SHEET ────────────────────────────────── */}
      {panel.open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setPanel((p) => ({ ...p, open: false }))} />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-3xl border-t border-slate-700 px-4 pt-3 pb-[env(safe-area-inset-bottom,16px)] max-w-md mx-auto">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-white text-lg">⚽ Gol la {goalMinute(panel.elapsedAtGoal)}</p>
              <button onClick={() => setPanel((p) => ({ ...p, open: false }))}
                className="w-8 h-8 flex items-center justify-center text-slate-400 active:text-white text-xl">×</button>
            </div>

            <form onSubmit={submitGoal} className="space-y-3">
              {/* Own goal toggle */}
              <button
                type="button"
                onClick={() => setPanel((p) => ({ ...p, isOwnGoal: !p.isOwnGoal, teamId: '', scorerId: '', assistId: '' }))}
                className={`w-full py-3 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] ${
                  panel.isOwnGoal
                    ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {panel.isOwnGoal ? '⚠ Autogol activat' : 'Autogol?'}
              </button>

              {/* Team buttons */}
              <p className="text-xs text-slate-500 px-1">
                {panel.isOwnGoal ? 'Echipa care a marcat în propria poartă:' : 'Echipa care a marcat:'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[team1Id, team2Id].map((tid) => {
                  const team = teams.find((t) => t._id === tid);
                  const selected = panel.teamId === tid;
                  return (
                    <button key={tid} type="button"
                      onClick={() => setPanel((p) => ({ ...p, teamId: tid, scorerId: '', assistId: '' }))}
                      className="py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 border"
                      style={selected
                        ? { backgroundColor: team?.color, borderColor: team?.color, color: '#fff' }
                        : { borderColor: '#374151', color: '#9ca3af' }}>
                      {team?.name}
                    </button>
                  );
                })}
              </div>

              {/* Scorer */}
              <select value={panel.scorerId}
                onChange={(e) => setPanel((p) => ({ ...p, scorerId: e.target.value, assistId: '' }))}
                disabled={!panel.teamId}
                className="w-full bg-slate-800 border border-slate-700 text-white text-base rounded-2xl px-4 py-4 focus:outline-none focus:border-green-500 disabled:opacity-40">
                <option value="">{panel.isOwnGoal ? 'Jucătorul care a marcat OG *' : 'Marcator *'}</option>
                {playersFor(panel.teamId).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>

              {/* Assister — hidden for own goals */}
              {!panel.isOwnGoal && (
                <select value={panel.assistId}
                  onChange={(e) => setPanel((p) => ({ ...p, assistId: e.target.value }))}
                  disabled={!panel.scorerId}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-base rounded-2xl px-4 py-4 focus:outline-none focus:border-green-500 disabled:opacity-40">
                  <option value="">Assist (opțional)</option>
                  {playersFor(panel.teamId).filter((p) => p._id !== panel.scorerId).map((p) =>
                    <option key={p._id} value={p._id}>{p.name}</option>
                  )}
                </select>
              )}

              <button type="submit" disabled={!panel.teamId || !panel.scorerId}
                className="w-full bg-green-600 active:bg-green-700 disabled:opacity-40 text-white font-bold rounded-2xl py-5 text-lg transition-all active:scale-[0.98]">
                ✓ Confirmă golul
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
