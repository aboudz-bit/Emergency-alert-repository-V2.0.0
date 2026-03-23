import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

export default function ECOAlertsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const alerts = useStore((s) => s.alerts) ?? [];
  const zones = useStore((s) => s.zones) ?? [];

  const zoneName = currentUser?.ecoZoneName ?? "CPF";

  const zoneAlerts = useMemo(
    () => alerts.filter((a) => a.zone === zoneName || a.zone === "All Zones"),
    [alerts, zoneName]
  );

  const activeAlerts = useMemo(() => zoneAlerts.filter((a) => a.isActive), [zoneAlerts]);
  const closedAlerts = useMemo(() => zoneAlerts.filter((a) => !a.isActive), [zoneAlerts]);

  const zone = useMemo(() => zones.find((z) => z.name === zoneName), [zones, zoneName]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return Colors.primary;
      case "Medium": return Colors.amber;
      default: return Colors.info;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Zone Alerts"
        subtitle={`${zoneName} Zone • ECO ${currentUser?.ecoSlot ?? ""}`}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {zone?.alertActive && (
          <View style={styles.zoneBanner}>
            <Feather name="alert-octagon" size={18} color={Colors.primary} />
            <View style={styles.zoneBannerText}>
              <Text style={styles.zoneBannerTitle}>Zone Alert Active</Text>
              <Text style={styles.zoneBannerMsg}>{zone.alertType} — {zone.alertMessage || "Active alert in zone"}</Text>
            </View>
          </View>
        )}

        {activeAlerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active ({activeAlerts.length})</Text>
            {activeAlerts.map((alert) => (
              <Card key={alert.id} elevated style={[styles.alertCard, { borderColor: getPriorityColor(alert.priority) + "40" }]}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertHeaderLeft}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(alert.priority) }]} />
                    <Text style={styles.alertType}>{alert.type}</Text>
                  </View>
                  <StatusBadge status="active" label={alert.priority} />
                </View>
                <Text style={styles.alertTitleText}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertMetaText}>
                    <Feather name="clock" size={11} color={Colors.textTertiary} /> {format(new Date(alert.timestamp), "MMM d, h:mm a")}
                  </Text>
                  <Text style={styles.alertMetaText}>Zone: {alert.zone}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Text style={[styles.statValue, { color: Colors.safe }]}>{alert.stats.confirmed}</Text>
                    <Text style={styles.statLabel}>Safe</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={[styles.statValue, { color: Colors.noreply }]}>{alert.stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  {alert.stats.needHelp > 0 && (
                    <View style={styles.statChip}>
                      <Text style={[styles.statValue, { color: Colors.primary }]}>{alert.stats.needHelp}</Text>
                      <Text style={styles.statLabel}>Help</Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </>
        )}

        {closedAlerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>History ({closedAlerts.length})</Text>
            {closedAlerts.map((alert) => (
              <Card key={alert.id} style={styles.closedCard}>
                <View style={styles.alertHeader}>
                  <Text style={styles.closedType}>{alert.type}</Text>
                  <Text style={styles.closedDate}>{format(new Date(alert.timestamp), "MMM d, yyyy")}</Text>
                </View>
                <Text style={styles.closedTitle}>{alert.title}</Text>
                <Text style={styles.alertMetaText}>
                  Response: {alert.stats.confirmed}/{alert.stats.total} confirmed
                </Text>
              </Card>
            ))}
          </>
        )}

        {zoneAlerts.length === 0 && (
          <View style={styles.emptyWrap}>
            <Feather name="check-circle" size={48} color={Colors.safe} />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>No alerts for {zoneName} zone.</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  zoneBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm,
    backgroundColor: Colors.primaryDim, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.primaryBorder, padding: Spacing.md,
  },
  zoneBannerText: { flex: 1 },
  zoneBannerTitle: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  zoneBannerMsg: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text, marginTop: Spacing.sm },
  alertCard: { borderWidth: 1, gap: Spacing.sm },
  alertHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  alertHeaderLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  alertType: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  alertTitleText: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  alertMessage: { fontSize: FontSize.sm, color: Colors.textSecondary },
  alertMeta: { flexDirection: "row", justifyContent: "space-between" },
  alertMetaText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  statsRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.xs },
  statChip: { alignItems: "center" },
  statValue: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  closedCard: { gap: Spacing.xs },
  closedType: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  closedDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
  closedTitle: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyWrap: { alignItems: "center", paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontFamily: "Inter_700Bold", color: Colors.safe },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
