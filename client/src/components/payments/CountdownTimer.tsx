import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  initialMinutes: number;
  onExpire: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialMinutes,
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

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
