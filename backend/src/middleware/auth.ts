import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export type JwtUser = { id: string; email: string }

export function signJwt(user: JwtUser) {
  return jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '7d' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    ;(req as any).user = jwt.verify(token, process.env.JWT_SECRET as string) as JwtUser
    next()
  } catch {
    return res.status(401).json({ error: 'unauthorized' })
  }
}


