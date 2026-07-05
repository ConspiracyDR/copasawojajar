'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  durationMs?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type,
  durationMs = 3000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  useEffect(() => {
    if (!visible) {
      const fadeTimer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(fadeTimer);
    }
  }, [visible, onClose]);

  const bgColor = type === 'success'
    ? 'bg-green-600'
    : 'bg-red-600';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transform transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`${bgColor} rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg`}
      >
        {message}
      </div>
    </div>
  );
}
