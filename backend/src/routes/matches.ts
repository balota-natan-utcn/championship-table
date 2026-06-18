import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAdmin } from '../middleware/auth';
import Match from '../models/Match';
import { IGoal } from '../models/Match';

const router = Router();

// GET /api/matches?championship_id=xxx&evening_date=YYYY-MM-DD
router.get('/', async (req: Request, res: Response) => {
  const { championship_id, evening_date } = req.query as {
    championship_id?: string;
    evening_date?: string;
  };

  const filter: Record<string, unknown> = {};
  if (championship_id) filter['championship_id'] = championship_id;
  if (evening_date) {
    const start = new Date(evening_date);
    const end = new Date(evening_date);
    end.setDate(end.getDate() + 1);
    filter['evening_date'] = { $gte: start, $lt: end };
  }

  const matches = await Match.find(filter)
    .populate('team1_id', 'name color')
    .populate('team2_id', 'name color')
    .populate('winner_id', 'name color')
    .populate('penalty_winner_id', 'name color')
    .populate('goals.scorer_id', 'name')
    .populate('goals.assist_id', 'name')
    .sort({ evening_date: 1, createdAt: 1 });

  res.json(matches);
});

// GET /api/matches/:id
router.get('/:id', async (req: Request, res: Response) => {
  const match = await Match.findById(req.params['id'])
    .populate('team1_id', 'name color')
    .populate('team2_id', 'name color')
    .populate('winner_id', 'name color')
    .populate('penalty_winner_id', 'name color')
    .populate('goals.scorer_id', 'name')
    .populate('goals.assist_id', 'name');

  if (!match) {
    res.status(404).json({ message: 'Match not found' });
    return;
  }
  res.json(match);
});

// POST /api/matches (admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { championship_id, evening_date, team1_id, team2_id, score1, score2, penalty_winner_id, goals, end_time_seconds } =
    req.body as {
      championship_id: string;
      evening_date: string;
      team1_id: string;
      team2_id: string;
      score1: number;
      score2: number;
      penalty_winner_id?: string;
      goals?: IGoal[];
      end_time_seconds?: number;
    };

  if (!championship_id || !evening_date || !team1_id || !team2_id) {
    res.status(400).json({ message: 'championship_id, evening_date, team1_id, team2_id are required' });
    return;
  }

  const winner_id = determineWinner(team1_id, team2_id, score1, score2, penalty_winner_id);

  const match = await Match.create({
    championship_id,
    evening_date: new Date(evening_date),
    team1_id,
    team2_id,
    score1: score1 ?? 0,
    score2: score2 ?? 0,
    penalty_winner_id: penalty_winner_id ?? undefined,
    winner_id,
    goals: goals ?? [],
    status: 'finished',
    end_time_seconds: end_time_seconds ?? undefined,
  });

  const populated = await match.populate([
    { path: 'team1_id', select: 'name color' },
    { path: 'team2_id', select: 'name color' },
    { path: 'winner_id', select: 'name color' },
  ]);

  res.status(201).json(populated);
});

// PUT /api/matches/:id (admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { score1, score2, penalty_winner_id, goals, status, end_time_seconds } = req.body as {
    score1?: number;
    score2?: number;
    penalty_winner_id?: string;
    goals?: IGoal[];
    status?: 'scheduled' | 'finished';
    end_time_seconds?: number;
  };

  const match = await Match.findById(req.params['id']);
  if (!match) {
    res.status(404).json({ message: 'Match not found' });
    return;
  }

  if (score1 !== undefined) match.score1 = score1;
  if (score2 !== undefined) match.score2 = score2;
  if (penalty_winner_id !== undefined) match.penalty_winner_id = new Types.ObjectId(penalty_winner_id);
  if (goals !== undefined) match.goals = goals;
  if (status !== undefined) match.status = status;
  if (end_time_seconds !== undefined) match.end_time_seconds = end_time_seconds;

  if (score1 !== undefined || score2 !== undefined || penalty_winner_id !== undefined) {
    match.winner_id = new Types.ObjectId(
      determineWinner(
        match.team1_id.toString(),
        match.team2_id.toString(),
        match.score1,
        match.score2,
        match.penalty_winner_id?.toString()
      )
    );
  }

  await match.save();

  const populated = await match.populate([
    { path: 'team1_id', select: 'name color' },
    { path: 'team2_id', select: 'name color' },
    { path: 'winner_id', select: 'name color' },
    { path: 'goals.scorer_id', select: 'name' },
    { path: 'goals.assist_id', select: 'name' },
  ]);

  res.json(populated);
});

// DELETE /api/matches/:id (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const match = await Match.findByIdAndDelete(req.params['id']);
  if (!match) {
    res.status(404).json({ message: 'Match not found' });
    return;
  }
  res.json({ message: 'Match deleted' });
});

function determineWinner(
  team1_id: string,
  team2_id: string,
  score1: number,
  score2: number,
  penalty_winner_id?: string
): string {
  if (score1 > score2) return team1_id;
  if (score2 > score1) return team2_id;
  // Scores equal → penalty decider required
  if (penalty_winner_id) return penalty_winner_id;
  // Fallback (shouldn't happen)
  return team1_id;
}

export default router;
