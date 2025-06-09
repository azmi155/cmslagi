import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.role === role || req.session?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
  };
}
