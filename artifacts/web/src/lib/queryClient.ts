import { QueryClient } from "@tanstack/react-query";

// Server state is the source of truth on web (Phase 3.2 wires the generated
// @workspace/api-client-react hooks). Polling cadence is the v1 realtime story.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
