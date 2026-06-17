import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../../api/players';
import type { Player } from '../../types';
import toast from 'react-hot-toast';

export default function PlayersAdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const data = await getPlayers();
    setPlayers(data);
  }

  useEffect(() => { reload(); }, []);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function startEdit(player: Player) {
    setEditId(player._id);
    setName(player.name);
    setPreview(player.photo_url);
    setPhoto(null);
  }

  function cancelEdit() {
    setEditId(null);
    setName('');
    setPhoto(null);
    setPreview('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);

    const fd = new FormData();
    fd.append('name', name);
    if (photo) fd.append('photo', photo);

    try {
      if (editId) {
        await updatePlayer(editId, fd);
        toast.success('Jucător actualizat');
      } else {
        await createPlayer(fd);
        toast.success('Jucător adăugat');
      }
      await reload();
      cancelEdit();
    } catch {
      toast.error('Eroare la salvare');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, playerName: string) {
    if (!confirm(`Șterge jucătorul "${playerName}"?`)) return;
    try {
      await deletePlayer(id);
      toast.success('Jucător șters');
      await reload();
    } catch {
      toast.error('Eroare la ștergere');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Gestionare jucători</h1>

      {/* Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-base font-semibold text-slate-200 mb-4">
          {editId ? 'Editează jucător' : 'Jucător nou'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 items-start">
            {/* Photo preview */}
            <div className="flex-shrink-0">
              <label className="cursor-pointer block">
                <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 hover:border-green-500 overflow-hidden flex items-center justify-center transition-colors">
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Numele jucătorului"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
                >
                  {saving ? 'Se salvează...' : editId ? 'Salvează' : 'Adaugă'}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg px-4 py-2 text-sm transition-colors"
                  >
                    Anulează
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Players list */}
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player._id}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3"
          >
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={player.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-600"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                👤
              </div>
            )}
            <span className="flex-1 text-white font-medium">{player.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(player)}
                className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 border border-blue-800 rounded-lg transition-colors"
              >
                Editează
              </button>
              <button
                onClick={() => handleDelete(player._id, player.name)}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-900 rounded-lg transition-colors"
              >
                Șterge
              </button>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-slate-500 text-sm">Niciun jucător adăugat.</p>
        )}
      </div>
    </div>
  );
}
