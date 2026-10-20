import { useEffect, useState } from 'react';

// Fecha/hora actual que se refresca cada segundo
const useClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
};

export default useClock;
