import api from './client';
import type { Match } from '../types';

interface MatchPayload {
  championship_id: string;
  evening_date: string;
  team1_id: string;
  team2_id: string;
  score1: number;
  score2: number;
  penalty_winner_id?: string;
  goals?: {
    scorer_id: string;
    team_id: string;
    assist_id?: string;
    is_penalty_decider: boolean;
  }[];
}

export const createMatch = (data: MatchPayload) =>
  api.post<Match>('/matches', data).then((r) => r.data);

export const updateMatch = (id: string, data: Partial<MatchPayload>) =>
  api.put<Match>(`/matches/${id}`, data).then((r) => r.data);

export const deleteMatch = (id: string) => api.delete(`/matches/${id}`).then((r) => r.data);
