import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statusApi } from '../api/status-api';
import {
  ApplicationStatusDTO,
  CreateStatusInput,
  UpdateStatusInput,
  ReorderStatusesInput,
} from '@tracker/types';

export function useApplicationStatuses() {
  return useQuery<ApplicationStatusDTO[]>({
    queryKey: ['statuses'],
    queryFn: () => statusApi.getStatuses(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStatusInput) => statusApi.createStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStatusInput }) =>
      statusApi.updateStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useReorderStatusesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderStatusesInput) => statusApi.reorderStatuses(input),
    onMutate: async (newOrderInput) => {
      await queryClient.cancelQueries({ queryKey: ['statuses'] });
      const previousStatuses = queryClient.getQueryData<ApplicationStatusDTO[]>(['statuses']);

      if (previousStatuses) {
        const idToIndex = new Map(newOrderInput.statusIds.map((id, index) => [id, index]));
        const updated = previousStatuses.map((s) => ({
          ...s,
          order: idToIndex.has(s.id) ? idToIndex.get(s.id)! : s.order,
        }));
        updated.sort((a, b) => {
          if (a.order === null) return 1;
          if (b.order === null) return -1;
          return (a.order ?? 0) - (b.order ?? 0);
        });
        queryClient.setQueryData(['statuses'], updated);
      }

      return { previousStatuses };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(['statuses'], context.previousStatuses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => statusApi.deleteStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
