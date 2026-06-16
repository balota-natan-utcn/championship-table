import api from './client';
import type { Championship, TeamStanding, TopScorer, Evening, Match } from '../types';

export const getChampionships = () =>
  api.get<Championship[]>('/championships').then((r) => r.data);

export const getActiveChampionship = () =>
  api.get<Championship>('/championships/active').then((r) => r.data);

export const getChampionship = (id: string) =>
  api.get<Championship>(`/championships/${id}`).then((r) => r.data);

export const getStandings = (id: string) =>
  api.get<TeamStanding[]>(`/championships/${id}/standings`).then((r) => r.data);

export const getScorers = (id: string) =>
  api.get<TopScorer[]>(`/championships/${id}/scorers`).then((r) => r.data);

export const getEvenings = (id: string) =>
  api.get<Evening[]>(`/championships/${id}/evenings`).then((r) => r.data);

export const getMatches = (championshipId: string) =>
  api.get<Match[]>('/matches', { params: { championship_id: championshipId } }).then((r) => r.data);

export const createChampionship = (data: { name: string; startDate: string }) =>
  api.post<Championship>('/championships', data).then((r) => r.data);

export const finishChampionship = (id: string) =>
  api.put<Championship>(`/championships/${id}/finish`).then((r) => r.data);

export const deleteChampionship = (id: string) =>
  api.delete(`/championships/${id}`).then((r) => r.data);
