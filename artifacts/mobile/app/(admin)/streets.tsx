import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStore } from "@/store";
import { ZoneMap } from "@/components/map";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import type { LatLng, Street } from "@/types";

type Mode = "view" | "draw" | "edit";

export default function StreetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const streets = useStore((s) => s.streets);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const addStreet = useStore((s) => s.addStreet);
  const updateStreet = useStore((s) => s.updateStreet);
  const deleteStreet = useStore((s) => s.deleteStreet);
  const duplicateStreet = useStore((s) => s.duplicateStreet);

  const [mode, setMode] = useState<Mode>("view");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<LatLng[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [showList, setShowList] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const drawPointsRef = useRef<LatLng[]>([]);

  useEffect(() => {
    return () => { (window as any).__streetDrawPoints = undefined; };
  }, []);

  const selectedStreet = selectedId ? streets.find((s) => s.id === selectedId) : null;

  const handleStreetPress = useCallback((id: string) => {
    if (mode !== "view") return;
    setSelectedId(id);
  }, [mode]);

  const startDraw = useCallback(() => {
    setSelectedId(null);
    setEditingId(null);
    setMode("draw");
    setDrawMode(true);
    drawPointsRef.current = [];
  }, []);

  const finishDraw = useCallback(() => {
    const points = (window as any).__streetDrawPoints || drawPointsRef.current;
    if (points.length < 2) {
      setMode("view");
      setDrawMode(false);
      return;
    }
    const newStreet = addStreet(points);
    setDrawMode(false);
    setMode("view");
    setSelectedId(newStreet.id);
    (window as any).__streetDrawPoints = undefined;
  }, [addStreet]);

  const cancelDraw = useCallback(() => {
    setDrawMode(false);
    setMode("view");
    (window as any).__streetDrawPoints = undefined;
  }, []);

  const startEdit = useCallback(() => {
    if (!selectedStreet) return;
    setEditingId(selectedStreet.id);
    setEditingPoints(selectedStreet.path);
    setMode("edit");
  }, [selectedStreet]);

  const saveEdit = useCallback(() => {
    if (editingId && editingPoints.length >= 2) {
      updateStreet(editingId, { path: editingPoints });
    }
    setEditingId(null);
    setEditingPoints([]);
    setMode("view");
  }, [editingId, editingPoints, updateStreet]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingPoints([]);
    setMode("view");
  }, []);

  const handleRename = useCallback(() => {
    if (selectedId && renameText.trim()) {
      updateStreet(selectedId, { name: renameText.trim() });
    }
    setShowRenameModal(false);
  }, [selectedId, renameText, updateStreet]);

  const handleDelete = useCallback(() => {
    if (selectedId) {
      deleteStreet(selectedId);
      setSelectedId(null);
    }
    setShowDeleteConfirm(false);
  }, [selectedId, deleteStreet]);

  const handleDuplicate = useCallback(() => {
    if (selectedId) {
      const copy = duplicateStreet(selectedId);
      if (copy) setSelectedId(copy.id);
    }
  }, [selectedId, duplicateStreet]);

  const handleEditingPointsChange = useCallback((points: LatLng[]) => {
    setEditingPoints(points);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { if (router.canGoBack()) router.back(); }}
          hitSlop={8}
        >
          <Feather name="chevron-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name="git-branch" size={16} color={Colors.primary} />
          <Text style={styles.headerTitle}>Street Segments</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{streets.length}</Text>
          </View>
        </View>
        <Pressable style={styles.listBtn} onPress={() => setShowList(true)} hitSlop={8}>
          <Feather name="list" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.mapWrapper}>
        <ZoneMap
          zones={zones}
          selectedZoneId={null}
          onZonePress={() => {}}
          height={Dimensions.get("window").height}
          showLabels
          locations={locations}
          shelters={shelters}
          streets={streets}
          selectedStreetId={selectedId}
          onStreetPress={handleStreetPress}
          editingStreetId={editingId}
          editingStreetPoints={editingPoints}
          onEditingStreetPointsChange={handleEditingPointsChange}
          streetDrawMode={drawMode}
        />

        {mode === "view" && (
          <View style={[styles.toolbar, { bottom: insets.bottom + 16 }]}>
            <Pressable style={styles.addBtn} onPress={startDraw}>
              <Feather name="plus" size={22} color="#fff" />
              <Text style={styles.addBtnText}>Draw Street</Text>
            </Pressable>
          </View>
        )}

        {mode === "draw" && (
          <View style={[styles.toolbar, { bottom: insets.bottom + 16 }]}>
            <Pressable style={styles.cancelBtn} onPress={cancelDraw}>
              <Feather name="x" size={18} color={Colors.text} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={finishDraw}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Street</Text>
            </Pressable>
          </View>
        )}

        {mode === "draw" && (
          <View style={[styles.drawHint, { top: insets.top + 56 }]}>
            <Feather name="info" size={14} color="#fff" />
            <Text style={styles.drawHintText}>
              Tap on the map to add points to the street path. At least 2 points required.
            </Text>
          </View>
        )}

        {mode === "edit" && (
          <View style={[styles.toolbar, { bottom: insets.bottom + 16 }]}>
            <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
              <Feather name="x" size={18} color={Colors.text} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={saveEdit}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        )}

        {mode === "edit" && (
          <View style={[styles.drawHint, { top: insets.top + 56 }]}>
            <Feather name="move" size={14} color="#fff" />
            <Text style={styles.drawHintText}>
              Drag the blue points to adjust the street path.
            </Text>
          </View>
        )}

        {mode === "view" && selectedStreet && (
          <View style={[styles.detailPanel, { bottom: insets.bottom + 72 }]}>
            <View style={styles.detailHeader}>
              <View style={styles.detailNameRow}>
                <Feather name="git-branch" size={16} color={Colors.primary} />
                <Text style={styles.detailName} numberOfLines={1}>{selectedStreet.name}</Text>
              </View>
              <Pressable onPress={() => setSelectedId(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textTertiary} />
              </Pressable>
            </View>
            <Text style={styles.detailMeta}>
              {selectedStreet.path.length} points · Created {new Date(selectedStreet.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.detailActions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => {
                  setRenameText(selectedStreet.name);
                  setShowRenameModal(true);
                }}
              >
                <Feather name="edit-2" size={14} color={Colors.primary} />
                <Text style={styles.actionBtnText}>Rename</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={startEdit}>
                <Feather name="move" size={14} color={Colors.info} />
                <Text style={styles.actionBtnText}>Edit Path</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleDuplicate}>
                <Feather name="copy" size={14} color={Colors.textSecondary} />
                <Text style={styles.actionBtnText}>Duplicate</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Feather name="trash-2" size={14} color={Colors.danger} />
                <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRenameModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Rename Street</Text>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Enter street name"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowRenameModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleRename}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteConfirm(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.deleteIconWrap}>
              <Feather name="trash-2" size={28} color={Colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Delete Street</Text>
            <Text style={styles.modalMessage}>
              Delete "{selectedStreet?.name}"? This cannot be undone.
            </Text>
            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDeleteBtn} onPress={handleDelete}>
                <Text style={styles.modalSaveText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowList(false)}
      >
        <View style={[styles.listOverlay, { paddingTop: insets.top }]}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>All Streets ({streets.length})</Text>
            <Pressable onPress={() => setShowList(false)} hitSlop={8}>
              <Feather name="x" size={20} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {streets.length === 0 && (
              <View style={styles.emptyList}>
                <Feather name="git-branch" size={36} color={Colors.textTertiary} />
                <Text style={styles.emptyListText}>No streets created yet</Text>
                <Text style={styles.emptyListSub}>Tap "Draw Street" on the map to create one</Text>
              </View>
            )}
            {streets.map((st) => (
              <Pressable
                key={st.id}
                style={[
                  styles.listItem,
                  st.id === selectedId && styles.listItemSelected,
                ]}
                onPress={() => {
                  setSelectedId(st.id);
                  setShowList(false);
                }}
              >
                <View style={styles.listItemIcon}>
                  <Feather name="git-branch" size={16} color={st.id === selectedId ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName} numberOfLines={1}>{st.name}</Text>
                  <Text style={styles.listItemMeta}>
                    {st.path.length} points · {new Date(st.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
  },
  headerTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary,
  },
  listBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  mapWrapper: { flex: 1, position: "relative" },

  toolbar: {
    position: "absolute",
    left: 16, right: 16,
    flexDirection: "row", gap: 10,
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primary,
    height: 48, paddingHorizontal: 24, borderRadius: 24,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  addBtnText: {
    fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff",
  },
  cancelBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.surface, height: 44, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  saveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.primary, height: 44, borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff",
  },

  drawHint: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.75)", padding: 12, borderRadius: 10,
  },
  drawHintText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#fff",
  },

  detailPanel: {
    position: "absolute", left: 12, right: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  detailHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  detailNameRow: {
    flexDirection: "row", alignItems: "center", gap: 8, flex: 1,
  },
  detailName: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, flex: 1,
  },
  detailMeta: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
  },
  detailActions: {
    flexDirection: "row", gap: 8, marginTop: 4,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    height: 36, borderRadius: 8, backgroundColor: Colors.background,
  },
  actionBtnText: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  modalSheet: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    width: "100%", maxWidth: 340, gap: 14, alignItems: "center",
  },
  modalTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  modalMessage: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
    textAlign: "center",
  },
  renameInput: {
    width: "100%", height: 44, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  modalBtnRow: {
    flexDirection: "row", gap: 10, width: "100%",
  },
  modalCancelBtn: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  modalSaveBtn: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  modalDeleteBtn: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: Colors.danger,
    alignItems: "center", justifyContent: "center",
  },
  modalSaveText: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff",
  },
  deleteIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center",
  },

  listOverlay: {
    flex: 1, backgroundColor: Colors.background,
  },
  listHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  listTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  listScroll: { flex: 1 },
  listContent: { padding: 16, gap: 8 },
  listItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  listItemSelected: {
    borderColor: Colors.primary, backgroundColor: Colors.primaryDim,
  },
  listItemIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center", justifyContent: "center",
  },
  listItemInfo: { flex: 1, gap: 2 },
  listItemName: {
    fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  listItemMeta: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
  },
  emptyList: {
    alignItems: "center", justifyContent: "center", padding: 40, gap: 12,
  },
  emptyListText: {
    fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
  },
  emptyListSub: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
    textAlign: "center",
  },
});
