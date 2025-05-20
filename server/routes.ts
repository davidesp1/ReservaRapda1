import express from "express";
import {
  processPayment,
  getPaymentStatus,
  cancelPayment,
} from "./services/paymentService";

const router = express.Router();

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
