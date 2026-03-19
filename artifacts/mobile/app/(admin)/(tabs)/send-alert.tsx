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
import { Colors, DEFAULT_MESSAGES } from "@/constants/theme";
import { useStore } from "@/store";
import type { Zone, Location, LocationAlertType, AlertPriority, ZoneAlertHistoryEntry } from "@/types";

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
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const users = useStore((s) => s.users);
  const activateZoneAlert = useStore((s) => s.activateZoneAlert);
  const deactivateZoneAlert = useStore((s) => s.deactivateZoneAlert);
  const editZoneAlert = useStore((s) => s.editZoneAlert);
  const bulkActivateZoneAlerts = useStore((s) => s.bulkActivateZoneAlerts);
  const bulkDeactivateZoneAlerts = useStore((s) => s.bulkDeactivateZoneAlerts);
  const sendZoneNotification = useStore((s) => s.sendZoneNotification);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-select mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<number>>(new Set());

  // Bulk activate modal
  const [bulkActivateVisible, setBulkActivateVisible] = useState(false);
  const [bulkType, setBulkType] = useState<LocationAlertType>("Blackout");
  const [bulkPriority, setBulkPriority] = useState<AlertPriority>("High");
  const [bulkMessage, setBulkMessage] = useState("");

  // Activate modal
  const [activateTarget, setActivateTarget] = useState<Zone | null>(null);
  const [activateType, setActivateType] = useState<LocationAlertType>("Blackout");
  const [activatePriority, setActivatePriority] = useState<AlertPriority>("High");
  const [activateMessage, setActivateMessage] = useState("");

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<Zone | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Zone | null>(null);
  const [editType, setEditType] = useState<LocationAlertType>("Blackout");
  const [editPriority, setEditPriority] = useState<AlertPriority>("High");
  const [editMessage, setEditMessage] = useState("");

  // History modal
  const [historyTarget, setHistoryTarget] = useState<Zone | null>(null);

  // Details modal (locations inside a zone)
  const [detailsTarget, setDetailsTarget] = useState<Zone | null>(null);

  // Zone actions menu
  const [menuTarget, setMenuTarget] = useState<Zone | null>(null);

  // Notification modal
  const [notifyTarget, setNotifyTarget] = useState<Zone | null>(null);
  const [notifyMessage, setNotifyMessage] = useState("");

  // ─── Derived counts ───
  const zoneStats = useMemo(() => {
    const map = new Map<number, { locationCount: number; userCount: number }>();
    for (const z of zones) {
      const zoneLocs = locations.filter((l) => l.zoneId === z.id && l.isActive);
      const zoneUsers = users.filter((u) => u.zoneId === z.id && u.isActive);
      map.set(z.id, { locationCount: zoneLocs.length, userCount: zoneUsers.length });
    }
    return map;
  }, [zones, locations, users]);

  const activeZones = useMemo(() => zones.filter((z) => z.isActive), [zones]);

  const filteredZones = useMemo(() => {
    let result = activeZones;
    if (filter === "active") result = result.filter((z) => z.alertActive);
    if (filter === "inactive") result = result.filter((z) => !z.alertActive);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((z) => z.name.toLowerCase().includes(q));
    }
    return result;
  }, [activeZones, filter, searchQuery]);

  const activeAlertCount = useMemo(
    () => activeZones.filter((z) => z.alertActive).length,
    [activeZones]
  );

  const totalLocations = useMemo(
    () => locations.filter((l) => l.isActive).length,
    [locations]
  );

  const totalUsers = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users]
  );

  // ─── Toggle handler ───
  const handleToggle = useCallback(
    (zone: Zone) => {
      if (zone.alertActive) {
        setDeactivateTarget(zone);
      } else {
        setActivateType("Blackout");
        setActivatePriority("High");
        setActivateMessage(DEFAULT_MESSAGES["Blackout"] || "");
        setActivateTarget(zone);
      }
    },
    []
  );

  // ─── Activate confirm ───
  const handleConfirmActivate = useCallback(() => {
    if (!activateTarget) return;
    activateZoneAlert(activateTarget.id, activateType, activatePriority, activateMessage.trim());
    setActivateTarget(null);
  }, [activateTarget, activateType, activatePriority, activateMessage, activateZoneAlert]);

  // ─── Multi-select helpers ───
  const toggleZoneSelection = useCallback((zoneId: number) => {
    setSelectedZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedZoneIds(new Set());
  }, []);

  const handleOpenBulkActivate = useCallback(() => {
    if (selectedZoneIds.size === 0) return;
    setBulkType("Blackout");
    setBulkPriority("High");
    setBulkMessage(DEFAULT_MESSAGES["Blackout"] || "");
    setBulkActivateVisible(true);
  }, [selectedZoneIds]);

  const handleConfirmBulkActivate = useCallback(() => {
    if (selectedZoneIds.size === 0) return;
    bulkActivateZoneAlerts(Array.from(selectedZoneIds), bulkType, bulkPriority, bulkMessage.trim());
    setBulkActivateVisible(false);
    exitSelectionMode();
  }, [selectedZoneIds, bulkType, bulkPriority, bulkMessage, bulkActivateZoneAlerts, exitSelectionMode]);

  const handleBulkClear = useCallback(() => {
    if (selectedZoneIds.size === 0) return;
    bulkDeactivateZoneAlerts(Array.from(selectedZoneIds));
    exitSelectionMode();
  }, [selectedZoneIds, bulkDeactivateZoneAlerts, exitSelectionMode]);

  // ─── Deactivate confirm ───
  const handleConfirmDeactivate = useCallback(() => {
    if (!deactivateTarget) return;
    deactivateZoneAlert(deactivateTarget.id);
    setDeactivateTarget(null);
  }, [deactivateTarget, deactivateZoneAlert]);

  // ─── Edit flow ───
  const handleOpenEdit = useCallback((zone: Zone) => {
    setEditType(zone.alertType || "Blackout");
    setEditPriority(zone.alertPriority || "High");
    setEditMessage(zone.alertMessage || "");
    setEditTarget(zone);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editTarget) return;
    if (editTarget.alertActive) {
      editZoneAlert(editTarget.id, editType, editPriority, editMessage.trim());
    }
    setEditTarget(null);
  }, [editTarget, editType, editPriority, editMessage, editZoneAlert]);

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

  // ─── Empty state message ───
  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) return "No zones match your search";
    if (filter === "active") return "No active alerts";
    if (filter === "inactive") return "All zones have active alerts";
    return "No zones found";
  }, [filter, searchQuery]);

  // ─── Details modal: locations inside the selected zone ───
  const detailsLocations = useMemo(() => {
    if (!detailsTarget) return [];
    return locations.filter((l) => l.zoneId === detailsTarget.id && l.isActive);
  }, [detailsTarget, locations]);

  const detailsUsers = useMemo(() => {
    if (!detailsTarget) return [];
    return users.filter((u) => u.zoneId === detailsTarget.id && u.isActive);
  }, [detailsTarget, users]);

  // ─── Zone row renderer ───
  const renderZoneRow = useCallback(
    ({ item: zone }: { item: Zone }) => {
      const isAlert = zone.alertActive;
      const isSelected = selectedZoneIds.has(zone.id);
      const stats = zoneStats.get(zone.id) || { locationCount: 0, userCount: 0 };
      return (
        <Pressable
          style={[styles.row, isAlert && styles.rowActive, selectionMode && isSelected && styles.rowSelected]}
          onPress={selectionMode ? () => toggleZoneSelection(zone.id) : undefined}
        >
          {isAlert && !selectionMode && (
            <View style={[styles.rowAccent, { backgroundColor: priorityColors[zone.alertPriority!] }]} />
          )}

          {selectionMode && (
            <Pressable
              style={styles.checkboxArea}
              onPress={() => toggleZoneSelection(zone.id)}
              hitSlop={8}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Feather name="check" size={12} color="#fff" />}
              </View>
            </Pressable>
          )}

          <View style={[styles.rowBody, !selectionMode && isAlert && { paddingLeft: 10 }]}>
            <View style={styles.rowLeft}>
              {/* Zone name line */}
              <View style={styles.rowNameRow}>
                <View style={[styles.zoneDot, { backgroundColor: zone.color }, isAlert && { width: 8, height: 8, borderRadius: 4 }]} />
                <Text style={styles.rowName} numberOfLines={1}>{zone.name}</Text>
              </View>

              {/* Status line */}
              {isAlert ? (
                <View style={styles.statusLine}>
                  <View style={[styles.statusTag, { backgroundColor: priorityColors[zone.alertPriority!] + "1A" }]}>
                    <Text style={[styles.statusTagText, { color: priorityColors[zone.alertPriority!] }]}>
                      {zone.alertPriority}
                    </Text>
                  </View>
                  <Text style={styles.statusSep}>{"\u00B7"}</Text>
                  <Text style={styles.statusType}>{zone.alertType}</Text>
                  {zone.alertUpdatedAt && (
                    <>
                      <Text style={styles.statusSep}>{"\u00B7"}</Text>
                      <Text style={styles.statusTime}>{timeAgo(zone.alertUpdatedAt)}</Text>
                    </>
                  )}
                </View>
              ) : (
                <Text style={styles.rowStatusOff}>Inactive</Text>
              )}

              {/* Counts line */}
              <View style={styles.countsLine}>
                <Feather name="map-pin" size={10} color={Colors.textTertiary} />
                <Text style={styles.countText}>{stats.locationCount} location{stats.locationCount !== 1 ? "s" : ""}</Text>
                <Text style={styles.statusSep}>{"\u00B7"}</Text>
                <Feather name="users" size={10} color={Colors.textTertiary} />
                <Text style={styles.countText}>{stats.userCount} user{stats.userCount !== 1 ? "s" : ""}</Text>
              </View>
            </View>

            {/* Right controls */}
            {!selectionMode && (
              <View style={styles.rowRight}>
                {isAlert && (
                  <View style={styles.activeBadge}>
                    <View style={styles.activePulse} />
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
                <Switch
                  value={isAlert}
                  onValueChange={() => handleToggle(zone)}
                  trackColor={{ false: Colors.border, true: Colors.primary + "55" }}
                  thumbColor={isAlert ? Colors.primary : Colors.textTertiary}
                  style={styles.rowSwitch}
                />
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.5, backgroundColor: Colors.border }]}
                  onPress={() => setMenuTarget(zone)}
                  hitSlop={6}
                >
                  <Feather name="more-vertical" size={17} color={Colors.textSecondary} />
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [handleToggle, zoneStats, timeAgo, selectionMode, selectedZoneIds, toggleZoneSelection]
  );

  // ─── Shared alert form builder ───
  const renderAlertForm = (
    type: LocationAlertType,
    setType: (t: LocationAlertType) => void,
    priority: AlertPriority,
    setPriority: (p: AlertPriority) => void,
    message: string,
    setMessage: (m: string) => void,
    target: Zone | null,
  ) => {
    const stats = target ? zoneStats.get(target.id) : null;
    return (
      <>
        <View style={styles.modalTarget}>
          <View style={[styles.modalTargetDot, { backgroundColor: target?.color || Colors.textTertiary }]} />
          <Text style={styles.modalTargetText}>{target?.name}</Text>
          {stats && (
            <View style={styles.modalTargetZoneBadge}>
              <Text style={styles.modalTargetZoneText}>
                {stats.locationCount} locations · {stats.userCount} users
              </Text>
            </View>
          )}
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
  };

  return (
    <View style={styles.container}>
      <Header title="Alert Management" />

      {/* ─── Summary strip ─── */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconWrap}>
            <Feather name="layers" size={13} color={Colors.textSecondary} />
          </View>
          <Text style={styles.summaryNum}>{activeZones.length}</Text>
          <Text style={styles.summaryLabel}>Zones</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIconWrap, activeAlertCount > 0 && { backgroundColor: Colors.primary + "18" }]}>
            <Feather name="zap" size={13} color={activeAlertCount > 0 ? Colors.primary : Colors.textSecondary} />
          </View>
          <Text style={[styles.summaryNum, activeAlertCount > 0 && { color: Colors.primary }]}>
            {activeAlertCount}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconWrap}>
            <Feather name="map-pin" size={13} color={Colors.textSecondary} />
          </View>
          <Text style={styles.summaryNum}>{totalLocations}</Text>
          <Text style={styles.summaryLabel}>Locations</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconWrap}>
            <Feather name="users" size={13} color={Colors.textSecondary} />
          </View>
          <Text style={styles.summaryNum}>{totalUsers}</Text>
          <Text style={styles.summaryLabel}>Users</Text>
        </View>
      </View>

      {/* ─── Search ─── */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={14} color={Colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search zones..."
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
          const count = f === "all" ? activeZones.length : f === "active" ? activeAlertCount : activeZones.length - activeAlertCount;
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
        {!selectionMode ? (
          <Pressable
            style={({ pressed }) => [styles.selectModeBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setSelectionMode(true)}
          >
            <Feather name="check-square" size={12} color={Colors.primary} />
            <Text style={styles.selectModeBtnText}>Select</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.selectModeBtn, pressed && { opacity: 0.7 }]}
            onPress={exitSelectionMode}
          >
            <Feather name="x" size={12} color={Colors.textSecondary} />
            <Text style={[styles.selectModeBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        )}
      </View>

      {/* ─── Bulk action bar ─── */}
      {selectionMode && (
        <View style={styles.bulkBar}>
          <Pressable
            style={styles.bulkSelectAll}
            onPress={() => {
              const allIds = filteredZones.map((z) => z.id);
              const allSelected = allIds.every((id) => selectedZoneIds.has(id));
              setSelectedZoneIds(allSelected ? new Set() : new Set(allIds));
            }}
          >
            <View style={[styles.checkbox, filteredZones.length > 0 && filteredZones.every((z) => selectedZoneIds.has(z.id)) && styles.checkboxChecked]}>
              {filteredZones.length > 0 && filteredZones.every((z) => selectedZoneIds.has(z.id)) && (
                <Feather name="check" size={12} color="#fff" />
              )}
            </View>
            <Text style={styles.bulkSelectAllText}>
              {selectedZoneIds.size > 0 ? `${selectedZoneIds.size} selected` : "Select all"}
            </Text>
          </Pressable>
          <View style={styles.bulkBtnGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.bulkActivateBtn,
                selectedZoneIds.size === 0 && { opacity: 0.4 },
                pressed && selectedZoneIds.size > 0 && { opacity: 0.8 },
              ]}
              onPress={handleOpenBulkActivate}
              disabled={selectedZoneIds.size === 0}
            >
              <Feather name="zap" size={13} color="#fff" />
              <Text style={styles.bulkActivateBtnText}>Activate</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.bulkClearBtn,
                selectedZoneIds.size === 0 && { opacity: 0.4 },
                pressed && selectedZoneIds.size > 0 && { opacity: 0.8 },
              ]}
              onPress={handleBulkClear}
              disabled={selectedZoneIds.size === 0}
            >
              <Feather name="check-circle" size={13} color={Colors.safe} />
              <Text style={styles.bulkClearBtnText}>All Clear</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ─── Zone list ─── */}
      <FlatList
        data={filteredZones}
        extraData={zones}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderZoneRow}
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
              {searchQuery.trim() ? "Try a different search term" : "Zones will appear here"}
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
                <Text style={styles.modalTitle}>Activate Zone Alert</Text>
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
            <View style={styles.deactivateIconWrap}>
              <Feather name="power" size={20} color={Colors.amber} />
            </View>
            <Text style={styles.deactivateTitle}>Turn Off Zone Alert</Text>
            <Text style={styles.deactivateMsg}>
              Deactivate the active alert for zone{" "}
              <Text style={{ fontFamily: "Inter_700Bold", color: Colors.text }}>{deactivateTarget?.name}</Text>?
              {"\n"}This will clear alerts on all locations inside.
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
                <Text style={styles.modalTitle}>Zone Alert Settings</Text>
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
                <Text style={styles.modalTitle}>Zone History {"\u2013"} {historyTarget?.name}</Text>
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
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: entry }: { item: ZoneAlertHistoryEntry }) => {
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
                        {entry.alertType && (
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

      {/* ═══ DETAILS MODAL (locations + users inside zone) ═══ */}
      <Modal
        visible={detailsTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "80%" }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: detailsTarget?.color ? detailsTarget.color + "18" : Colors.surfaceElevated }]}>
                  <Feather name="eye" size={14} color={detailsTarget?.color || Colors.textSecondary} />
                </View>
                <Text style={styles.modalTitle}>{detailsTarget?.name} {"\u2013"} Details</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setDetailsTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Zone alert status banner */}
            {detailsTarget?.alertActive && (
              <View style={styles.detailsBanner}>
                <View style={[styles.detailsBannerDot, { backgroundColor: priorityColors[detailsTarget.alertPriority!] }]} />
                <Text style={styles.detailsBannerText}>
                  {detailsTarget.alertPriority} · {detailsTarget.alertType}
                </Text>
              </View>
            )}

            {/* Counts row */}
            <View style={styles.detailsCountsRow}>
              <View style={styles.detailsCountItem}>
                <Feather name="map-pin" size={12} color={Colors.textTertiary} />
                <Text style={styles.detailsCountNum}>{detailsLocations.length}</Text>
                <Text style={styles.detailsCountLabel}>Location{detailsLocations.length !== 1 ? "s" : ""}</Text>
              </View>
              <View style={styles.detailsCountItem}>
                <Feather name="users" size={12} color={Colors.textTertiary} />
                <Text style={styles.detailsCountNum}>{detailsUsers.length}</Text>
                <Text style={styles.detailsCountLabel}>User{detailsUsers.length !== 1 ? "s" : ""}</Text>
              </View>
            </View>

            {/* Locations list */}
            <Text style={styles.modalLabel}>Locations</Text>
            <FlatList
              data={detailsLocations}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.detailsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: loc }: { item: Location }) => {
                const locUserCount = users.filter((u) => u.locationId === loc.id && u.zoneId === detailsTarget?.id && u.isActive).length;
                return (
                  <View style={styles.detailsLocRow}>
                    <View style={[styles.detailsLocDot, loc.alertActive && { backgroundColor: priorityColors[loc.alertPriority!] || Colors.primary }]} />
                    <Text style={styles.detailsLocName} numberOfLines={1}>{loc.name}</Text>
                    <Text style={styles.detailsLocUserCount}>
                      {locUserCount} user{locUserCount !== 1 ? "s" : ""}
                    </Text>
                    {loc.alertActive ? (
                      <View style={[styles.detailsLocBadge, { backgroundColor: priorityColors[loc.alertPriority!] + "1A" }]}>
                        <Text style={[styles.detailsLocBadgeText, { color: priorityColors[loc.alertPriority!] }]}>
                          {loc.alertType}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.detailsLocInactive}>Inactive</Text>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.historyEmpty}>
                  <Feather name="map-pin" size={20} color={Colors.textTertiary} />
                  <Text style={styles.historyEmptyText}>No locations in this zone</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* ═══ ZONE ACTIONS MENU ═══ */}
      <Modal
        visible={menuTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuTarget(null)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuTarget(null)}>
          <View style={styles.menuSheet}>
            <View style={styles.menuHeader}>
              <View style={[styles.zoneDot, { backgroundColor: menuTarget?.color || Colors.textTertiary }]} />
              <Text style={styles.menuHeaderText} numberOfLines={1}>{menuTarget?.name}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                const z = menuTarget;
                setMenuTarget(null);
                if (z) setDetailsTarget(z);
              }}
            >
              <Feather name="eye" size={16} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Review</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                const z = menuTarget;
                setMenuTarget(null);
                if (z) setHistoryTarget(z);
              }}
            >
              <Feather name="clock" size={16} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>History</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => {
                const z = menuTarget;
                setMenuTarget(null);
                if (z) {
                  setNotifyTarget(z);
                  setNotifyMessage("");
                }
              }}
            >
              <Feather name="bell" size={16} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Notification</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ═══ SEND NOTIFICATION MODAL ═══ */}
      <Modal
        visible={notifyTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifyTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: Colors.info + "18" }]}>
                  <Feather name="bell" size={14} color={Colors.info} />
                </View>
                <Text style={styles.modalTitle}>Send Notification</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setNotifyTarget(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalTarget}>
              <View style={[styles.modalTargetDot, { backgroundColor: notifyTarget?.color || Colors.textTertiary }]} />
              <Text style={styles.modalTargetText}>{notifyTarget?.name}</Text>
              {notifyTarget && zoneStats.get(notifyTarget.id) && (
                <View style={styles.modalTargetZoneBadge}>
                  <Text style={styles.modalTargetZoneText}>
                    {zoneStats.get(notifyTarget.id)!.userCount} user{zoneStats.get(notifyTarget.id)!.userCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.modalLabel}>Message</Text>
            <TextInput
              style={[styles.messageInput, { minHeight: 100 }]}
              value={notifyMessage}
              onChangeText={setNotifyMessage}
              placeholder="Type notification message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.8 }]}
                onPress={() => setNotifyTarget(null)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtnSave, pressed && { opacity: 0.8 }, !notifyMessage.trim() && { opacity: 0.4 }]}
                onPress={() => {
                  if (!notifyTarget || !notifyMessage.trim()) return;
                  sendZoneNotification(notifyTarget.id, notifyMessage);
                  setNotifyTarget(null);
                  setNotifyMessage("");
                }}
                disabled={!notifyMessage.trim()}
              >
                <Feather name="send" size={14} color="#fff" />
                <Text style={styles.modalBtnConfirmText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ BULK ACTIVATE MODAL ═══ */}
      <Modal
        visible={bulkActivateVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBulkActivateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: Colors.primary + "18" }]}>
                  <Feather name="zap" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Bulk Activate Alert</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={() => setBulkActivateVisible(false)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Selected zones summary */}
            <View style={styles.bulkZoneSummary}>
              <Text style={styles.bulkZoneSummaryLabel}>{selectedZoneIds.size} zone{selectedZoneIds.size !== 1 ? "s" : ""} selected:</Text>
              <View style={styles.bulkZoneChips}>
                {zones.filter((z) => selectedZoneIds.has(z.id)).map((z) => (
                  <View key={z.id} style={[styles.bulkZoneChip, { borderColor: z.color }]}>
                    <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
                    <Text style={styles.bulkZoneChipText}>{z.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.modalLabel}>Alert Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {ALERT_TYPE_OPTIONS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, bulkType === t && styles.chipActive]}
                  onPress={() => {
                    setBulkType(t);
                    if (!bulkMessage.trim() || bulkMessage === DEFAULT_MESSAGES[bulkType])
                      setBulkMessage(DEFAULT_MESSAGES[t] || "");
                  }}
                >
                  <Text style={[styles.chipText, bulkType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITY_OPTIONS.map((p) => (
                <Pressable
                  key={p}
                  style={[styles.chip, bulkPriority === p && [styles.chipActive, { borderColor: priorityColors[p], backgroundColor: priorityColors[p] + "18" }]]}
                  onPress={() => setBulkPriority(p)}
                >
                  <Text style={[styles.chipText, bulkPriority === p && { color: priorityColors[p], fontWeight: "600" }]}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Message</Text>
            <TextInput
              value={bulkMessage}
              onChangeText={setBulkMessage}
              style={styles.messageInput}
              multiline
              numberOfLines={3}
              placeholder="Alert message..."
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalBtnCancel, pressed && { opacity: 0.8 }]}
                onPress={() => setBulkActivateVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtnConfirm, pressed && { opacity: 0.8 }]}
                onPress={handleConfirmBulkActivate}
              >
                <Feather name="zap" size={14} color="#fff" />
                <Text style={styles.modalBtnConfirmText}>Activate {selectedZoneIds.size} Zone{selectedZoneIds.size !== 1 ? "s" : ""}</Text>
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
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 80 },

  // ─── Zone rows ───
  row: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden", marginBottom: 8,
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
    paddingHorizontal: 12, paddingVertical: 12,
  },
  rowLeft: { flex: 1, gap: 4, marginRight: 10 },
  rowNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  rowName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, flexShrink: 1 },

  statusLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  statusTag: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 },
  statusTagText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  statusSep: { fontSize: 10, color: Colors.textTertiary },
  statusType: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  statusTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  rowStatusOff: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 1 },

  countsLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  countText: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primary + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  activePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  activeBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: Colors.primary, letterSpacing: 0.6 },
  rowSwitch: { transform: [{ scale: 0.78 }], marginHorizontal: -2 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 8,
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
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  modalTitleIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, flexShrink: 1 },
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

  // ─── Details modal ───
  detailsBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primary + "10", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  detailsBannerDot: { width: 8, height: 8, borderRadius: 4 },
  detailsBannerText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.text },
  detailsCountsRow: {
    flexDirection: "row", gap: 12,
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  detailsCountItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailsCountNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  detailsCountLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  detailsList: { gap: 0, paddingBottom: 8 },
  detailsLocRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailsLocDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textTertiary },
  detailsLocName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  detailsLocUserCount: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginRight: 4 },
  detailsLocBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  detailsLocBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  detailsLocInactive: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  // ─── Selection mode ───
  selectModeBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: Colors.primary + "10",
  },
  selectModeBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary },

  rowSelected: {
    borderColor: Colors.primary + "50",
    backgroundColor: Colors.primary + "0A",
  },
  checkboxArea: {
    justifyContent: "center", alignItems: "center",
    paddingLeft: 12, paddingRight: 4,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // ─── Bulk bar ───
  bulkBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.primary + "08",
    borderBottomWidth: 1, borderBottomColor: Colors.primary + "20",
  },
  bulkSelectAll: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  bulkSelectAllText: {
    fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary,
  },
  bulkBtnGroup: { flexDirection: "row", gap: 8 },
  bulkActivateBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  bulkActivateBtnText: {
    fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff",
  },
  bulkClearBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.safeDim, borderWidth: 1, borderColor: Colors.safeBorder,
  },
  bulkClearBtnText: {
    fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.safe,
  },

  // ─── Bulk modal extras ───
  bulkZoneSummary: { paddingHorizontal: 16, paddingVertical: 8 },
  bulkZoneSummaryLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 6 },
  bulkZoneChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  bulkZoneChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, backgroundColor: Colors.surfaceElevated,
  },
  bulkZoneChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.text },

  // ─── Zone actions menu ───
  menuOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 48,
  },
  menuSheet: {
    width: "100%", maxWidth: 280,
    backgroundColor: Colors.surface,
    borderRadius: 14, overflow: "hidden",
    paddingVertical: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
  },
  menuHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    marginBottom: 2,
  },
  menuHeaderText: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text, flex: 1,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  menuItemPressed: {
    backgroundColor: Colors.background,
  },
  menuItemText: {
    fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text,
  },
  menuDivider: {
    height: 1, backgroundColor: Colors.border, marginHorizontal: 12, marginVertical: 2,
  },
});
