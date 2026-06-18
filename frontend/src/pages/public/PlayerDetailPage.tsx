import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayerById, getPlayerDetailStats } from '../../api/players';
import type { Player, PlayerDetailStats } from '../../types';

function cloudinaryTransform(url: string, w: number, h: number) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,g_face/`);
}

function UserAvatarLargeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-slate-600">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
      <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getPlayerById(id), getPlayerDetailStats(id)])
      .then(([p, s]) => { setPlayer(p); setStats(s); })
      .catch(() => setError('Jucătorul nu a fost găsit.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8 space-y-6">
        <div className="h-5 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-full bg-slate-800 animate-pulse" />
          <div className="h-6 w-40 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-56 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`h-20 bg-slate-800 rounded-lg animate-pulse ${i === 6 ? 'col-span-2 sm:col-span-1' : ''}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white mb-6 block">
          ← Înapoi
        </button>
        <p className="text-slate-500 text-center py-16">{error || 'Jucătorul nu a fost găsit.'}</p>
      </div>
    );
  }

  const ga = (stats?.goals ?? 0) + (stats?.assists ?? 0);
  const gaPerMatch = stats && stats.matches_played > 0
    ? (ga / stats.matches_played).toFixed(2)
    : '—';

  const photoUrl = player.photo_url
    ? cloudinaryTransform(player.photo_url, 300, 300)
    : '';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        ← Jucători
      </button>

      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 pt-2">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.name}
            className="w-28 h-28 rounded-full object-cover border-2 border-slate-600 shadow-lg"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
            <UserAvatarLargeIcon />
          </div>
        )}
        <h1 className="text-2xl font-bold text-white text-center">{player.name}</h1>
        {player.motto && (
          <p className="text-sm text-slate-400 italic text-center max-w-xs">"{player.motto}"</p>
        )}
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Goluri" value={stats.goals} accent="text-green-400" />
          <StatCard label="Asisturi" value={stats.assists} accent="text-blue-400" />
          <StatCard label="G+A" value={ga} accent="text-slate-200" />
          <StatCard label="G+A / Meci" value={gaPerMatch} accent="text-slate-200" />
          <StatCard label="Meciuri jucate" value={stats.matches_played} accent="text-slate-300" />
          <StatCard label="Victorii" value={stats.wins} accent="text-yellow-400" />
          <StatCard label="Înfrângeri" value={stats.losses} accent="text-red-400" />
          {stats.own_goals > 0 && (
            <StatCard label="Autogoluri" value={stats.own_goals} accent="text-orange-400" />
          )}
        </div>
      )}
    </div>
  );
}
