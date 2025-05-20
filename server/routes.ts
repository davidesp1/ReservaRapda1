import express from "express";
import {
  processPayment,
  getPaymentStatus,
  cancelPayment,
} from "./services/paymentService";
import { register, login, logout, getProfile } from "./controllers/authController";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const router = express.Router();

// Rotas de autenticação
router.post("/api/auth/register", register);
router.post("/api/auth/login", login);
router.post("/api/auth/logout", logout);
router.get("/api/auth/me", getProfile);

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
