export interface Player {
  _id: string;
  name: string;
  photo_url: string;
  motto: string;
  createdAt: string;
}

export interface PlayerDetailStats {
  goals: number;
  assists: number;
  own_goals: number;
  wins: number;
  losses: number;
  matches_played: number;
}

export interface Championship {
  _id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'finished';
  winner_team_id?: string;
}

export interface Team {
  _id: string;
  championship_id: string;
  name: string;
  color: string;
  player_ids: Player[];
}

export interface Goal {
  scorer_id: Player | string;
  team_id: string;
  assist_id?: Player | string;
  is_penalty_decider: boolean;
  is_own_goal: boolean;
}

export interface Match {
  _id: string;
  championship_id: string;
  evening_date: string;
  team1_id: Team;
  team2_id: Team;
  score1: number;
  score2: number;
  penalty_winner_id?: Team;
  winner_id: Team;
  goals: Goal[];
  status: 'scheduled' | 'finished';
}

export interface TeamStanding {
  team_id: string;
  team: Team;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  goals_for: number;
  goals_against: number;
  evenings_won: number;
}

export interface TopScorer {
  player_id: string;
  goals: number;
  assists: number;
  player?: Player;
}

export interface Evening {
  date: string;
  matches: Match[];
}
