import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChampionships } from '../../api/championships';
import type { Championship } from '../../types';

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
      <div className="flex items-center justify-center min-h-64 text-slate-400">Se încarcă...</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Istoric campionate</h1>

      {championships.length === 0 ? (
        <p className="text-slate-500">Niciun campionat terminat încă.</p>
      ) : (
        <div className="space-y-3">
          {championships.map((c, i) => (
            <Link
              key={c._id}
              to={`/championship/${c._id}`}
              className="block bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-lg px-5 py-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {i === 0 && <span className="text-yellow-400">🏆</span>}
                    <span className="font-semibold text-white">{c.name}</span>
                  </div>
                  <p className="text-sm text-slate-400">
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
                <span className="text-slate-500">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
