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
import type { Location, LocationAlertType, AlertPriority, AlertHistoryEntry } from "@/types";

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
  const editLocationAlert = useStore((s) => s.editLocationAlert);

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

  // History modal
  const [historyTarget, setHistoryTarget] = useState<Location | null>(null);

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
      editLocationAlert(editTarget.id, editType, editPriority, editMessage.trim());
    }
    setEditTarget(null);
  }, [editTarget, editType, editPriority, editMessage, editLocationAlert]);

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

  // ─── Empty state message ───
  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) return "No locations match your search";
    if (filter === "active") return "No active alerts";
    if (filter === "inactive") return "All locations have active alerts";
    return "No locations found";
  }, [filter, searchQuery]);

  const renderLocationRow = useCallback(
    ({ item }: { item: Location }) => {
      const isAlert = item.alertActive;
      const zoneColor = getZoneColor(item.zone);
      return (
        <View style={[styles.row, isAlert && styles.rowActive]}>
          {/* Left accent bar for active rows */}
          {isAlert && <View style={[styles.rowAccent, { backgroundColor: priorityColors[item.alertPriority!] }]} />}

          <View style={[styles.rowBody, isAlert && { paddingLeft: 10 }]}>
            <View style={styles.rowLeft}>
              {/* Name line */}
              <View style={styles.rowNameRow}>
                <View style={[styles.zoneDot, { backgroundColor: zoneColor }, isAlert && { width: 8, height: 8, borderRadius: 4 }]} />
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowZone}>{item.zone}</Text>
              </View>

              {/* Status line */}
              {isAlert ? (
                <View style={styles.statusLine}>
                  <View style={[styles.statusTag, { backgroundColor: priorityColors[item.alertPriority!] + "1A" }]}>
                    <Text style={[styles.statusTagText, { color: priorityColors[item.alertPriority!] }]}>
                      {item.alertPriority}
                    </Text>
                  </View>
                  <Text style={styles.statusSep}>{"\u00B7"}</Text>
                  <Text style={styles.statusType}>{item.alertType}</Text>
                  {item.alertUpdatedAt && (
                    <>
                      <Text style={styles.statusSep}>{"\u00B7"}</Text>
                      <Text style={styles.statusTime}>{timeAgo(item.alertUpdatedAt)}</Text>
                    </>
                  )}
                </View>
              ) : (
                <Text style={styles.rowStatusOff}>Inactive</Text>
              )}
            </View>

            {/* Right controls */}
            <View style={styles.rowRight}>
              {isAlert && (
                <View style={styles.activeBadge}>
                  <View style={styles.activePulse} />
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
              <Switch
                value={isAlert}
                onValueChange={() => handleToggle(item)}
                trackColor={{ false: Colors.border, true: Colors.primary + "55" }}
                thumbColor={isAlert ? Colors.primary : Colors.textTertiary}
                style={styles.rowSwitch}
              />
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.5, backgroundColor: Colors.border }]}
                onPress={() => handleOpenEdit(item)}
                hitSlop={4}
              >
                <Feather name="settings" size={15} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.historyBtn, pressed && { opacity: 0.5, backgroundColor: Colors.border }]}
                onPress={() => setHistoryTarget(item)}
                hitSlop={4}
              >
                <Feather name="clock" size={15} color={Colors.textTertiary} />
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [handleToggle, handleOpenEdit, getZoneColor, timeAgo]
  );

  // ─── Shared modal content builder ───
  const renderAlertForm = (
    type: LocationAlertType,
    setType: (t: LocationAlertType) => void,
    priority: AlertPriority,
    setPriority: (p: AlertPriority) => void,
    message: string,
    setMessage: (m: string) => void,
    target: Location | null,
  ) => (
    <>
      <View style={styles.modalTarget}>
        <View style={[styles.modalTargetDot, { backgroundColor: getZoneColor(target?.zone || "") }]} />
        <Text style={styles.modalTargetText}>{target?.name}</Text>
        <View style={styles.modalTargetZoneBadge}>
          <Text style={styles.modalTargetZoneText}>{target?.zone}</Text>
        </View>
      </View>

      <Text style={styles.modalLabel}>Alert Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {ALERT_TYPE_OPTIONS.map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => {
              setType(t);
              if (!message.trim() || message === DEFAULT_MESSAGES[type])
                setMessage(DEFAULT_MESSAGES[t] || "");
            }}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.modalLabel}>Priority</Text>
      <View style={styles.priorityRow}>
        {PRIORITY_OPTIONS.map((p) => (
          <Pressable
            key={p}
            style={[styles.priorityBtn, priority === p && { borderColor: priorityColors[p], backgroundColor: priorityColors[p] + "14" }]}
            onPress={() => setPriority(p)}
          >
            <View style={[styles.priorityDot, { backgroundColor: priorityColors[p] }]} />
            <Text style={[styles.priorityText, priority === p && { color: priorityColors[p] }]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.modalLabel}>Message</Text>
      <TextInput
        style={styles.messageInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Alert message..."
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </>
  );

  return (
    <View style={styles.container}>
      <Header title="Alert Management" />

      {/* ─── Summary strip ─── */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconWrap}>
            <Feather name="map-pin" size={13} color={Colors.textSecondary} />
          </View>
          <Text style={styles.summaryNum}>{activeLocations.length}</Text>
          <Text style={styles.summaryLabel}>Locations</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIconWrap, activeCount > 0 && { backgroundColor: Colors.primary + "18" }]}>
            <Feather name="zap" size={13} color={activeCount > 0 ? Colors.primary : Colors.textSecondary} />
          </View>
          <Text style={[styles.summaryNum, activeCount > 0 && { color: Colors.primary }]}>
            {activeCount}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconWrap}>
            <Feather name="shield" size={13} color={Colors.textSecondary} />
          </View>
          <Text style={styles.summaryNum}>{activeLocations.length - activeCount}</Text>
          <Text style={styles.summaryLabel}>Clear</Text>
        </View>
      </View>

      {/* ─── Search ─── */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={14} color={Colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search locations or zones..."
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8} style={styles.searchClear}>
            <Feather name="x" size={14} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* ─── Filter tabs ─── */}
      <View style={styles.filterRow}>
        {(["all", "active", "inactive"] as FilterMode[]).map((f) => {
          const count = f === "all" ? activeLocations.length : f === "active" ? activeCount : activeLocations.length - activeCount;
          const isSelected = filter === f;
          return (
            <Pressable
              key={f}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
              </Text>
              <View style={[styles.filterBadge, isSelected && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isSelected && styles.filterBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Text style={styles.resultCount}>{filteredLocations.length} result{filteredLocations.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* ─── Location list ─── */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderLocationRow}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather
                name={filter === "active" ? "zap-off" : filter === "inactive" ? "check-circle" : "search"}
                size={24}
                color={Colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>{emptyMessage}</Text>
            <Text style={styles.emptyHint}>
              {searchQuery.trim() ? "Try a different search term" : "Locations will appear here"}
            </Text>
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
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: Colors.primary + "18" }]}>
                  <Feather name="zap" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Activate Alert</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setActivateTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {renderAlertForm(
              activateType, setActivateType,
              activatePriority, setActivatePriority,
              activateMessage, setActivateMessage,
              activateTarget,
            )}

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
            <View style={[styles.deactivateIconWrap]}>
              <Feather name="power" size={20} color={Colors.amber} />
            </View>
            <Text style={styles.deactivateTitle}>Turn Off Alert</Text>
            <Text style={styles.deactivateMsg}>
              Deactivate the active alert for{" "}
              <Text style={{ fontFamily: "Inter_700Bold", color: Colors.text }}>{deactivateTarget?.name}</Text>?
            </Text>
            {deactivateTarget?.alertType && (
              <View style={styles.deactivateInfo}>
                <Text style={styles.deactivateInfoText}>
                  {deactivateTarget.alertPriority} · {deactivateTarget.alertType}
                </Text>
              </View>
            )}
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
                <Feather name="power" size={14} color="#fff" />
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
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: Colors.surfaceElevated }]}>
                  <Feather name="settings" size={14} color={Colors.textSecondary} />
                </View>
                <Text style={styles.modalTitle}>Alert Settings</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setEditTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {renderAlertForm(
              editType, setEditType,
              editPriority, setEditPriority,
              editMessage, setEditMessage,
              editTarget,
            )}

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.8 }]}
                onPress={() => setEditTarget(null)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtnSave, pressed && { opacity: 0.8 }]}
                onPress={handleSaveEdit}
              >
                <Feather name="check" size={14} color="#fff" />
                <Text style={styles.modalBtnConfirmText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ HISTORY MODAL ═══ */}
      <Modal
        visible={historyTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "75%" }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: Colors.surfaceElevated }]}>
                  <Feather name="clock" size={14} color={Colors.textSecondary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Alert History</Text>
                  <Text style={styles.historySubtitle}>{historyTarget?.name}</Text>
                </View>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setHistoryTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={[...(historyTarget?.alertHistory || [])].reverse()}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: entry }: { item: AlertHistoryEntry }) => {
                const actionColor =
                  entry.action === "activated" ? Colors.primary :
                  entry.action === "edited" ? Colors.info :
                  Colors.textTertiary;
                const actionLabel = entry.action.toUpperCase();
                return (
                  <View style={styles.historyRow}>
                    <View style={[styles.historyDot, { backgroundColor: actionColor }]} />
                    <View style={styles.historyContent}>
                      <View style={styles.historyTopLine}>
                        <View style={[styles.historyActionBadge, { backgroundColor: actionColor + "18" }]}>
                          <Text style={[styles.historyActionText, { color: actionColor }]}>{actionLabel}</Text>
                        </View>
                        {entry.alertType && entry.action !== "deactivated" && (
                          <>
                            <Text style={styles.historySep}>{"\u00B7"}</Text>
                            {entry.priority && (
                              <Text style={[styles.historyPriority, { color: priorityColors[entry.priority] || Colors.textSecondary }]}>
                                {entry.priority}
                              </Text>
                            )}
                            <Text style={styles.historySep}>{"\u00B7"}</Text>
                            <Text style={styles.historyType}>{entry.alertType}</Text>
                          </>
                        )}
                      </View>
                      <View style={styles.historyBottomLine}>
                        <Text style={styles.historyTime}>{timeAgo(entry.timestamp)}</Text>
                        {entry.user && (
                          <Text style={styles.historyUser}>by {entry.user}</Text>
                        )}
                      </View>
                      {entry.message && entry.action !== "deactivated" ? (
                        <Text style={styles.historyMessage} numberOfLines={2}>{entry.message}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.historyEmpty}>
                  <Feather name="inbox" size={24} color={Colors.textTertiary} />
                  <Text style={styles.historyEmptyText}>No history yet</Text>
                  <Text style={styles.historyEmptyHint}>Actions will be recorded here</Text>
                </View>
              }
            />
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
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  summaryNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  // ─── Search ───
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 12, marginTop: 10,
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingLeft: 12, height: 40,
  },
  searchInput: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: Colors.text, paddingVertical: 0, paddingRight: 4, height: 40,
  },
  searchClear: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginRight: 4,
  },

  // ─── Filter ───
  filterRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  filterTab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, height: 32,
    borderRadius: 8, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  filterTabTextActive: { color: "#fff" },
  filterBadge: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center",
  },
  filterBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.textTertiary },
  filterBadgeTextActive: { color: "#fff" },
  resultCount: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  // ─── List ───
  listContent: { paddingHorizontal: 12, gap: 6, paddingTop: 4, paddingBottom: 80 },

  row: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  rowActive: {
    borderColor: Colors.primary + "30",
    backgroundColor: Colors.primary + "06",
  },
  rowAccent: {
    width: 3, borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
  },
  rowBody: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  rowLeft: { flex: 1, gap: 4, marginRight: 10 },
  rowNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  zoneDot: { width: 6, height: 6, borderRadius: 3 },
  rowName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, flexShrink: 1 },
  rowZone: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginLeft: 2 },

  // Status line for active
  statusLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  statusTag: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 },
  statusTagText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  statusSep: { fontSize: 10, color: Colors.textTertiary },
  statusType: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  statusTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  rowStatusOff: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 1 },

  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primary + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  activePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  activeBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: Colors.primary, letterSpacing: 0.6 },
  rowSwitch: { transform: [{ scale: 0.78 }], marginHorizontal: -2 },
  editBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  historyBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },

  // ─── Empty ───
  emptyState: { alignItems: "center", paddingVertical: 56, gap: 8 },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  emptyHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  // ─── Modal shared ───
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 16, gap: 12, paddingBottom: 30,
  },
  modalHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 2 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitleIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  modalTarget: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  modalTargetDot: { width: 8, height: 8, borderRadius: 4 },
  modalTargetText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  modalTargetZoneBadge: {
    backgroundColor: Colors.surface, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  modalTargetZoneText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  modalLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 },

  chipRow: { gap: 6 },
  chip: {
    paddingHorizontal: 12, height: 34, justifyContent: "center",
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  chipTextActive: { color: "#fff" },

  priorityRow: { flexDirection: "row", gap: 6 },
  priorityBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    height: 38, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  priorityDot: { width: 7, height: 7, borderRadius: 3.5 },
  priorityText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },

  messageInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text,
    minHeight: 72, textAlignVertical: "top",
  },

  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalBtnCancel: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  modalBtnCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  modalBtnConfirm: {
    flex: 1, height: 44, borderRadius: 10, flexDirection: "row",
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", gap: 6,
  },
  modalBtnSave: {
    flex: 1, height: 44, borderRadius: 10, flexDirection: "row",
    backgroundColor: Colors.info, alignItems: "center", justifyContent: "center", gap: 6,
  },
  modalBtnConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  // ─── Deactivate confirmation ───
  deactivateOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  deactivateSheet: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 24,
    width: "100%", maxWidth: 340, alignItems: "center", gap: 10,
  },
  deactivateIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.amber + "18",
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  deactivateTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  deactivateMsg: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  deactivateInfo: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  deactivateInfoText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  deactivateBtnRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  deactivateCancelBtn: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  deactivateCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  deactivateConfirmBtn: {
    flex: 1, height: 44, borderRadius: 10, flexDirection: "row",
    backgroundColor: Colors.amber, alignItems: "center", justifyContent: "center", gap: 6,
  },
  deactivateConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  // ─── History modal ───
  historySubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 1 },
  historyList: { gap: 0, paddingBottom: 8 },
  historyRow: {
    flexDirection: "row", gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  historyContent: { flex: 1, gap: 3 },
  historyTopLine: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  historyActionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyActionText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.4 },
  historySep: { fontSize: 10, color: Colors.textTertiary },
  historyPriority: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  historyType: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  historyBottomLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  historyTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  historyUser: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  historyMessage: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  historyEmpty: { alignItems: "center", paddingVertical: 40, gap: 6 },
  historyEmptyText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  historyEmptyHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
});
