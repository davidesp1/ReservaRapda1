import React, { useState, useEffect } from "react";

export interface CountdownTimerProps {
  expirationDate?: string;
  reference?: string;
  initialMinutes?: number;
  onExpire: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expirationDate,
  reference,
  initialMinutes = 30,
  onExpire,
}) => {
  // Calculamos segundos restantes com base na data de expiração ou minutos iniciais
  const calculateInitialSeconds = () => {
    if (expirationDate) {
      const expDate = new Date(expirationDate);
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    }
    return initialMinutes * 60;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateInitialSeconds());

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div>
      <span>{minutes.toString().padStart(2, "0")}:</span>
      <span>{seconds.toString().padStart(2, "0")}</span>
    </div>
  );
};

export default CountdownTimer;
