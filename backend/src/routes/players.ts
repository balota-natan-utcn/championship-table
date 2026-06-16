import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '../middleware/auth';
import Player from '../models/Player';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/players
router.get('/', async (_req: Request, res: Response) => {
  const players = await Player.find().sort({ name: 1 });
  res.json(players);
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
