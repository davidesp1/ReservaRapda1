import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware para validar requisições com Zod
 * @param schema Esquema Zod para validação
 */
export function validate(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Erro de validação',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        res.status(500).json({
          message: 'Erro interno do servidor'
        });
      }
    }
  };
}