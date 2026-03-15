import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { store, User, Alert, UserStatus } from "@/lib/mock-data";

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      await delay(400);
      return store.users;
    }
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      await delay(300);
      return store.alerts;
    }
  });
}

export function useActiveAlert() {
  return useQuery({
    queryKey: ['active-alert'],
    queryFn: async () => {
      await delay(200);
      return store.alerts.find(a => a.isActive) || null;
    }
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: UserStatus }) => {
      await delay(500);
      const userIndex = store.users.findIndex(u => u.id === id);
      if (userIndex > -1) {
        store.users[userIndex].status = status;
        store.users[userIndex].lastActivity = new Date().toISOString();
        
        // Recalculate active alert stats
        const activeAlert = store.alerts.find(a => a.isActive);
        if (activeAlert) {
          activeAlert.stats = {
            confirmed: store.users.filter(u => u.status === 'confirmed').length,
            missing: store.users.filter(u => u.status === 'missing').length,
            noReply: store.users.filter(u => u.status === 'no_reply').length,
            needHelp: store.users.filter(u => u.status === 'need_help').length,
            total: store.users.length
          };
        }
      }
      return store.users[userIndex];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['active-alert'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
}

export function useSendAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAlert: Omit<Alert, 'id' | 'stats' | 'isActive'>) => {
      await delay(800);
      // Deactivate current
      store.alerts.forEach(a => a.isActive = false);
      // Reset all user statuses to no_reply
      store.users.forEach(u => u.status = 'no_reply');
      
      const alert: Alert = {
        ...newAlert,
        id: Date.now(),
        isActive: true,
        stats: { confirmed: 0, missing: 0, noReply: store.users.length, needHelp: 0, total: store.users.length }
      };
      store.alerts.unshift(alert);
      return alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['active-alert'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useSendAllClear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await delay(600);
      store.alerts.forEach(a => a.isActive = false);
      
      const alert: Alert = {
        id: Date.now(),
        type: 'All Clear',
        zone: 'Both',
        title: 'ALL CLEAR',
        message: 'The emergency condition has been resolved. Return to normal operations.',
        timestamp: new Date().toISOString(),
        sentBy: 'System Auto',
        isActive: false,
        stats: { confirmed: store.users.length, missing: 0, noReply: 0, needHelp: 0, total: store.users.length }
      };
      store.alerts.unshift(alert);
      
      store.users.forEach(u => u.status = 'confirmed');
      return alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['active-alert'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
