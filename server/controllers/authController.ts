import { Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { db } from "../db";
import * as schema from "../../shared/schema";
import { eq } from "drizzle-orm";

// Registro de novo usuário
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;
    
    // Verificar se usuário ou email já existem
    const existingUser = await db.query.users.findFirst({
      where: (users) => 
        eq(users.username, username) || eq(users.email, email)
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "Usuário ou email já estão em uso" 
      });
    }
    
    // Hash da senha
    const hashedPassword = await hash(password, 10);
    
    // Inserir novo usuário
    const [newUser] = await db.insert(schema.users).values({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'customer'
    }).returning();
    
    // Não devolver a senha no resultado
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Guardar usuário na sessão
    if (req.session) {
      req.session.userId = newUser.id;
    }
    
    res.status(201).json(userWithoutPassword);
  } catch (err: any) {
    console.error("Error in register:", err);
    res.status(500).json({ message: err.message });
  }
};

// Login de usuário
export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    
    // Buscar usuário por email ou username
    const user = email 
      ? await db.query.users.findFirst({ 
          where: (users) => eq(users.email, email) 
        })
      : await db.query.users.findFirst({ 
          where: (users) => eq(users.username, username) 
        });
    
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    // Verificar senha
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    // Atualizar última data de login
    await db.update(schema.users)
      .set({ lastLogin: new Date() })
      .where(eq(schema.users.id, user.id));
    
    // Guardar usuário na sessão
    if (req.session) {
      req.session.userId = user.id;
    }
    
    // Não devolver a senha no resultado
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err: any) {
    console.error("Error in login:", err);
    res.status(500).json({ message: err.message });
  }
};

// Logout de usuário
export const logout = async (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  } else {
    res.json({ message: "Nenhuma sessão ativa" });
  }
};

// Perfil do usuário autenticado
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const user = await db.query.users.findFirst({
      where: (users) => eq(users.id, Number(req.session.userId))
    });
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    // Não devolver a senha no resultado
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err: any) {
    console.error("Error in getProfile:", err);
    res.status(500).json({ message: err.message });
  }
};