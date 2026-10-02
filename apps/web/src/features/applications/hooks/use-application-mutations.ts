import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '../api/application-api';
import { ApplicationStatus, ApplicationDTO, ApiListResponse } from '@tracker/types';

export function useApplicationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationApi.updateStatus(id, status),

    // Optimistic Update
    onMutate: async ({ id, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['applications'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });
      await queryClient.cancelQueries({ queryKey: ['application', id] });

      const previousApplications = queryClient.getQueryData<ApiListResponse<ApplicationDTO>>(['applications']);

      // Optimistically update list
      queryClient.setQueriesData<ApiListResponse<ApplicationDTO>>(
        { queryKey: ['applications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((app) => (app.id === id ? { ...app, status } : app)),
          };
        }
      );

      return { previousApplications };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications'], context.previousApplications);
      }
    },

    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
  });
}
