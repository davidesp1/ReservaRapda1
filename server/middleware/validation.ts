import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Middleware para validar o corpo da requisição usando um schema Zod
export const validateBody = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Dados de entrada inválidos',
          errors: error.errors
        });
      }
      return res.status(500).json({
        message: 'Erro interno do servidor durante validação'
      });
    }
  };
};