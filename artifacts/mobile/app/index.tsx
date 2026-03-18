import { Redirect } from "expo-router";

import { useStore } from "@/store";

export default function Index() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const currentUser = useStore((s) => s.currentUser);

  if (!isAuthenticated || !currentUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (currentUser.isECOAssigned && currentUser.ecoAssignmentActive) {
    return <Redirect href="/(eco)" />;
  }

  if (currentUser.isSupervisorAssigned || currentUser.isBackupSupervisorAssigned) {
    return <Redirect href="/(supervisor)" />;
  }

  switch (currentUser.role) {
    case "Super Admin":
      return <Redirect href="/(admin)" />;
    case "IT":
      return <Redirect href="/(it)" />;
    default:
      return <Redirect href="/(user)" />;
  }
}
