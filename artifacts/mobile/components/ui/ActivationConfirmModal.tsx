import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "./Button";
import { DrillBanner } from "./DrillBanner";
import { safeHaptic } from "@/utils/haptics";

export interface ActivationPreview {
  typeLabel: string;
  severity: string;        // 'High' | 'Medium' | 'Low'
  zones: string[];
  locations?: string[];
  recipientCount: number;
  isDrill: boolean;
  message?: string;
}

const HOLD_MS = 3000;

/**
 * Pre-activation safety: shows recipient/zone preview and requires explicit
 * confirmation. For real HIGH-severity alerts, requires a 3-second hold-to-send.
 * Drills are clearly labelled and use a normal confirm (kept quick for dev/testing).
 */
export function ActivationConfirmModal({
  visible,
  preview,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  preview: ActivationPreview | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }, []);

  React.useEffect(() => () => clearTimer(), [clearTimer]);
  React.useEffect(() => { if (!visible) { clearTimer(); setProgress(0); } }, [visible, clearTimer]);

  if (!preview) return null;

  const requiresHold = preview.severity === "High" && !preview.isDrill;

  const fire = () => {
    clearTimer();
    setProgress(0);
    safeHaptic(preview.isDrill ? "medium" : "heavy");
    onConfirm();
  };

  const startHold = () => {
    safeHaptic("light");
    const startedAt = Date.now();
    clearTimer();
    timer.current = setInterval(() => {
      const pct = Math.min(1, (Date.now() - startedAt) / HOLD_MS);
      setProgress(pct);
      if (pct >= 1) fire();
    }, 40);
  };
  const cancelHold = () => { clearTimer(); setProgress(0); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {preview.isDrill ? (
            <DrillBanner />
          ) : (
            <View style={styles.realHeader}>
              <Feather name="alert-triangle" size={18} color={Colors.destructive} />
              <Text style={styles.realHeaderText}>REAL EMERGENCY ACTIVATION</Text>
            </View>
          )}

          <Text style={styles.title}>Review &amp; Activate</Text>

          <View style={styles.rows}>
            <Row label="Type" value={preview.typeLabel} />
            <Row label="Severity" value={preview.severity} valueColor={preview.severity === "High" ? Colors.destructive : Colors.text} />
            <Row label="Zones" value={preview.zones.length ? preview.zones.join(", ") : "All Zones"} />
            {preview.locations && preview.locations.length > 0 && (
              <Row label="Locations" value={preview.locations.join(", ")} />
            )}
            <Row label="Recipients" value={`~${preview.recipientCount} personnel`} />
          </View>

          {preview.message ? <Text style={styles.message} numberOfLines={3}>{preview.message}</Text> : null}

          {requiresHold ? (
            <View>
              <Pressable
                onPressIn={startHold}
                onPressOut={cancelHold}
                style={styles.holdBtn}
              >
                <View style={[styles.holdFill, { width: `${Math.round(progress * 100)}%` }]} />
                <View style={styles.holdContent}>
                  <Feather name="alert-octagon" size={16} color={Colors.white} />
                  <Text style={styles.holdText}>
                    {progress > 0 ? "Keep holding…" : "Hold 3s to Activate"}
                  </Text>
                </View>
              </Pressable>
              <Text style={styles.holdHint}>Press and hold for 3 seconds to send a high-severity real alert.</Text>
            </View>
          ) : (
            <Button
              title={preview.isDrill ? "Confirm Drill Activation" : "Confirm Activate Alert"}
              icon="bell"
              variant={preview.isDrill ? "primary" : "destructive"}
              fullWidth
              onPress={fire}
            />
          )}

          <Button title="Cancel" variant="ghost" fullWidth onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: Spacing.lg },
  sheet: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  realHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    backgroundColor: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.20)", borderWidth: 1,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.sm,
  },
  realHeaderText: { fontSize: FontSize.sm, fontFamily: "Inter_700Bold", color: Colors.destructive, letterSpacing: 0.5 },
  title: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.textTitle },
  rows: { gap: Spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.md },
  rowLabel: { fontSize: FontSize.sm, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  rowValue: { flex: 1, textAlign: "right", fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.text },
  message: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary, fontStyle: "italic" },
  holdBtn: {
    height: 52, borderRadius: BorderRadius.md, backgroundColor: Colors.destructive,
    overflow: "hidden", justifyContent: "center",
  },
  holdFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)" },
  holdContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  holdText: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.white },
  holdHint: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary, textAlign: "center", marginTop: 4 },
});
