import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthPayload {
  sub:   string
  email: string
  tipo:  'aliado' | 'admin'
  rol?:  string
  iat:   number
  exp:   number
}

// Extiende Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      aliado?: AuthPayload   // aliado o admin autenticado
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Acepta tanto aliados como admins
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'Token de acceso requerido' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload
    req.aliado = payload
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ status: 'error', message: 'Token expirado', code: 'TOKEN_EXPIRED' })
    } else {
      res.status(401).json({ status: 'error', message: 'Token inválido' })
    }
  }
}

/** Solo permite admins */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.aliado?.tipo !== 'admin') {
      res.status(403).json({ status: 'error', message: 'Acceso denegado. Se requieren permisos de administrador.' })
      return
    }
    next()
  })
}

/** Solo permite super_admin */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.aliado?.tipo !== 'admin' || req.aliado?.rol !== 'super_admin') {
      res.status(403).json({ status: 'error', message: 'Acceso denegado. Se requiere rol super_admin.' })
      return
    }
    next()
  })
}
