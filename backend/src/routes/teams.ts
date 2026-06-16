import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import Team from '../models/Team';

const router = Router();

// GET /api/teams?championship_id=xxx
router.get('/', async (req: Request, res: Response) => {
  const { championship_id } = req.query as { championship_id?: string };
  const filter = championship_id ? { championship_id } : {};
  const teams = await Team.find(filter).populate('player_ids', 'name photo_url');
  res.json(teams);
});

// GET /api/teams/:id
router.get('/:id', async (req: Request, res: Response) => {
  const team = await Team.findById(req.params['id']).populate('player_ids', 'name photo_url');
  if (!team) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }
  res.json(team);
});

// POST /api/teams (admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { championship_id, name, color, player_ids } = req.body as {
    championship_id: string;
    name: string;
    color?: string;
    player_ids?: string[];
  };

  if (!championship_id || !name) {
    res.status(400).json({ message: 'championship_id and name are required' });
    return;
  }

  const team = await Team.create({ championship_id, name, color, player_ids: player_ids ?? [] });
  res.status(201).json(team);
});

// PUT /api/teams/:id (admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { name, color, player_ids } = req.body as {
    name?: string;
    color?: string;
    player_ids?: string[];
  };

  const team = await Team.findByIdAndUpdate(
    req.params['id'],
    { name, color, player_ids },
    { new: true }
  ).populate('player_ids', 'name photo_url');

  if (!team) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }
  res.json(team);
});

// DELETE /api/teams/:id (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const team = await Team.findByIdAndDelete(req.params['id']);
  if (!team) {
    res.status(404).json({ message: 'Team not found' });
    return;
  }
  res.json({ message: 'Team deleted' });
});

export default router;
