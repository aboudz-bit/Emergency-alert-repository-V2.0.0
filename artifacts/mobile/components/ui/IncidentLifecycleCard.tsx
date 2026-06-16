import React from "react";
import { Alert as RNAlert, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { Button } from "./Button";
import type { Alert, IncidentPhase } from "@/types";
import { getIncidentPhase, isHazardCleared, canCloseIncident, PHASE_LABELS } from "@/utils/incident";

const STEPS: IncidentPhase[] = ["hazard_active", "hazard_cleared", "accountability_complete", "closed"];
const STEP_LABEL: Record<string, string> = {
  hazard_active: "Hazard Active",
  hazard_cleared: "Hazard Cleared",
  accountability_complete: "Accountability",
  closed: "Closed",
};

function stepIndex(phase: IncidentPhase | null): number {
  switch (phase) {
    case "draft":
    case "active":
    case "hazard_active": return 0;
    case "hazard_cleared":
    case "accountability_open": return 1;
    case "accountability_complete": return 2;
    case "closed": return 3;
    default: return 0;
  }
}

/**
 * Staged incident lifecycle control. Separates Hazard All Clear from Personnel
 * Accountability and Final Incident Closure.
 */
export function IncidentLifecycleCard({
  alert,
  canManage,
  onDeclareHazardAllClear,
  onCompleteAccountability,
  onCloseIncident,
}: {
  alert: Alert;
  canManage: boolean;
  onDeclareHazardAllClear: () => void;
  onCompleteAccountability: () => void;
  onCloseIncident: (override: boolean) => void;
}) {
  const phase = getIncidentPhase(alert);
  const hazardCleared = isHazardCleared(alert);
  const accountabilityDone = alert.accountabilityComplete === true;
  const closeReady = canCloseIncident(alert);
  const activeIdx = stepIndex(phase);

  const confirmDeclare = () => {
    RNAlert.alert(
      "Declare Hazard All Clear?",
      "This marks the HAZARD as controlled. It does NOT mark personnel safe — accountability stays open until everyone is verified.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Declare All Clear", style: "default", onPress: onDeclareHazardAllClear },
      ],
    );
  };

  const confirmClose = () => {
    if (closeReady) {
      RNAlert.alert("Close Incident?", "Final incident closure. A report will be stored in history.", [
        { text: "Cancel", style: "cancel" },
        { text: "Close Incident", style: "default", onPress: () => onCloseIncident(false) },
      ]);
    } else {
      RNAlert.alert(
        "⚠ Accountability NOT complete",
        "Closing now will override an open personnel accountability. This should only be done by an authorized role. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Override & Close", style: "destructive", onPress: () => onCloseIncident(true) },
        ],
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Feather name="activity" size={16} color={Colors.primary} />
        <Text style={styles.title}>Incident Lifecycle</Text>
        <View style={styles.phasePill}>
          <Text style={styles.phasePillText}>{phase ? PHASE_LABELS[phase] : "—"}</Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((step, i) => {
          const reached = i <= activeIdx;
          return (
            <View key={step} style={styles.step}>
              <View style={[styles.stepDot, reached && styles.stepDotActive]}>
                {reached ? <Feather name="check" size={11} color={Colors.white} /> : <Text style={styles.stepNum}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, reached && styles.stepLabelActive]}>{STEP_LABEL[step]}</Text>
              {i < STEPS.length - 1 && <View style={[styles.stepBar, reached && styles.stepBarActive]} />}
            </View>
          );
        })}
      </View>

      {/* Post-hazard-clear notice */}
      {hazardCleared && !accountabilityDone && (
        <View style={styles.notice}>
          <Feather name="info" size={14} color={Colors.missing} />
          <Text style={styles.noticeText}>Main hazard cleared. Personnel accountability remains open.</Text>
        </View>
      )}

      {/* Live accountability snapshot */}
      <View style={styles.statsRow}>
        <Text style={styles.statChip}>Safe {alert.stats?.confirmed ?? 0}</Text>
        <Text style={[styles.statChip, { color: Colors.missing }]}>Pending {alert.stats?.pending ?? 0}</Text>
        <Text style={[styles.statChip, { color: Colors.destructive }]}>Help {alert.stats?.needHelp ?? 0}</Text>
      </View>

      {/* Actions (manager roles only) */}
      {canManage && phase !== "closed" && (
        <View style={styles.actions}>
          {!hazardCleared && (
            <Button title="Declare Hazard All Clear" icon="shield-off" variant="primary" fullWidth onPress={confirmDeclare} />
          )}
          {hazardCleared && !accountabilityDone && (
            <Button title="Complete Personnel Accountability" icon="check-square" variant="safe" fullWidth onPress={onCompleteAccountability} />
          )}
          {hazardCleared && (
            <Button
              title={closeReady ? "Close Incident" : "Close Incident (Override)"}
              icon="lock"
              variant={closeReady ? "secondary" : "destructive"}
              fullWidth
              onPress={confirmClose}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.textTitle },
  phasePill: { backgroundColor: Colors.primaryDim, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  phasePillText: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  stepper: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  step: { flex: 1, alignItems: "center" },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.borderLight,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", zIndex: 1,
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary },
  stepLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.textTertiary, marginTop: 4, textAlign: "center" },
  stepLabelActive: { color: Colors.textTitle },
  stepBar: { position: "absolute", top: 12, left: "50%", right: "-50%", height: 2, backgroundColor: Colors.border },
  stepBarActive: { backgroundColor: Colors.primary },
  notice: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.missingDim, borderColor: Colors.missingBorder, borderWidth: 1,
    borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  noticeText: { flex: 1, fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.missing },
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  statChip: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.safe },
  actions: { gap: Spacing.sm },
});
