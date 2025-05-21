import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const zodMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      console.error('Erro de validação:', error);
      res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: (error as any).errors || error
      });
    }
  };
};