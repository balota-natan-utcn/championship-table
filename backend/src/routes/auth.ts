import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body as { password: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Invalid password' });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  res.json({ token });
});

export default router;
