import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listApiKeys, createApiKey, revokeApiKey } from '../services/mcp.api';

export const useMcpKeys = () => {
  return useQuery({
    queryKey: ['mcpKeys'],
    queryFn: listApiKeys,
  });
};

export const useCreateMcpKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name) => createApiKey(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpKeys'] });
    },
  });
};

export const useRevokeMcpKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpKeys'] });
    },
  });
};

