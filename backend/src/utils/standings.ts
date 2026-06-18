import { Types } from 'mongoose';
import { IMatch } from '../models/Match';

export interface TeamStanding {
  team_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  goals_for: number;
  goals_against: number;
  evenings_won: number;
}

export function computeStandings(
  teamIds: Types.ObjectId[],
  matches: IMatch[]
): TeamStanding[] {
  const finished = matches.filter((m) => m.status === 'finished');

  const stats: Record<string, Omit<TeamStanding, 'evenings_won'>> = {};
  for (const id of teamIds) {
    const key = id.toString();
    stats[key] = {
      team_id: key,
      matches_played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      goals_for: 0,
      goals_against: 0,
    };
  }

  for (const match of finished) {
    const t1 = match.team1_id.toString();
    const t2 = match.team2_id.toString();
    const winner = match.winner_id.toString();

    if (stats[t1]) {
      stats[t1]!.matches_played++;
      stats[t1]!.goals_for += match.score1;
      stats[t1]!.goals_against += match.score2;
      if (winner === t1) {
        stats[t1]!.wins++;
        stats[t1]!.points += 3;
      } else {
        stats[t1]!.losses++;
      }
    }

    if (stats[t2]) {
      stats[t2]!.matches_played++;
      stats[t2]!.goals_for += match.score2;
      stats[t2]!.goals_against += match.score1;
      if (winner === t2) {
        stats[t2]!.wins++;
        stats[t2]!.points += 3;
      } else {
        stats[t2]!.losses++;
      }
    }
  }

  const eveningsWon = computeEveningsWon(teamIds, finished);

  const standings: TeamStanding[] = teamIds.map((id) => {
    const key = id.toString();
    return {
      ...stats[key]!,
      evenings_won: eveningsWon[key] ?? 0,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.evenings_won !== a.evenings_won) return b.evenings_won - a.evenings_won;
    return b.goals_for - a.goals_for;
  });

  return standings;
}

function computeEveningsWon(
  teamIds: Types.ObjectId[],
  matches: IMatch[]
): Record<string, number> {
  // Group matches by evening date (YYYY-MM-DD)
  const byEvening: Record<string, IMatch[]> = {};
  for (const match of matches) {
    const key = match.evening_date.toISOString().slice(0, 10);
    if (!byEvening[key]) byEvening[key] = [];
    byEvening[key]!.push(match);
  }

  const eveningsWon: Record<string, number> = {};
  for (const id of teamIds) eveningsWon[id.toString()] = 0;

  for (const eveningMatches of Object.values(byEvening)) {
    // Count wins per team for this evening
    const winsThisEvening: Record<string, number> = {};
    for (const match of eveningMatches) {
      const winner = match.winner_id.toString();
      winsThisEvening[winner] = (winsThisEvening[winner] ?? 0) + 1;
    }

    // Find max wins this evening
    const maxWins = Math.max(...Object.values(winsThisEvening));

    // Teams with that max win the evening (if tied, nobody wins)
    const topTeams = Object.entries(winsThisEvening).filter(([, w]) => w === maxWins);
    if (topTeams.length === 1 && topTeams[0]) {
      const winnerId = topTeams[0][0];
      eveningsWon[winnerId] = (eveningsWon[winnerId] ?? 0) + 1;
    }
  }

  return eveningsWon;
}

function extractId(ref: unknown): string {
  if (ref && typeof ref === 'object' && '_id' in ref) return (ref as any)._id.toString();
  return String(ref);
}

export function computeTopScorers(
  matches: IMatch[]
): { player_id: string; player: unknown; goals: number; assists: number }[] {
  const stats: Record<string, { player_id: string; player: unknown; goals: number; assists: number }> = {};

  for (const match of matches.filter((m) => m.status === 'finished')) {
    for (const goal of match.goals) {
      if (goal.is_penalty_decider) continue;

      const scorerId = extractId(goal.scorer_id);
      const scorerObj = goal.scorer_id && typeof goal.scorer_id === 'object' && '_id' in (goal.scorer_id as object)
        ? goal.scorer_id
        : null;
      if (!stats[scorerId]) stats[scorerId] = { player_id: scorerId, player: scorerObj, goals: 0, assists: 0 };
      if (!goal.is_own_goal) stats[scorerId]!.goals++;

      if (!goal.is_own_goal && goal.assist_id) {
        const assistId = extractId(goal.assist_id);
        const assistObj = goal.assist_id && typeof goal.assist_id === 'object' && '_id' in (goal.assist_id as object)
          ? goal.assist_id
          : null;
        if (!stats[assistId]) stats[assistId] = { player_id: assistId, player: assistObj, goals: 0, assists: 0 };
        stats[assistId]!.assists++;
      }
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.assists - a.assists;
  });
}
