import { useQuery, type QueryKey } from "@tanstack/react-query";

export function useNonRefreshingQuery<TData, TError = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  enabled: boolean = true
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

