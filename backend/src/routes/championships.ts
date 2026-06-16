import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import Championship from '../models/Championship';
import Team from '../models/Team';
import Match from '../models/Match';
import { computeStandings, computeTopScorers } from '../utils/standings';
import { Types } from 'mongoose';

const router = Router();

// GET /api/championships
router.get('/', async (_req: Request, res: Response) => {
  const championships = await Championship.find().sort({ startDate: -1 });
  res.json(championships);
});

// GET /api/championships/active
router.get('/active', async (_req: Request, res: Response) => {
  const championship = await Championship.findOne({ status: 'active' }).sort({ startDate: -1 });
  if (!championship) {
    res.status(404).json({ message: 'No active championship' });
    return;
  }
  res.json(championship);
});

// GET /api/championships/:id
router.get('/:id', async (req: Request, res: Response) => {
  const championship = await Championship.findById(req.params['id']);
  if (!championship) {
    res.status(404).json({ message: 'Championship not found' });
    return;
  }
  res.json(championship);
});

// GET /api/championships/:id/standings
router.get('/:id/standings', async (req: Request, res: Response) => {
  const teams = await Team.find({ championship_id: req.params['id'] }).populate(
    'player_ids',
    'name photo_url'
  );
  const matches = await Match.find({ championship_id: req.params['id'] });

  const teamIds = teams.map((t) => t._id as Types.ObjectId);
  const standings = computeStandings(teamIds, matches);

  const result = standings.map((s) => ({
    ...s,
    team: teams.find((t) => t._id.toString() === s.team_id),
  }));

  res.json(result);
});

// GET /api/championships/:id/scorers
router.get('/:id/scorers', async (req: Request, res: Response) => {
  const matches = await Match.find({ championship_id: req.params['id'] })
    .populate('goals.scorer_id', 'name photo_url')
    .populate('goals.assist_id', 'name photo_url');

  const scorers = computeTopScorers(matches);
  res.json(scorers);
});

// GET /api/championships/:id/evenings
router.get('/:id/evenings', async (req: Request, res: Response) => {
  const matches = await Match.find({ championship_id: req.params['id'], status: 'finished' })
    .populate('team1_id', 'name color')
    .populate('team2_id', 'name color')
    .populate('winner_id', 'name color')
    .sort({ evening_date: 1 });

  // Group by evening date
  const byEvening: Record<string, typeof matches> = {};
  for (const match of matches) {
    const key = (match.evening_date as Date).toISOString().slice(0, 10);
    if (!byEvening[key]) byEvening[key] = [];
    byEvening[key]!.push(match);
  }

  const evenings = Object.entries(byEvening).map(([date, eveningMatches]) => ({
    date,
    matches: eveningMatches,
  }));

  res.json(evenings);
});

// POST /api/championships (admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { name, startDate } = req.body as { name: string; startDate: string };

  if (!name || !startDate) {
    res.status(400).json({ message: 'name and startDate are required' });
    return;
  }

  const existing = await Championship.findOne({ status: 'active' });
  if (existing) {
    res.status(400).json({ message: 'There is already an active championship. Finish it first.' });
    return;
  }

  const championship = await Championship.create({ name, startDate: new Date(startDate) });
  res.status(201).json(championship);
});

// PUT /api/championships/:id/finish (admin)
router.put('/:id/finish', requireAdmin, async (req: Request, res: Response) => {
  const championship = await Championship.findById(req.params['id']);
  if (!championship) {
    res.status(404).json({ message: 'Championship not found' });
    return;
  }
  if (championship.status === 'finished') {
    res.status(400).json({ message: 'Championship already finished' });
    return;
  }

  const teams = await Team.find({ championship_id: championship._id });
  const matches = await Match.find({ championship_id: championship._id });
  const teamIds = teams.map((t) => t._id as Types.ObjectId);
  const standings = computeStandings(teamIds, matches);

  const winnerId = standings[0]?.team_id;

  championship.status = 'finished';
  championship.endDate = new Date();
  if (winnerId) championship.winner_team_id = new Types.ObjectId(winnerId);

  await championship.save();
  res.json(championship);
});

// DELETE /api/championships/:id (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const championship = await Championship.findByIdAndDelete(req.params['id']);
  if (!championship) {
    res.status(404).json({ message: 'Championship not found' });
    return;
  }
  await Team.deleteMany({ championship_id: championship._id });
  await Match.deleteMany({ championship_id: championship._id });
  res.json({ message: 'Championship deleted' });
});

export default router;
