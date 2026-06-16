import api from './client';
import type { Player } from '../types';

export const getPlayers = () => api.get<Player[]>('/players').then((r) => r.data);

export const createPlayer = (formData: FormData) =>
  api.post<Player>('/players', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updatePlayer = (id: string, formData: FormData) =>
  api.put<Player>(`/players/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const deletePlayer = (id: string) =>
  api.delete(`/players/${id}`).then((r) => r.data);
