import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { User, UserResponseStatus } from "@/types";

const SCREEN_H = Dimensions.get("window").height;
const UNASSIGNED_LOCATION = "Unassigned";

const STATUS_OPTIONS: { key: UserResponseStatus; label: string }[] = [
  { key: "confirmed", label: "Safe" },
  { key: "pending", label: "Pending" },
  { key: "need_help", label: "Need Help" },
];

const STATUS_PRIORITY: Record<string, number> = {
  need_help: 0,
  pending: 1,
  confirmed: 2,
};

type LocationGroup = {
  groupKey: string;
  locationId: number | null;
  locationName: string;
  zoneName: string;
  users: User[];
  safe: number;
  pending: number;
  needHelp: number;
  total: number;
  priority: number;
};

export default function UsersScreen() {
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const updateUserResponse = useStore((s) => s.updateUserResponse);

  const sectionListRef = useRef<SectionList>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"All" | UserResponseStatus>("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false);

  const activeZones = useMemo(
    () => zones.filter((z) => z.isActive),
    [zones]
  );

  const locationById = useMemo(() => {
    const map = new Map<number, typeof locations[0]>();
    for (const l of locations) map.set(l.id, l);
    return map;
  }, [locations]);

  const zoneOptions = useMemo(
    () => ["All", ...activeZones.map((z) => z.name)],
    [activeZones]
  );

  const filteredLocations = useMemo(() => {
    let locs = locations.filter((l) => l.isActive);
    if (selectedZone !== "All") {
      const zone = activeZones.find((z) => z.name === selectedZone);
      if (zone) locs = locs.filter((l) => l.zoneId === zone.id);
    }
    return locs;
  }, [locations, activeZones, selectedZone]);

  useEffect(() => {
    if (selectedLocationId !== null && !filteredLocations.some((l) => l.id === selectedLocationId)) {
      setSelectedLocationId(null);
    }
  }, [filteredLocations, selectedLocationId]);

  const locationGroups = useMemo(() => {
    let filtered = users.filter((u) => u.isActive);

    if (selectedZone !== "All") {
      const zone = activeZones.find((z) => z.name === selectedZone);
      if (zone) filtered = filtered.filter((u) => u.zoneId === zone.id);
    }

    if (selectedLocationId !== null) {
      filtered = filtered.filter((u) => u.locationId === selectedLocationId);
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter((u) => u.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.badge.toLowerCase().includes(q) ||
          (u.zone || "").toLowerCase().includes(q) ||
          (u.location || "").toLowerCase().includes(q)
      );
    }

    const groupMap = new Map<string, LocationGroup>();

    for (const u of filtered) {
      const loc = u.locationId ? locationById.get(u.locationId) ?? null : null;
      const key = loc ? `loc-${loc.id}` : UNASSIGNED_LOCATION;
      const zoneName = u.zone || "Unknown";

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupKey: key,
          locationId: loc?.id ?? null,
          locationName: loc?.name ?? UNASSIGNED_LOCATION,
          zoneName,
          users: [],
          safe: 0,
          pending: 0,
          needHelp: 0,
          total: 0,
          priority: 2,
        });
      }

      const group = groupMap.get(key)!;
      group.users.push(u);
      group.total++;
      if (u.status === "confirmed") group.safe++;
      else if (u.status === "pending") group.pending++;
      else if (u.status === "need_help") group.needHelp++;
    }

    const groups = Array.from(groupMap.values());

    for (const g of groups) {
      if (g.needHelp > 0) g.priority = 0;
      else if (g.pending > 0) g.priority = 1;
      else g.priority = 2;

      g.users.sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 2;
        const pb = STATUS_PRIORITY[b.status] ?? 2;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      });
    }

    groups.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.locationName.localeCompare(b.locationName);
    });

    return groups;
  }, [users, zones, locationById, activeZones, selectedZone, selectedLocationId, selectedStatus, searchQuery]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    for (const g of locationGroups) {
      const key = g.groupKey;
      if (expandedSections[key] !== undefined) {
        map[key] = expandedSections[key];
      } else {
        map[key] = g.needHelp > 0 || g.pending > 0;
      }
    }
    setExpandedSections(map);
  }, [locationGroups.map((g) => g.groupKey).join(",")]);

  const sections = useMemo(
    () =>
      locationGroups.map((g) => ({
        ...g,
        data: expandedSections[g.groupKey] ? g.users : [],
      })),
    [locationGroups, expandedSections]
  );

  const totalFiltered = useMemo(
    () => locationGroups.reduce((sum, g) => sum + g.total, 0),
    [locationGroups]
  );
  const totalSafe = useMemo(
    () => locationGroups.reduce((sum, g) => sum + g.safe, 0),
    [locationGroups]
  );
  const totalPending = useMemo(
    () => locationGroups.reduce((sum, g) => sum + g.pending, 0),
    [locationGroups]
  );
  const totalNeedHelp = useMemo(
    () => locationGroups.reduce((sum, g) => sum + g.needHelp, 0),
    [locationGroups]
  );

  const toggleSection = useCallback((groupKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) next[key] = true;
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) next[key] = false;
      return next;
    });
  }, []);

  const jumpToSection = useCallback(
    (groupKey: string) => {
      setJumpMenuOpen(false);
      const idx = sections.findIndex((s) => s.groupKey === groupKey);
      if (idx >= 0 && sectionListRef.current) {
        if (!expandedSections[groupKey]) {
          setExpandedSections((prev) => ({ ...prev, [groupKey]: true }));
        }
        setTimeout(() => {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: idx,
            itemIndex: 0,
            viewOffset: 0,
            animated: true,
          });
        }, 50);
      }
    },
    [sections, expandedSections]
  );

  const handleStatusUpdate = useCallback(
    (userId: number, status: UserResponseStatus) => {
      updateUserResponse(userId, status);
      setSelectedUser(null);
    },
    [updateUserResponse]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: LocationGroup & { data: User[] } }) => {
      const expanded = expandedSections[section.groupKey] ?? false;
      return (
        <Pressable
          onPress={() => toggleSection(section.groupKey)}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionHeaderTop}>
            <View style={styles.sectionTitleRow}>
              <Feather
                name={expanded ? "chevron-down" : "chevron-right"}
                size={16}
                color={Colors.text}
              />
              <Text style={styles.sectionTitle}>{section.locationName}</Text>
            </View>
            <Text style={styles.sectionCount}>{section.total}</Text>
          </View>
          <View style={styles.sectionStatsRow}>
            {section.needHelp > 0 && (
              <View style={[styles.sectionStatBadge, styles.statBadgeHelp]}>
                <Text style={[styles.sectionStatText, styles.statTextHelp]}>
                  {section.needHelp} Help
                </Text>
              </View>
            )}
            <View style={[styles.sectionStatBadge, styles.statBadgePending]}>
              <Text style={[styles.sectionStatText, styles.statTextPending]}>
                {section.pending} Pending
              </Text>
            </View>
            <View style={[styles.sectionStatBadge, styles.statBadgeSafe]}>
              <Text style={[styles.sectionStatText, styles.statTextSafe]}>
                {section.safe} Safe
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [expandedSections, toggleSection]
  );

  const renderUserCard = useCallback(
    ({ item }: { item: User }) => (
      <Pressable onPress={() => setSelectedUser(item)}>
        <View style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <View
              style={[
                styles.userAvatar,
                item.status === "need_help" && styles.avatarHelp,
                item.status === "pending" && styles.avatarPending,
                item.status === "confirmed" && styles.avatarSafe,
              ]}
            >
              <Text
                style={[
                  styles.userAvatarText,
                  item.status === "need_help" && styles.avatarTextHelp,
                  item.status === "confirmed" && styles.avatarTextSafe,
                ]}
              >
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userBadge}>
                {item.badge}
                {item.userType === "Contract" ? " · Contractor" : ""}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        </View>
      </Pressable>
    ),
    []
  );

  const statusFilterOptions: { key: "All" | UserResponseStatus; label: string; color?: string }[] = [
    { key: "All", label: "All" },
    { key: "confirmed", label: "Safe" },
    { key: "pending", label: "Pending" },
    { key: "need_help", label: "Help" },
  ];

  return (
    <View style={styles.container}>
      <Header title="Users" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={15} color={Colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, badge, zone, location..."
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Feather name="x" size={14} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {zoneOptions.map((zone) => (
            <Pressable
              key={zone}
              style={[
                styles.filterChip,
                selectedZone === zone && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedZone(zone);
                setSelectedLocationId(null);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedZone === zone && styles.filterChipTextActive,
                ]}
              >
                {zone}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {filteredLocations.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <Pressable
              style={[
                styles.filterChip,
                styles.filterChipLocation,
                selectedLocationId === null && styles.filterChipLocationActive,
              ]}
              onPress={() => setSelectedLocationId(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedLocationId === null && styles.filterChipTextLocationActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {filteredLocations.map((loc) => (
              <Pressable
                key={loc.id}
                style={[
                  styles.filterChip,
                  styles.filterChipLocation,
                  selectedLocationId === loc.id && styles.filterChipLocationActive,
                ]}
                onPress={() => setSelectedLocationId(loc.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocationId === loc.id && styles.filterChipTextLocationActive,
                  ]}
                >
                  {loc.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusScrollContent}
        >
          {statusFilterOptions.map((opt) => (
            <Pressable
              key={opt.key}
              style={[
                styles.filterChip,
                selectedStatus === opt.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(opt.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === opt.key && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.jumpBtn}
            onPress={() => setJumpMenuOpen(true)}
          >
            <Feather name="list" size={14} color={Colors.primary} />
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryTotal}>{totalFiltered} users</Text>
        <View style={styles.summaryStats}>
          {totalNeedHelp > 0 && (
            <Text style={[styles.summaryStatText, { color: Colors.destructive }]}>
              {totalNeedHelp} Help
            </Text>
          )}
          <Text style={[styles.summaryStatText, { color: Colors.amber }]}>
            {totalPending} Pending
          </Text>
          <Text style={[styles.summaryStatText, { color: Colors.safe }]}>
            {totalSafe} Safe
          </Text>
        </View>
        <View style={styles.expandCollapseRow}>
          <Pressable onPress={expandAll} style={styles.expandCollapseBtn}>
            <Text style={styles.expandCollapseText}>Expand all</Text>
          </Pressable>
          <Text style={styles.expandCollapseDivider}>·</Text>
          <Pressable onPress={collapseAll} style={styles.expandCollapseBtn}>
            <Text style={styles.expandCollapseText}>Collapse all</Text>
          </Pressable>
        </View>
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader as any}
        renderItem={renderUserCard}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={36} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or search
            </Text>
          </View>
        }
      />

      <Modal
        visible={jumpMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setJumpMenuOpen(false)}
      >
        <Pressable
          style={styles.jumpOverlay}
          onPress={() => setJumpMenuOpen(false)}
        >
          <View style={styles.jumpContent}>
            <Text style={styles.jumpTitle}>Jump to Location</Text>
            <ScrollView style={styles.jumpScroll}>
              {locationGroups.map((g) => (
                <Pressable
                  key={g.groupKey}
                  style={styles.jumpItem}
                  onPress={() => jumpToSection(g.groupKey)}
                >
                  <View style={styles.jumpItemLeft}>
                    <View
                      style={[
                        styles.jumpDot,
                        g.needHelp > 0
                          ? styles.dotHelp
                          : g.pending > 0
                          ? styles.dotPending
                          : styles.dotSafe,
                      ]}
                    />
                    <Text style={styles.jumpItemText}>{g.locationName}</Text>
                  </View>
                  <Text style={styles.jumpItemCount}>{g.total}</Text>
                </Pressable>
              ))}
              {locationGroups.length === 0 && (
                <Text style={styles.jumpEmpty}>No locations to show</Text>
              )}
            </ScrollView>
            <Pressable
              style={styles.jumpCloseBtn}
              onPress={() => setJumpMenuOpen(false)}
            >
              <Text style={styles.jumpCloseText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <StatusBadge status={selectedUser.status} />
                </View>

                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Badge</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.badge}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Role</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.role}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Zone</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.zone}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Location</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.location}</Text>
                  </View>
                  {selectedUser.userType && (
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Type</Text>
                      <Text style={styles.modalDetailValue}>{selectedUser.userType}</Text>
                    </View>
                  )}
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Account</Text>
                    <StatusBadge
                      status={selectedUser.accountStatus === "active" ? "enabled" : "disabled"}
                    />
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Last Active</Text>
                    <Text style={styles.modalDetailValue}>
                      {format(new Date(selectedUser.lastActivity), "MMM d, HH:mm")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Update Status</Text>
                <View style={styles.statusGrid}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.statusBtn,
                        selectedUser.status === opt.key && styles.statusBtnActive,
                      ]}
                      onPress={() => handleStatusUpdate(selectedUser.id, opt.key)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          selectedUser.status === opt.key && styles.statusBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => setSelectedUser(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  searchWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 0,
    paddingRight: 12,
    height: 40,
  },
  clearBtn: {
    paddingHorizontal: 10,
    height: 40,
    justifyContent: "center",
  },

  filterSection: {
    marginTop: 8,
    paddingHorizontal: 0,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    paddingRight: 16,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  statusScrollContent: {
    paddingHorizontal: 12,
    paddingRight: 16,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 10,
    height: 30,
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipLocation: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
  },
  filterChipLocationActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterChipTextLocationActive: {
    color: Colors.white,
  },

  jumpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  summaryTotal: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  summaryStats: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  summaryStatText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  expandCollapseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expandCollapseBtn: {
    paddingVertical: 2,
  },
  expandCollapseText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  expandCollapseDivider: {
    fontSize: 11,
    color: Colors.textTertiary,
  },

  listContent: {
    paddingBottom: 80,
  },

  sectionHeader: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  sectionHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  sectionStatsRow: {
    flexDirection: "row",
    gap: 6,
    paddingLeft: 22,
  },
  sectionStatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statBadgeHelp: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
  },
  statBadgePending: {
    backgroundColor: "rgba(217, 119, 6, 0.08)",
  },
  statBadgeSafe: {
    backgroundColor: "rgba(22, 163, 74, 0.08)",
  },
  sectionStatText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  statTextHelp: {
    color: Colors.destructive,
  },
  statTextPending: {
    color: Colors.amber,
  },
  statTextSafe: {
    color: Colors.safe,
  },

  userCard: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHelp: {
    backgroundColor: "rgba(220, 38, 38, 0.12)",
  },
  avatarPending: {
    backgroundColor: "rgba(217, 119, 6, 0.08)",
  },
  avatarSafe: {
    backgroundColor: "rgba(22, 163, 74, 0.08)",
  },
  avatarTextHelp: {
    color: Colors.destructive,
  },
  avatarTextSafe: {
    color: Colors.safe,
  },
  userAvatarText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  userInfo: {
    flex: 1,
    gap: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  userBadge: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  jumpOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  jumpContent: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    maxWidth: 340,
    maxHeight: SCREEN_H * 0.5,
    gap: 10,
  },
  jumpTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  jumpScroll: {
    maxHeight: SCREEN_H * 0.35,
  },
  jumpItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  jumpItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  jumpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotHelp: {
    backgroundColor: Colors.destructive,
  },
  dotPending: {
    backgroundColor: Colors.amber,
  },
  dotSafe: {
    backgroundColor: Colors.safe,
  },
  jumpItemText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  jumpItemCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  jumpEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: 20,
  },
  jumpCloseBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  jumpCloseText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    maxWidth: 380,
    maxHeight: SCREEN_H * 0.7,
    gap: 10,
  },
  modalHeader: {
    alignItems: "center",
    gap: 6,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  modalName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalDetails: {
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalDetailLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  modalDetailValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusBtn: {
    width: "48.5%" as any,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  statusBtnTextActive: {
    color: Colors.white,
  },
  closeBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
});
