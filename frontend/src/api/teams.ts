import api from './client';
import type { Team } from '../types';

export const getTeams = (championshipId: string) =>
  api.get<Team[]>('/teams', { params: { championship_id: championshipId } }).then((r) => r.data);

export const createTeam = (data: {
  championship_id: string;
  name: string;
  color: string;
  player_ids: string[];
}) => api.post<Team>('/teams', data).then((r) => r.data);

export const updateTeam = (
  id: string,
  data: { name?: string; color?: string; player_ids?: string[] }
) => api.put<Team>(`/teams/${id}`, data).then((r) => r.data);

export const deleteTeam = (id: string) => api.delete(`/teams/${id}`).then((r) => r.data);
