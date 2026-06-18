import api from './client';
import type { Player, PlayerDetailStats } from '../types';

export interface PlayerStat {
  player_id: string;
  player: Player;
  goals: number;
  assists: number;
  own_goals: number;
  wins: number;
  matches_played: number;
}

export const getPlayers = () => api.get<Player[]>('/players').then((r) => r.data);

export const getPlayerById = (id: string) =>
  api.get<Player>(`/players/${id}`).then((r) => r.data);

export const getPlayerDetailStats = (id: string) =>
  api.get<PlayerDetailStats>(`/players/${id}/stats`).then((r) => r.data);

export const getPlayerStats = (scope: 'alltime' | 'current' | 'evening', date?: string) =>
  api.get<PlayerStat[]>('/players/stats', { params: { scope, date } }).then((r) => r.data);

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
