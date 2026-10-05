import type { Response } from 'express';

export function respondWithFailure(res: Response, label: string, error: unknown): void {
  console.error(`commerce-server: ${label}`, error);
  res.status(500).json({ error: label });
}
