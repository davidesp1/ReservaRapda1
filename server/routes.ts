import express from "express";
import {
  processPayment,
  getPaymentStatus,
  cancelPayment,
} from "./services/paymentService";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";

const router = express.Router();

// Autenticação
router.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;
    
    // Verificar se usuário ou email já existem
    const existingUser = await db.query.users.findFirst({
      where: ({ username: usernameCol, email: emailCol }) => 
        eq(usernameCol, username) || eq(emailCol, email)
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "Usuário ou email já estão em uso" 
      });
    }
    
    // Hash da senha
    const hashedPassword = await hash(password, 10);
    
    // Inserir novo usuário
    const [newUser] = await db.insert(users).values({
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
    
    res.status(201).json(userWithoutPassword);
  } catch (err: any) {
    console.error("Error in /api/auth/register:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Buscar usuário por email ou username
    const user = email 
      ? await db.query.users.findFirst({ where: eq(users.email, email) })
      : await db.query.users.findFirst({ where: eq(users.username, username) });
    
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    // Verificar senha
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    // Atualizar última data de login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
    
    // Guardar usuário na sessão
    if (req.session) {
      req.session.userId = user.id;
    }
    
    // Não devolver a senha no resultado
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err: any) {
    console.error("Error in /api/auth/login:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/api/auth/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  } else {
    res.json({ message: "Nenhuma sessão ativa" });
  }
});

router.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId)
    });
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Não devolver a senha no resultado
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (err: any) {
    console.error("Error in /api/auth/me:", err);
    res.status(500).json({ message: err.message });
  }
});

// Pagamentos
router.post("/api/payments/process", async (req, res) => {
  try {
    const { method, amount, telemovel } = req.body;
    const result = await processPayment(method, amount, telemovel);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/payments/status/:referencia", async (req, res) => {
  try {
    const { referencia } = req.params;
    const status = await getPaymentStatus(referencia);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/payments/cancel", async (req, res) => {
  try {
    const { referencia } = req.body;
    const result = await cancelPayment(referencia);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
