'use client';

import React from 'react';
import { useAuthListener } from '@/hooks/useAuthListener';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize the auth listener on the client
  useAuthListener();

  return <>{children}</>;
}
