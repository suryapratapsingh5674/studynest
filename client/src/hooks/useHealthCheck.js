import { useQuery } from '@tanstack/react-query';
import { getHealthStatus } from '../services/health.api';

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['healthStatus'],
    queryFn: getHealthStatus,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

