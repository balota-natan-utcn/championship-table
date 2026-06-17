import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChampionships } from '../../api/championships';
import type { Championship } from '../../types';
import { TrophyIcon } from '../../components/icons';

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function HistoryPage() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChampionships()
      .then((data) => setChampionships(data.filter((c) => c.status === 'finished')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8 space-y-3">
        <div className="h-7 w-48 bg-slate-800 rounded animate-pulse mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[72px] bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <h1 className="text-xl font-bold text-white mb-5">Istoric campionate</h1>

      {championships.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">Niciun campionat terminat încă.</p>
      ) : (
        <div className="space-y-2">
          {championships.map((c, i) => (
            <Link
              key={c._id}
              to={`/championship/${c._id}`}
              className="flex items-center gap-3 bg-slate-800 border border-slate-700 active:border-slate-600 active:bg-slate-750 rounded-lg px-4 py-4 transition-colors min-h-[64px]"
            >
              {i === 0 ? (
                <TrophyIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center text-xs font-mono text-slate-500 flex-shrink-0">
                  {i + 1}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{c.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(c.startDate).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {c.endDate && (
                    <>
                      {' '}—{' '}
                      {new Date(c.endDate).toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </>
                  )}
                </p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
