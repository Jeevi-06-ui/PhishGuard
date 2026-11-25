import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { ApiError, apiConfig, createOfflineHealthSnapshot, healthService } from '@/services';
import type { SystemHealthResponse } from '@/types/api';

interface SystemStatusContextValue {
  health: SystemHealthResponse;
  isChecking: boolean;
  isApiConfigured: boolean;
  refreshHealth: () => Promise<SystemHealthResponse>;
}

const SystemStatusContext = createContext<SystemStatusContextValue | undefined>(undefined);

export function SystemStatusProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<SystemHealthResponse>(() => createOfflineHealthSnapshot());
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const refreshHealth = useCallback(async (): Promise<SystemHealthResponse> => {
    if (!apiConfig.isConfigured) {
      const snapshot = createOfflineHealthSnapshot(
        'Backend endpoint not configured yet (Phase 1 frontend mode).'
      );
      setHealth(snapshot);
      return snapshot;
    }

    setIsChecking(true);
    try {
      const data = await healthService.getHealth();
      setHealth(data);
      return data;
    } catch (error) {
      const reason =
        error instanceof ApiError
          ? error.message
          : 'Unable to reach FastAPI backend health endpoint.';
      const snapshot = createOfflineHealthSnapshot(reason);
      setHealth(snapshot);
      return snapshot;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (apiConfig.isConfigured) {
      void refreshHealth();
    }
  }, [refreshHealth]);

  const value = useMemo<SystemStatusContextValue>(
    () => ({
      health,
      isChecking,
      isApiConfigured: apiConfig.isConfigured,
      refreshHealth,
    }),
    [health, isChecking, refreshHealth]
  );

  return <SystemStatusContext.Provider value={value}>{children}</SystemStatusContext.Provider>;
}

export function useSystemStatus(): SystemStatusContextValue {
  const context = useContext(SystemStatusContext);
  if (!context) {
    throw new Error('useSystemStatus must be used within a SystemStatusProvider');
  }
  return context;
}
