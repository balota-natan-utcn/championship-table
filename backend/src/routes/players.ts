import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '../middleware/auth';
import Player from '../models/Player';
import Match from '../models/Match';
import Team from '../models/Team';
import Championship from '../models/Championship';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/players
router.get('/', async (_req: Request, res: Response) => {
  const players = await Player.find().sort({ name: 1 });
  res.json(players);
});

// GET /api/players/stats?scope=alltime|current|evening
router.get('/stats', async (req: Request, res: Response) => {
  const { scope, date } = req.query as { scope?: string; date?: string };

  const matchFilter: Record<string, unknown> = { status: 'finished' };

  if (scope === 'current' || scope === 'evening') {
    const activeChamp = await Championship.findOne({ status: 'active' });
    if (!activeChamp) { res.json([]); return; }
    matchFilter['championship_id'] = activeChamp._id;
  }

  if (scope === 'evening') {
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      matchFilter['evening_date'] = { $gte: start, $lt: end };
    } else {
      const latest = await Match.findOne(matchFilter).sort({ evening_date: -1 });
      if (latest) {
        const d = (latest.evening_date as Date).toISOString().slice(0, 10);
        const start = new Date(d);
        const end = new Date(d);
        end.setDate(end.getDate() + 1);
        matchFilter['evening_date'] = { $gte: start, $lt: end };
      }
    }
  }

  const matches = await Match.find(matchFilter);
  if (matches.length === 0) { res.json([]); return; }

  const champIds = [...new Set(matches.map((m) => m.championship_id.toString()))];
  const teams = await Team.find({ championship_id: { $in: champIds } });

  // team_id -> player_ids[]
  const teamPlayers: Record<string, string[]> = {};
  for (const team of teams) {
    teamPlayers[team._id.toString()] = team.player_ids.map((id) => id.toString());
  }

  const stats: Record<string, { player_id: string; goals: number; assists: number; wins: number; matches_played: number }> = {};

  function ensure(playerId: string) {
    if (!stats[playerId]) stats[playerId] = { player_id: playerId, goals: 0, assists: 0, wins: 0, matches_played: 0 };
    return stats[playerId]!;
  }

  for (const match of matches) {
    const t1 = match.team1_id.toString();
    const t2 = match.team2_id.toString();
    const winner = match.winner_id.toString();

    for (const teamId of [t1, t2]) {
      for (const playerId of teamPlayers[teamId] ?? []) {
        const s = ensure(playerId);
        s.matches_played++;
        if (teamId === winner) s.wins++;
      }
    }

    for (const goal of match.goals) {
      if (goal.is_penalty_decider) continue;
      ensure(goal.scorer_id.toString()).goals++;
      if (goal.assist_id) ensure(goal.assist_id.toString()).assists++;
    }
  }

  const playerIds = Object.keys(stats);
  const players = await Player.find({ _id: { $in: playerIds } });
  const playerMap: Record<string, unknown> = {};
  for (const p of players) playerMap[p._id.toString()] = p;

  const result = Object.values(stats)
    .filter((s) => playerMap[s.player_id])
    .map((s) => ({ ...s, player: playerMap[s.player_id] }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  res.json(result);
});

// GET /api/players/:id
router.get('/:id', async (req: Request, res: Response) => {
  const player = await Player.findById(req.params['id']);
  if (!player) {
    res.status(404).json({ message: 'Player not found' });
    return;
  }
  res.json(player);
});

// POST /api/players (admin)
router.post('/', requireAdmin, upload.single('photo'), async (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  let photo_url = '';
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    photo_url = result.secure_url;
  }

  const player = await Player.create({ name, photo_url });
  res.status(201).json(player);
});

// PUT /api/players/:id (admin)
router.put('/:id', requireAdmin, upload.single('photo'), async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  const update: { name?: string; photo_url?: string } = {};

  if (name) update.name = name;

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    update.photo_url = result.secure_url;
  }

  const player = await Player.findByIdAndUpdate(req.params['id'], update, { new: true });
  if (!player) {
    res.status(404).json({ message: 'Player not found' });
    return;
  }
  res.json(player);
});

// DELETE /api/players/:id (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const player = await Player.findByIdAndDelete(req.params['id']);
  if (!player) {
    res.status(404).json({ message: 'Player not found' });
    return;
  }
  res.json({ message: 'Player deleted' });
});

function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'championship/players', resource_type: 'image' }, (err, result) => {
        if (err || !result) return reject(err);
        resolve(result);
      })
      .end(buffer);
  });
}

export default router;
