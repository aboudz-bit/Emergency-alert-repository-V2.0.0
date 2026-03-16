import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "@/components/ui/Header";
import { Colors, FontSize, DEFAULT_MESSAGES } from "@/constants/theme";
import { useStore } from "@/store";
import type { Location, LocationAlertType, AlertPriority } from "@/types";

const ALERT_TYPE_OPTIONS: LocationAlertType[] = [
  "Blackout",
  "Security Alert",
  "Shelter-in",
  "Drill",
  "Restricted Movement",
  "Custom",
];

const PRIORITY_OPTIONS: AlertPriority[] = ["High", "Medium", "Low"];

const priorityColors: Record<AlertPriority, string> = {
  High: Colors.primary,
  Medium: Colors.amber,
  Low: Colors.info,
};

type FilterMode = "all" | "active" | "inactive";

export default function AlertManagementScreen() {
  const locations = useStore((s) => s.locations);
  const zones = useStore((s) => s.zones);
  const activateLocationAlert = useStore((s) => s.activateLocationAlert);
  const deactivateLocationAlert = useStore((s) => s.deactivateLocationAlert);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Activate modal
  const [activateTarget, setActivateTarget] = useState<Location | null>(null);
  const [activateType, setActivateType] = useState<LocationAlertType>("Blackout");
  const [activatePriority, setActivatePriority] = useState<AlertPriority>("High");
  const [activateMessage, setActivateMessage] = useState("");

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<Location | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [editType, setEditType] = useState<LocationAlertType>("Blackout");
  const [editPriority, setEditPriority] = useState<AlertPriority>("High");
  const [editMessage, setEditMessage] = useState("");

  const activeLocations = useMemo(
    () => locations.filter((l) => l.isActive),
    [locations]
  );

  const filteredLocations = useMemo(() => {
    let result = activeLocations;
    if (filter === "active") result = result.filter((l) => l.alertActive);
    if (filter === "inactive") result = result.filter((l) => !l.alertActive);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(q) || l.zone.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeLocations, filter, searchQuery]);

  const activeCount = useMemo(
    () => activeLocations.filter((l) => l.alertActive).length,
    [activeLocations]
  );

  // ─── Toggle handler ───
  const handleToggle = useCallback(
    (loc: Location) => {
      if (loc.alertActive) {
        setDeactivateTarget(loc);
      } else {
        setActivateType("Blackout");
        setActivatePriority("High");
        setActivateMessage(DEFAULT_MESSAGES["Blackout"] || "");
        setActivateTarget(loc);
      }
    },
    []
  );

  // ─── Activate confirm ───
  const handleConfirmActivate = useCallback(() => {
    if (!activateTarget) return;
    activateLocationAlert(
      activateTarget.id,
      activateType,
      activatePriority,
      activateMessage.trim()
    );
    setActivateTarget(null);
  }, [activateTarget, activateType, activatePriority, activateMessage, activateLocationAlert]);

  // ─── Deactivate confirm ───
  const handleConfirmDeactivate = useCallback(() => {
    if (!deactivateTarget) return;
    deactivateLocationAlert(deactivateTarget.id);
    setDeactivateTarget(null);
  }, [deactivateTarget, deactivateLocationAlert]);

  // ─── Edit flow ───
  const handleOpenEdit = useCallback((loc: Location) => {
    setEditType(loc.alertType || "Blackout");
    setEditPriority(loc.alertPriority || "High");
    setEditMessage(loc.alertMessage || "");
    setEditTarget(loc);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editTarget) return;
    if (editTarget.alertActive) {
      activateLocationAlert(editTarget.id, editType, editPriority, editMessage.trim());
    }
    setEditTarget(null);
  }, [editTarget, editType, editPriority, editMessage, activateLocationAlert]);

  // ─── Time ago helper ───
  const timeAgo = useCallback((iso: string | null) => {
    if (!iso) return "";
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }, []);

  const getZoneColor = useCallback(
    (zoneName: string) => {
      const z = zones.find((z) => z.name === zoneName);
      return z?.color || Colors.textTertiary;
    },
    [zones]
  );

  const renderLocationRow = useCallback(
    ({ item }: { item: Location }) => {
      const isAlert = item.alertActive;
      return (
        <View style={[styles.row, isAlert && styles.rowActive]}>
          <View style={styles.rowLeft}>
            <View style={styles.rowNameRow}>
              <View style={[styles.zoneDot, { backgroundColor: getZoneColor(item.zone) }]} />
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
            </View>
            {isAlert ? (
              <Text style={styles.rowStatus} numberOfLines={1}>
                <Text style={{ color: priorityColors[item.alertPriority!] }}>
                  {item.alertPriority}
                </Text>
                {" · "}
                {item.alertType}
                {item.alertUpdatedAt ? ` · ${timeAgo(item.alertUpdatedAt)}` : ""}
              </Text>
            ) : (
              <Text style={styles.rowStatusOff}>Inactive</Text>
            )}
          </View>

          <View style={styles.rowRight}>
            {isAlert && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
            <Switch
              value={isAlert}
              onValueChange={() => handleToggle(item)}
              trackColor={{ false: Colors.border, true: Colors.primary + "60" }}
              thumbColor={isAlert ? Colors.primary : Colors.textSecondary}
              style={styles.rowSwitch}
            />
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
              onPress={() => handleOpenEdit(item)}
              hitSlop={6}
            >
              <Feather name="settings" size={14} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      );
    },
    [handleToggle, handleOpenEdit, getZoneColor, timeAgo]
  );

  return (
    <View style={styles.container}>
      <Header title="Alert Management" />

      {/* ─── Summary strip ─── */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{activeLocations.length}</Text>
          <Text style={styles.summaryLabel}>Locations</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, activeCount > 0 && { color: Colors.primary }]}>
            {activeCount}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{activeLocations.length - activeCount}</Text>
          <Text style={styles.summaryLabel}>Inactive</Text>
        </View>
      </View>

      {/* ─── Search ─── */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={14} color={Colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search locations..."
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      {/* ─── Filter tabs ─── */}
      <View style={styles.filterRow}>
        {(["all", "active", "inactive"] as FilterMode[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={styles.filterCount}>{filteredLocations.length}</Text>
      </View>

      {/* ─── Location list ─── */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderLocationRow}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="radio" size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No locations found</Text>
          </View>
        }
      />

      {/* ═══ ACTIVATE MODAL ═══ */}
      <Modal
        visible={activateTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivateTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activate Alert</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setActivateTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalTarget}>
              <Feather name="map-pin" size={12} color={Colors.textSecondary} />
              <Text style={styles.modalTargetText}>{activateTarget?.name}</Text>
              <Text style={styles.modalTargetZone}>{activateTarget?.zone}</Text>
            </View>

            <Text style={styles.modalLabel}>Alert Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {ALERT_TYPE_OPTIONS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, activateType === t && styles.chipActive]}
                  onPress={() => {
                    setActivateType(t);
                    setActivateMessage(DEFAULT_MESSAGES[t] || "");
                  }}
                >
                  <Text style={[styles.chipText, activateType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITY_OPTIONS.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.priorityBtn, activatePriority === p && { borderColor: priorityColors[p], backgroundColor: priorityColors[p] + "18" }]}
                  onPress={() => setActivatePriority(p)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: priorityColors[p] }]} />
                  <Text style={[styles.priorityText, activatePriority === p && { color: priorityColors[p] }]}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              value={activateMessage}
              onChangeText={setActivateMessage}
              placeholder="Alert message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.8 }]}
                onPress={() => setActivateTarget(null)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtnConfirm, pressed && { opacity: 0.8 }]}
                onPress={handleConfirmActivate}
              >
                <Feather name="zap" size={14} color="#fff" />
                <Text style={styles.modalBtnConfirmText}>Activate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ DEACTIVATE CONFIRMATION ═══ */}
      <Modal
        visible={deactivateTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeactivateTarget(null)}
      >
        <View style={styles.deactivateOverlay}>
          <View style={styles.deactivateSheet}>
            <Feather name="alert-circle" size={24} color={Colors.amber} />
            <Text style={styles.deactivateTitle}>Turn Off Alert</Text>
            <Text style={styles.deactivateMsg}>
              Deactivate the active alert for{" "}
              <Text style={{ fontFamily: "Inter_700Bold" }}>{deactivateTarget?.name}</Text>?
            </Text>
            <View style={styles.deactivateBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.deactivateCancelBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setDeactivateTarget(null)}
              >
                <Text style={styles.deactivateCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.deactivateConfirmBtn, pressed && { opacity: 0.8 }]}
                onPress={handleConfirmDeactivate}
              >
                <Text style={styles.deactivateConfirmText}>Turn Off</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ EDIT MODAL ═══ */}
      <Modal
        visible={editTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Alert Settings</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setEditTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalTarget}>
              <Feather name="map-pin" size={12} color={Colors.textSecondary} />
              <Text style={styles.modalTargetText}>{editTarget?.name}</Text>
              <Text style={styles.modalTargetZone}>{editTarget?.zone}</Text>
            </View>

            <Text style={styles.modalLabel}>Alert Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {ALERT_TYPE_OPTIONS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, editType === t && styles.chipActive]}
                  onPress={() => {
                    setEditType(t);
                    if (!editMessage.trim()) setEditMessage(DEFAULT_MESSAGES[t] || "");
                  }}
                >
                  <Text style={[styles.chipText, editType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITY_OPTIONS.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.priorityBtn, editPriority === p && { borderColor: priorityColors[p], backgroundColor: priorityColors[p] + "18" }]}
                  onPress={() => setEditPriority(p)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: priorityColors[p] }]} />
                  <Text style={[styles.priorityText, editPriority === p && { color: priorityColors[p] }]}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              value={editMessage}
              onChangeText={setEditMessage}
              placeholder="Alert message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.8 }]}
                onPress={() => setEditTarget(null)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtnConfirm, pressed && { opacity: 0.8 }]}
                onPress={handleSaveEdit}
              >
                <Feather name="check" size={14} color="#fff" />
                <Text style={styles.modalBtnConfirmText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ─── Summary ───
  summaryStrip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  // ─── Search ───
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 12, marginTop: 8,
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingLeft: 12, height: 38,
  },
  searchInput: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.text, paddingVertical: 0, paddingRight: 12, height: 38,
  },

  // ─── Filter ───
  filterRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 12, height: 30, justifyContent: "center",
    borderRadius: 8, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  filterTabTextActive: { color: "#fff" },
  filterCount: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary },

  // ─── List ───
  listContent: { paddingHorizontal: 12, gap: 6, paddingTop: 4, paddingBottom: 80 },

  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  rowActive: {
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primary + "08",
  },
  rowLeft: { flex: 1, gap: 3, marginRight: 8 },
  rowNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  zoneDot: { width: 6, height: 6, borderRadius: 3 },
  rowName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, flexShrink: 1 },
  rowStatus: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  rowStatusOff: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primary + "18", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },
  activeBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: Colors.primary, letterSpacing: 0.5 },
  rowSwitch: { transform: [{ scale: 0.8 }] },
  editBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },

  // ─── Empty ───
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },

  // ─── Modal shared ───
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 16, gap: 10, paddingBottom: 28,
  },
  modalHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  modalTarget: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  modalTargetText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  modalTargetZone: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  modalLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },

  chipRow: { gap: 6 },
  chip: {
    paddingHorizontal: 12, height: 32, justifyContent: "center",
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  chipTextActive: { color: "#fff" },

  priorityRow: { flexDirection: "row", gap: 6 },
  priorityBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    height: 36, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },

  messageInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text,
    minHeight: 72, textAlignVertical: "top",
  },

  modalBtnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  modalBtnCancel: {
    flex: 1, height: 42, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  modalBtnCancelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  modalBtnConfirm: {
    flex: 1, height: 42, borderRadius: 10, flexDirection: "row",
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", gap: 6,
  },
  modalBtnConfirmText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  // ─── Deactivate confirmation ───
  deactivateOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  deactivateSheet: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 20,
    width: "100%", maxWidth: 340, alignItems: "center", gap: 10,
  },
  deactivateTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  deactivateMsg: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  deactivateBtnRow: { flexDirection: "row", gap: 8, width: "100%", marginTop: 6 },
  deactivateCancelBtn: {
    flex: 1, height: 40, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  deactivateCancelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  deactivateConfirmBtn: {
    flex: 1, height: 40, borderRadius: 10,
    backgroundColor: Colors.amber, alignItems: "center", justifyContent: "center",
  },
  deactivateConfirmText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});
