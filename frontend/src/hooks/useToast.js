import { useState, useCallback } from 'react';

/**
 * Custom hook to manage toast notifications with automatic dismissal.
 */
export function useToast() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimer, setToastTimer] = useState(null);

  const showToast = useCallback((msg, duration = 3000) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage('');
    }, duration);
    setToastTimer(timer);
  }, [toastTimer]);

  const hideToast = useCallback(() => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage('');
  }, [toastTimer]);

  return {
    toastMessage,
    showToast,
    hideToast,
  };
}

export default useToast;
