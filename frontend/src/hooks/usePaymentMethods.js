import { useState, useCallback } from 'react';

const STORAGE_KEY = 'reservas_payment_methods';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState(load);

  const persist = useCallback((updated) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMethods(updated);
  }, []);

  const addMethod = useCallback((method) => {
    // Never persist the full card number or CVV
    const { fullNumber, cvv, ...safe } = method;
    persist([...load(), { ...safe, id: Date.now() }]);
  }, [persist]);

  const removeMethod = useCallback((id) => {
    persist(load().filter((m) => m.id !== id));
  }, [persist]);

  return { methods, addMethod, removeMethod };
}
