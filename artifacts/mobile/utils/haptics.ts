// Safe haptics wrapper — no-ops on platforms/web where haptics are unavailable.
import * as Haptics from "expo-haptics";

type Kind = "light" | "medium" | "heavy" | "warning" | "success" | "error";

export function safeHaptic(kind: Kind): void {
  try {
    switch (kind) {
      case "warning": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
      case "success": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case "error": Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
      case "heavy": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case "medium": Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      default: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    }
  } catch {
    // ignore — haptics not supported here
  }
}
