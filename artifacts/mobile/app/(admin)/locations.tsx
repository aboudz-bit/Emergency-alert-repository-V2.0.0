import React, { useState, useMemo, useCallback } from "react";
import {
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing } from "@/constants/theme";
import { useStore } from "@/store";
import type { Location } from "@/types";

const ZONE_COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1",
];

export default function ZonesAndLocationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ─── Store ───
  const allZones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const addLocation = useStore((s) => s.addLocation);
  const updateLocation = useStore((s) => s.updateLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const updateZone = useStore((s) => s.updateZone);
  const renameZone = useStore((s) => s.renameZone);
  const mergeZones = useStore((s) => s.mergeZones);
  const moveLocationsBetweenZones = useStore((s) => s.moveLocationsBetweenZones);
  const splitZone = useStore((s) => s.splitZone);
  const archiveZone = useStore((s) => s.archiveZone);

  // ─── Derived zones ───
  const activeZones = useMemo(() => allZones.filter((z) => !z.isArchived), [allZones]);
  const archivedZones = useMemo(() => allZones.filter((z) => z.isArchived), [allZones]);

  // ─── Zone Menu ───
  const [menuZoneId, setMenuZoneId] = useState<number | null>(null);
  const menuZone = useMemo(
    () => allZones.find((z) => z.id === menuZoneId) ?? null,
    [allZones, menuZoneId]
  );
  const closeMenu = useCallback(() => setMenuZoneId(null), []);

  // ─── Rename ───
  const [renameZoneId, setRenameZoneId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState("");
  const [renameError, setRenameError] = useState("");

  const handleStartRename = useCallback(() => {
    if (!menuZone) return;
    setRenameText(menuZone.name);
    setRenameError("");
    setRenameZoneId(menuZone.id);
    closeMenu();
  }, [menuZone, closeMenu]);

  const handleSaveRename = useCallback(() => {
    if (!renameZoneId) return;
    const trimmed = renameText.trim();
    if (!trimmed) return;
    const isDuplicate = activeZones.some(
      (z) => z.id !== renameZoneId && z.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) { setRenameError("Zone name already exists"); return; }
    renameZone(renameZoneId, trimmed);
    setRenameZoneId(null);
    setRenameText("");
    setRenameError("");
  }, [renameZoneId, renameText, activeZones, renameZone]);

  // ─── Merge ───
  const [mergeSourceId, setMergeSourceId] = useState<number | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);

  const mergeSource = useMemo(
    () => allZones.find((z) => z.id === mergeSourceId) ?? null,
    [allZones, mergeSourceId]
  );
  const mergeTarget = useMemo(
    () => allZones.find((z) => z.id === mergeTargetId) ?? null,
    [allZones, mergeTargetId]
  );
  const mergeSourceLocs = useMemo(
    () => locations.filter((l) => l.zoneId === mergeSourceId),
    [locations, mergeSourceId]
  );

  const handleStartMerge = useCallback(() => {
    if (!menuZone) return;
    setMergeSourceId(menuZone.id);
    setMergeTargetId(null);
    closeMenu();
  }, [menuZone, closeMenu]);

  const handleConfirmMerge = useCallback(() => {
    if (!mergeSourceId || !mergeTargetId) return;
    mergeZones(mergeSourceId, mergeTargetId);
    setMergeSourceId(null);
    setMergeTargetId(null);
  }, [mergeSourceId, mergeTargetId, mergeZones]);

  // ─── Multi-select (Move / Split) ───
  const [multiSelectZoneId, setMultiSelectZoneId] = useState<number | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState<"move" | "split" | null>(null);
  const [multiSelectedLocIds, setMultiSelectedLocIds] = useState<Set<number>>(new Set());

  const handleStartMove = useCallback(() => {
    if (!menuZone) return;
    setMultiSelectZoneId(menuZone.id);
    setMultiSelectMode("move");
    setMultiSelectedLocIds(new Set());
    closeMenu();
  }, [menuZone, closeMenu]);

  const handleStartSplit = useCallback(() => {
    if (!menuZone) return;
    setMultiSelectZoneId(menuZone.id);
    setMultiSelectMode("split");
    setMultiSelectedLocIds(new Set());
    closeMenu();
  }, [menuZone, closeMenu]);

  const handleToggleLocSelect = useCallback((locId: number) => {
    setMultiSelectedLocIds((prev) => {
      const next = new Set(prev);
      if (next.has(locId)) next.delete(locId); else next.add(locId);
      return next;
    });
  }, []);

  const handleCancelMultiSelect = useCallback(() => {
    setMultiSelectZoneId(null);
    setMultiSelectMode(null);
    setMultiSelectedLocIds(new Set());
    setMovePickerOpen(false);
    setSplitFormOpen(false);
  }, []);

  const handleNextMultiSelect = useCallback(() => {
    if (multiSelectedLocIds.size === 0) return;
    if (multiSelectMode === "move") setMovePickerOpen(true);
    else if (multiSelectMode === "split") {
      setSplitName("");
      setSplitColor(ZONE_COLORS[0]);
      setSplitNameError("");
      setSplitFormOpen(true);
    }
  }, [multiSelectedLocIds, multiSelectMode]);

  // ─── Move Target Picker ───
  const [movePickerOpen, setMovePickerOpen] = useState(false);

  const handleConfirmMove = useCallback(
    (targetZoneId: number) => {
      moveLocationsBetweenZones([...multiSelectedLocIds], targetZoneId);
      setMultiSelectZoneId(null);
      setMultiSelectMode(null);
      setMultiSelectedLocIds(new Set());
      setMovePickerOpen(false);
    },
    [multiSelectedLocIds, moveLocationsBetweenZones]
  );

  // ─── Split Form ───
  const [splitFormOpen, setSplitFormOpen] = useState(false);
  const [splitName, setSplitName] = useState("");
  const [splitColor, setSplitColor] = useState(ZONE_COLORS[0]);
  const [splitNameError, setSplitNameError] = useState("");

  const handleConfirmSplit = useCallback(() => {
    if (!multiSelectZoneId) return;
    const trimmed = splitName.trim();
    if (!trimmed) return;
    const isDup = activeZones.some((z) => z.name.toLowerCase() === trimmed.toLowerCase());
    if (isDup) { setSplitNameError("Zone name already exists"); return; }
    splitZone(multiSelectZoneId, [...multiSelectedLocIds], trimmed, splitColor);
    setMultiSelectZoneId(null);
    setMultiSelectMode(null);
    setMultiSelectedLocIds(new Set());
    setSplitFormOpen(false);
    setSplitName("");
    setSplitNameError("");
  }, [multiSelectZoneId, multiSelectedLocIds, splitName, splitColor, activeZones, splitZone]);

  // ─── Archive ───
  const [archiveZoneId, setArchiveZoneId] = useState<number | null>(null);

  const archiveImpact = useMemo(() => {
    if (!archiveZoneId) return null;
    const z = allZones.find((z) => z.id === archiveZoneId);
    const zoneLocs = locations.filter((l) => l.zoneId === archiveZoneId);
    return {
      zoneName: z?.name ?? "",
      hasActiveAlert: z?.alertActive ?? false,
      activeLocations: zoneLocs.filter((l) => l.isActive).length,
      totalLocations: zoneLocs.length,
    };
  }, [archiveZoneId, allZones, locations]);

  const handleStartArchive = useCallback(() => {
    if (!menuZone) return;
    setArchiveZoneId(menuZone.id);
    closeMenu();
  }, [menuZone, closeMenu]);

  const handleConfirmArchive = useCallback(() => {
    if (!archiveZoneId) return;
    archiveZone(archiveZoneId);
    setArchiveZoneId(null);
  }, [archiveZoneId, archiveZone]);

  // ─── Archived display ───
  const [showArchived, setShowArchived] = useState(false);

  const handleRestoreZone = useCallback(
    (zoneId: number) => updateZone(zoneId, { isArchived: false, isActive: true }),
    [updateZone]
  );

  // ─── Add / Edit Location ───
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationZoneId, setLocationZoneId] = useState<number | null>(null);

  const handleOpenAdd = useCallback(
    (zoneId?: number) => {
      setEditingLocation(null);
      setLocationName("");
      setLocationZoneId(zoneId ?? activeZones[0]?.id ?? null);
      setShowLocationModal(true);
    },
    [activeZones]
  );

  const handleOpenEdit = useCallback((loc: Location) => {
    setEditingLocation(loc);
    setLocationName(loc.name);
    setLocationZoneId(loc.zoneId);
    setShowLocationModal(true);
  }, []);

  const handleSaveLocation = useCallback(() => {
    if (!locationName.trim() || !locationZoneId) return;
    const zone = allZones.find((z) => z.id === locationZoneId);
    if (!zone) return;
    if (editingLocation) {
      updateLocation(editingLocation.id, {
        name: locationName.trim(),
        zone: zone.name,
        zoneId: locationZoneId,
      });
    } else {
      addLocation({
        name: locationName.trim(),
        zone: zone.name,
        zoneId: locationZoneId,
        expectedManpower: 0,
        isActive: true,
        polygonPoints: [],
        alertActive: false,
        alertType: null,
        alertPriority: null,
        alertMessage: "",
        alertUpdatedAt: null,
        alertHistory: [],
      });
    }
    setShowLocationModal(false);
    setLocationName("");
    setEditingLocation(null);
  }, [locationName, locationZoneId, editingLocation, updateLocation, addLocation, allZones]);

  const handleDeleteLocation = useCallback(() => {
    if (!editingLocation) return;
    deleteLocation(editingLocation.id);
    setShowLocationModal(false);
    setEditingLocation(null);
  }, [editingLocation, deleteLocation]);

  // ─── Render ───
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Zones and Locations</Text>
          <Text style={styles.headerSub}>
            {locations.length} location{locations.length !== 1 ? "s" : ""} · {activeZones.length} active zone{activeZones.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable style={styles.headerBtnAccent} onPress={() => handleOpenAdd()} hitSlop={8}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        {activeZones.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="layers" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Zones Yet</Text>
            <Text style={styles.emptyText}>Create zones on the Zones map to get started</Text>
          </View>
        )}

        {activeZones.map((zone) => {
          const zoneLocs = locations.filter((l) => l.zoneId === zone.id);
          const isSelecting = multiSelectZoneId === zone.id;

          return (
            <View key={zone.id} style={styles.zoneSection}>
              {/* Zone header row */}
              <View style={styles.zoneHeader}>
                <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                <View style={styles.zoneHeaderInfo}>
                  <Text style={styles.zoneName} numberOfLines={1}>{zone.name}</Text>
                  <Text style={styles.zoneMeta}>
                    {zoneLocs.length} location{zoneLocs.length !== 1 ? "s" : ""}
                    {zone.alertActive ? " · Alert Active" : ""}
                  </Text>
                </View>
                <Switch
                  value={zone.isActive}
                  onValueChange={() => updateZone(zone.id, { isActive: !zone.isActive })}
                  trackColor={{ false: Colors.border, true: zone.color + "60" }}
                  thumbColor={zone.isActive ? zone.color : Colors.textSecondary}
                  style={styles.zoneSwitch}
                />
                {isSelecting ? (
                  <Pressable style={styles.cancelSelectBtn} onPress={handleCancelMultiSelect}>
                    <Feather name="x" size={16} color={Colors.textSecondary} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.menuBtn} onPress={() => setMenuZoneId(zone.id)} hitSlop={6}>
                    <Feather name="more-vertical" size={18} color={Colors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Multi-select hint */}
              {isSelecting && (
                <View style={styles.selectHint}>
                  <Feather name="check-square" size={12} color={Colors.info} />
                  <Text style={styles.selectHintText}>
                    {multiSelectMode === "move" ? "Select locations to move" : "Select locations to split into new zone"}
                    {multiSelectedLocIds.size > 0 ? ` · ${multiSelectedLocIds.size} selected` : ""}
                  </Text>
                </View>
              )}

              {/* Location rows */}
              {zoneLocs.length === 0 ? (
                <View style={styles.emptyZone}>
                  <Text style={styles.emptyZoneText}>No locations in this zone</Text>
                  <Pressable onPress={() => handleOpenAdd(zone.id)} hitSlop={8}>
                    <Text style={styles.emptyZoneAdd}>+ Add</Text>
                  </Pressable>
                </View>
              ) : (
                zoneLocs.map((loc) => {
                  const isSel = multiSelectedLocIds.has(loc.id);
                  return (
                    <Pressable
                      key={loc.id}
                      style={[styles.row, isSel && styles.rowSelected]}
                      onPress={isSelecting ? () => handleToggleLocSelect(loc.id) : undefined}
                    >
                      {isSelecting ? (
                        <View style={[styles.checkbox, isSel && { backgroundColor: Colors.info, borderColor: Colors.info }]}>
                          {isSel && <Feather name="check" size={12} color="#fff" />}
                        </View>
                      ) : (
                        <Feather
                          name="map-pin"
                          size={14}
                          color={loc.isActive ? (zone.color || Colors.textSecondary) : Colors.textTertiary}
                        />
                      )}
                      <Text style={[styles.rowName, !loc.isActive && { color: Colors.textTertiary }]} numberOfLines={1}>
                        {loc.name}
                      </Text>
                      {loc.alertActive && (
                        <Feather name="alert-circle" size={12} color="#EF4444" />
                      )}
                      {!isSelecting && (
                        <>
                          <Switch
                            value={loc.isActive}
                            onValueChange={() => updateLocation(loc.id, { isActive: !loc.isActive })}
                            trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                            thumbColor={loc.isActive ? Colors.safe : Colors.textSecondary}
                            style={styles.rowSwitch}
                          />
                          <Pressable
                            style={({ pressed }) => [styles.rowEditBtn, pressed && { opacity: 0.6 }]}
                            onPress={() => handleOpenEdit(loc)}
                            hitSlop={6}
                          >
                            <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                          </Pressable>
                        </>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          );
        })}

        {/* Archived zones section */}
        {archivedZones.length > 0 && (
          <View style={styles.archivedSection}>
            <Pressable style={styles.archivedHeader} onPress={() => setShowArchived((v) => !v)}>
              <Feather name="archive" size={14} color={Colors.textTertiary} />
              <Text style={styles.archivedHeaderText}>
                {archivedZones.length} Archived Zone{archivedZones.length !== 1 ? "s" : ""}
              </Text>
              <Feather name={showArchived ? "chevron-up" : "chevron-down"} size={16} color={Colors.textTertiary} />
            </Pressable>
            {showArchived &&
              archivedZones.map((zone) => {
                const zoneLocs = locations.filter((l) => l.zoneId === zone.id);
                return (
                  <View key={zone.id} style={styles.archivedRow}>
                    <View style={[styles.zoneDot, { backgroundColor: zone.color, opacity: 0.5 }]} />
                    <View style={styles.zoneHeaderInfo}>
                      <Text style={[styles.zoneName, { color: Colors.textSecondary }]}>{zone.name}</Text>
                      <Text style={styles.zoneMeta}>{zoneLocs.length} locations · Archived</Text>
                    </View>
                    <Pressable style={styles.restoreBtn} onPress={() => handleRestoreZone(zone.id)}>
                      <Feather name="rotate-ccw" size={12} color={Colors.info} />
                      <Text style={styles.restoreBtnText}>Restore</Text>
                    </Pressable>
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>

      {/* Floating multi-select bar */}
      {multiSelectMode != null && (
        <View style={[styles.floatingBar, { bottom: insets.bottom + 12 }]}>
          <Pressable style={styles.floatingCancelBtn} onPress={handleCancelMultiSelect}>
            <Text style={styles.floatingCancelText}>Cancel</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            style={[styles.floatingNextBtn, multiSelectedLocIds.size === 0 && { opacity: 0.3 }]}
            onPress={handleNextMultiSelect}
            disabled={multiSelectedLocIds.size === 0}
          >
            <Text style={styles.floatingNextText}>
              {multiSelectMode === "move"
                ? `Move ${multiSelectedLocIds.size} Location${multiSelectedLocIds.size !== 1 ? "s" : ""}`
                : `Next · ${multiSelectedLocIds.size} selected`}
            </Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Zone Actions Menu */}
      <Modal visible={menuZoneId != null} transparent animationType="slide" onRequestClose={closeMenu}>
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={[styles.zoneDot, { backgroundColor: menuZone?.color }]} />
              <Text style={styles.sheetTitle}>{menuZone?.name}</Text>
              <Pressable onPress={closeMenu} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {([
              { icon: "edit", label: "Rename Zone", action: handleStartRename, color: Colors.text },
              { icon: "shuffle", label: "Merge Into Another Zone", action: handleStartMerge, color: Colors.text },
              { icon: "move", label: "Move Locations", action: handleStartMove, color: Colors.text },
              { icon: "scissors", label: "Split Zone", action: handleStartSplit, color: Colors.text },
              { icon: "archive", label: "Archive Zone", action: handleStartArchive, color: "#F59E0B" },
            ] as const).map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: Colors.surfaceElevated }]}
                onPress={item.action}
              >
                <Feather name={item.icon as any} size={18} color={item.color} />
                <Text style={[styles.menuItemText, { color: item.color }]}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={renameZoneId != null}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameZoneId(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setRenameZoneId(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Rename Zone</Text>
              <Pressable onPress={() => setRenameZoneId(null)} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.textInput, renameError ? { borderColor: "#EF4444" } : {}]}
              value={renameText}
              onChangeText={(t) => { setRenameText(t); setRenameError(""); }}
              placeholder="Zone name..."
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            {!!renameError && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color="#EF4444" />
                <Text style={styles.errorText}>{renameError}</Text>
              </View>
            )}
            <View style={styles.btnRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setRenameZoneId(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, !renameText.trim() && { opacity: 0.3 }]}
                onPress={handleSaveRename}
                disabled={!renameText.trim()}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Merge Modal — Step 1: pick target / Step 2: confirm */}
      <Modal
        visible={mergeSourceId != null}
        transparent
        animationType="slide"
        onRequestClose={() => { setMergeSourceId(null); setMergeTargetId(null); }}
      >
        <Pressable style={styles.overlay} onPress={() => { setMergeSourceId(null); setMergeTargetId(null); }}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: "80%" }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{mergeTargetId ? "Confirm Merge" : "Merge Into..."}</Text>
              <Pressable onPress={() => { setMergeSourceId(null); setMergeTargetId(null); }} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {!mergeTargetId ? (
              <>
                <Text style={styles.sheetSub}>
                  All {mergeSourceLocs.length} location{mergeSourceLocs.length !== 1 ? "s" : ""} from{" "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>{mergeSource?.name}</Text> will move into the selected zone. The source zone will be archived.
                </Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {activeZones
                    .filter((z) => z.id !== mergeSourceId)
                    .map((z) => {
                      const count = locations.filter((l) => l.zoneId === z.id).length;
                      return (
                        <Pressable
                          key={z.id}
                          style={({ pressed }) => [styles.pickerRow, pressed && { backgroundColor: Colors.surfaceElevated }]}
                          onPress={() => setMergeTargetId(z.id)}
                        >
                          <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.pickerName}>{z.name}</Text>
                            <Text style={styles.pickerMeta}>{count} locations</Text>
                          </View>
                          <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
                        </Pressable>
                      );
                    })}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.mergeBox}>
                  <View style={styles.mergeRow}>
                    <View style={[styles.zoneDot, { backgroundColor: mergeSource?.color }]} />
                    <Text style={styles.mergeZoneName}>{mergeSource?.name}</Text>
                    <Text style={styles.mergeCount}>{mergeSourceLocs.length} locs</Text>
                  </View>
                  <View style={styles.mergeArrow}>
                    <Feather name="arrow-down" size={18} color={Colors.textTertiary} />
                    <Text style={styles.mergeArrowLabel}>merges into</Text>
                  </View>
                  <View style={styles.mergeRow}>
                    <View style={[styles.zoneDot, { backgroundColor: mergeTarget?.color }]} />
                    <Text style={styles.mergeZoneName}>{mergeTarget?.name}</Text>
                    <Text style={styles.mergeCount}>
                      {locations.filter((l) => l.zoneId === mergeTargetId).length} locs
                    </Text>
                  </View>
                </View>
                <Text style={styles.sheetSub}>
                  <Text style={{ fontFamily: "Inter_700Bold" }}>{mergeSource?.name}</Text> will be archived after merging. All linked data (shelters, personnel, alerts) will transfer to{" "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>{mergeTarget?.name}</Text>.
                </Text>
                <View style={styles.btnRow}>
                  <Pressable style={styles.cancelBtn} onPress={() => setMergeTargetId(null)}>
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: "#F59E0B" }]}
                    onPress={handleConfirmMerge}
                  >
                    <Feather name="shuffle" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Merge</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Move Target Picker */}
      <Modal
        visible={movePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMovePickerOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMovePickerOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: "75%" }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Move to Zone</Text>
              <Pressable onPress={() => setMovePickerOpen(false)} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetSub}>
              Moving {multiSelectedLocIds.size} location{multiSelectedLocIds.size !== 1 ? "s" : ""} to:
            </Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {activeZones
                .filter((z) => z.id !== multiSelectZoneId)
                .map((z) => {
                  const count = locations.filter((l) => l.zoneId === z.id).length;
                  return (
                    <Pressable
                      key={z.id}
                      style={({ pressed }) => [styles.pickerRow, pressed && { backgroundColor: Colors.surfaceElevated }]}
                      onPress={() => handleConfirmMove(z.id)}
                    >
                      <View style={[styles.zoneDot, { backgroundColor: z.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerName}>{z.name}</Text>
                        <Text style={styles.pickerMeta}>{count} locations</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
                    </Pressable>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Split Form */}
      <Modal
        visible={splitFormOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSplitFormOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSplitFormOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Zone from Split</Text>
              <Pressable onPress={() => setSplitFormOpen(false)} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetSub}>
              {multiSelectedLocIds.size} location{multiSelectedLocIds.size !== 1 ? "s" : ""} will be moved into the new zone.
            </Text>
            <TextInput
              style={[styles.textInput, splitNameError ? { borderColor: "#EF4444" } : {}]}
              value={splitName}
              onChangeText={(t) => { setSplitName(t); setSplitNameError(""); }}
              placeholder="New zone name..."
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            {!!splitNameError && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color="#EF4444" />
                <Text style={styles.errorText}>{splitNameError}</Text>
              </View>
            )}
            <Text style={styles.colorLabel}>Zone Color</Text>
            <View style={styles.colorRow}>
              {ZONE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, splitColor === c && styles.colorDotActive]}
                  onPress={() => setSplitColor(c)}
                />
              ))}
            </View>
            <View style={styles.btnRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setSplitFormOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, !splitName.trim() && { opacity: 0.3 }]}
                onPress={handleConfirmSplit}
                disabled={!splitName.trim()}
              >
                <Feather name="scissors" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Split</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Archive Confirm */}
      <Modal
        visible={archiveZoneId != null}
        transparent
        animationType="slide"
        onRequestClose={() => setArchiveZoneId(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setArchiveZoneId(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Feather name="archive" size={18} color="#F59E0B" />
              <Text style={styles.sheetTitle}>Archive Zone</Text>
              <Pressable onPress={() => setArchiveZoneId(null)} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {archiveImpact?.hasActiveAlert ? (
              <>
                <View style={styles.alertWarning}>
                  <Feather name="alert-triangle" size={16} color="#EF4444" />
                  <Text style={styles.alertWarningText}>
                    Cannot archive — <Text style={{ fontFamily: "Inter_700Bold" }}>{archiveImpact.zoneName}</Text> has an active alert. Deactivate the alert first.
                  </Text>
                </View>
                <Pressable style={[styles.cancelBtn, { alignSelf: "flex-end" }]} onPress={() => setArchiveZoneId(null)}>
                  <Text style={styles.cancelBtnText}>Close</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sheetSub}>
                  <Text style={{ fontFamily: "Inter_700Bold" }}>{archiveImpact?.zoneName}</Text> will be hidden from active workflows. All data is preserved and can be restored.
                </Text>
                {(archiveImpact?.activeLocations ?? 0) > 0 && (
                  <View style={styles.impactRow}>
                    <Feather name="alert-circle" size={13} color="#F59E0B" />
                    <Text style={styles.impactText}>
                      {archiveImpact!.activeLocations} active location{archiveImpact!.activeLocations !== 1 ? "s" : ""} will be hidden from active workflows
                    </Text>
                  </View>
                )}
                <View style={styles.btnRow}>
                  <Pressable style={styles.cancelBtn} onPress={() => setArchiveZoneId(null)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: "#F59E0B" }]}
                    onPress={handleConfirmArchive}
                  >
                    <Feather name="archive" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Archive</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add / Edit Location */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowLocationModal(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingLocation ? "Edit Location" : "New Location"}</Text>
              <Pressable onPress={() => setShowLocationModal(false)} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={styles.textInput}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Location name..."
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            <Text style={styles.colorLabel}>Zone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {activeZones.map((z) => {
                const isSel = locationZoneId === z.id;
                return (
                  <Pressable
                    key={z.id}
                    style={[styles.zoneChip, isSel && { borderColor: z.color, backgroundColor: z.color + "18" }]}
                    onPress={() => setLocationZoneId(z.id)}
                  >
                    <View style={[styles.zoneDot, { width: 8, height: 8, backgroundColor: z.color }]} />
                    <Text style={[styles.zoneChipText, isSel && { color: z.color }]} numberOfLines={1}>
                      {z.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={[styles.btnRow, { marginTop: 4 }]}>
              {editingLocation && (
                <Pressable style={styles.deleteBtn} onPress={handleDeleteLocation}>
                  <Feather name="trash-2" size={16} color={Colors.primary} />
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable style={styles.cancelBtn} onPress={() => setShowLocationModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, { flex: 0, paddingHorizontal: 20 }, (!locationName.trim() || !locationZoneId) && { opacity: 0.3 }]}
                onPress={handleSaveLocation}
                disabled={!locationName.trim() || !locationZoneId}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>{editingLocation ? "Save" : "Add"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 1 },
  headerTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  headerBtnAccent: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.info, alignItems: "center", justifyContent: "center",
  },

  // Scroll
  scrollContent: { padding: 12, gap: 12 },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  emptyText: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center" },

  // Zone section card
  zoneSection: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  zoneHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  zoneHeaderInfo: { flex: 1, gap: 1 },
  zoneName: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.text },
  zoneMeta: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  zoneSwitch: { transform: [{ scale: 0.8 }] },
  menuBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.background,
  },
  cancelSelectBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  // Multi-select hint
  selectHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.info + "12",
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  selectHintText: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.info },

  // Empty zone
  emptyZone: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  emptyZoneText: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  emptyZoneAdd: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.info },

  // Location row
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderTopWidth: 1, borderTopColor: Colors.border, minHeight: 46,
  },
  rowSelected: { backgroundColor: Colors.info + "0D" },
  rowName: { flex: 1, fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  rowSwitch: { transform: [{ scale: 0.82 }] },
  rowEditBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },

  // Checkbox
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: "transparent", alignItems: "center", justifyContent: "center",
  },

  // Archived section
  archivedSection: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  archivedHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  archivedHeaderText: {
    flex: 1, fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary,
  },
  archivedRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  restoreBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.info + "15",
  },
  restoreBtnText: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.info },

  // Floating bar
  floatingBar: {
    position: "absolute", left: 14, right: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 100,
  },
  floatingCancelBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  floatingCancelText: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  floatingNextBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.info,
  },
  floatingNextText: { fontSize: FontSize.sm, fontFamily: "Inter_700Bold", color: "#fff" },

  // Overlay / Sheet
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 12,
  },
  sheetHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetTitle: { flex: 1, fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  sheetSub: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },

  // Menu items
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingVertical: 14, borderRadius: 10,
  },
  menuItemText: { flex: 1, fontSize: FontSize.md, fontFamily: "Inter_600SemiBold" },

  // Input
  textInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },

  // Error
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -4 },
  errorText: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: "#EF4444" },

  // Buttons
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelBtn: {
    paddingHorizontal: 16, minHeight: 44, justifyContent: "center", alignItems: "center",
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  cancelBtnText: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  primaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingHorizontal: 16, minHeight: 44, borderRadius: 10, backgroundColor: Colors.info,
  },
  primaryBtnText: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: "#fff" },
  deleteBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primaryDim, alignItems: "center", justifyContent: "center",
  },

  // Zone / location pickers
  pickerScroll: { maxHeight: 300 },
  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, marginBottom: 4,
  },
  pickerName: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  pickerMeta: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  // Merge confirm box
  mergeBox: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14, gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  mergeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mergeZoneName: { flex: 1, fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.text },
  mergeCount: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  mergeArrow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4, paddingVertical: 2 },
  mergeArrowLabel: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary },

  // Archive warning
  alertWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#EF444418", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#EF444430",
  },
  alertWarningText: { flex: 1, fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: "#EF4444" },
  impactRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  impactText: { flex: 1, fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: "#F59E0B", lineHeight: 18 },

  // Color picker
  colorLabel: {
    fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5,
  },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 2.5, borderColor: "#fff" },

  // Zone chip (location modal)
  zoneChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated, minHeight: 44,
  },
  zoneChipText: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
});
