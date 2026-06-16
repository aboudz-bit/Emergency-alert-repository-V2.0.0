import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { WindIndicator } from "@/components/ui/WindIndicator";
import { WindDirectionPicker } from "@/components/ui/WindDirectionPicker";
import { ZoneMap } from "@/components/map";
import { MapLegendCounts } from "@/components/map/MapLegendCounts";
import { MapOverlayLayout } from "@/components/map/MapOverlayLayout";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectCanChangeWindDirection } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useVisiblePersonnel, type PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import { usePersonnelSimulation } from "@/hooks/usePersonnelSimulation";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { useEmergencyIntelligence } from "@/hooks/useEmergencyIntelligence";
import { SmartAlertPanel } from "@/components/ui/SmartAlertPanel";
import IncidentTimelinePanel from "@/components/ui/IncidentTimelinePanel";
import { areStreetsConnected } from "@/store/slices/routes";
import type { UserResponseStatus, WindDirection, Street } from "@/types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const selectCanChangeWind = selectCanChangeWindDirection;

export default function ECOLiveMapScreen() {
  const insets = useSafeAreaInsets();
  const focusCount = useRefreshOnFocus();
  const { activeAlert, emergencyMode, activeZoneIds } = useAlertSystemState();
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const hazardZones = useStore((s) => s.hazardZones);
  const streets = useStore((s) => s.streets);
  const currentUser = useStore((s) => s.currentUser);
  const createRoute = useStore((s) => s.createRoute);
  const ecoRoutes = useStore((s) => s.ecoRoutes);

  const hasActiveAlert = emergencyMode !== null;
  usePersonnelSimulation(hasActiveAlert);

  const visiblePersonnel = useVisiblePersonnel({
    scope: "zone",
    zoneIds: activeZoneIds,
    enabled: hasActiveAlert,
  });

  const visiblePersonnelRef = useRef(visiblePersonnel);
  visiblePersonnelRef.current = visiblePersonnel;

  const windDirection = useStore((s) => s.windDirection);
  const setWindDirection = useStore((s) => s.setWindDirection);
  const canChangeWind = useStore(selectCanChangeWind);
  const windDirectionDeg = useMemo(
    () => WIND_DIRECTIONS.find((w) => w.key === windDirection)?.degrees ?? null,
    [windDirection],
  );
  const [windPickerVisible, setWindPickerVisible] = useState(false);

  const intelligence = useEmergencyIntelligence({
    type: "zone",
    zoneId: activeZoneIds.length === 1 ? activeZoneIds[0] : undefined,
  });

  const [intelTrackedIds, setIntelTrackedIds] = useState<number[]>([]);
  const [fitTrigger, setFitTrigger] = useState(0);

  const handleIntelFocusZone = useCallback((zoneId: number) => {
    const zoneIntel = intelligence.zones.find((z) => z.zoneId === zoneId);
    if (zoneIntel) {
      const ids = [...(zoneIntel.locations.flatMap((l) => [...l.needHelpUserIds, ...l.criticalUserIds]))];
      setIntelTrackedIds(ids);
      setFitTrigger((v) => v + 1);
    }
  }, [intelligence.zones]);

  const handleIntelFocusLocation = useCallback((locationId: number) => {
    for (const z of intelligence.zones) {
      const loc = z.locations.find((l) => l.locationId === locationId);
      if (loc) {
        const ids = [...loc.needHelpUserIds, ...loc.criticalUserIds];
        setIntelTrackedIds(ids);
        setFitTrigger((v) => v + 1);
        break;
      }
    }
  }, [intelligence.zones]);

  const [personnelDetail, setPersonnelDetail] = useState<PersonnelMapEntry | null>(null);

  const handlePersonnelPress = useCallback((userId: number) => {
    const p = visiblePersonnelRef.current.find((v) => v.userId === userId);
    if (p) setPersonnelDetail(p);
  }, []);

  const activeHazardZones = useMemo(
    () => hazardZones.filter((hz) => hz.isActive && (hz.alertId == null || (activeAlert && hz.alertId === activeAlert.id))),
    [hazardZones, activeAlert]
  );

  const [routeMode, setRouteMode] = useState(false);
  const [routeStreetIds, setRouteStreetIds] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeConfirmed, setRouteConfirmed] = useState(false);

  const activeRouteIds = useMemo(() => {
    if (routeMode) return routeStreetIds;
    const active = ecoRoutes.filter(r => r.status === "active");
    if (active.length > 0) return active[active.length - 1].streetIds;
    return [];
  }, [routeMode, routeStreetIds, ecoRoutes]);

  const routeLength = useMemo(() => {
    let total = 0;
    for (const sid of routeStreetIds) {
      const st = streets.find(s => s.id === sid);
      if (st && st.path.length >= 2) {
        for (let i = 1; i < st.path.length; i++) {
          const dLat = st.path[i].lat - st.path[i - 1].lat;
          const dLng = st.path[i].lng - st.path[i - 1].lng;
          const avgLat = (st.path[i].lat + st.path[i - 1].lat) / 2;
          const mLat = dLat * 111320;
          const mLng = dLng * 111320 * Math.cos(avgLat * Math.PI / 180);
          total += Math.sqrt(mLat * mLat + mLng * mLng);
        }
      }
    }
    return total;
  }, [routeStreetIds, streets]);

  const handleRouteStreetPress = useCallback((streetId: string) => {
    if (!routeMode) return;
    setRouteError(null);

    const alreadyIdx = routeStreetIds.indexOf(streetId);
    if (alreadyIdx !== -1) {
      if (alreadyIdx === routeStreetIds.length - 1) {
        setRouteStreetIds(prev => prev.slice(0, -1));
      }
      return;
    }

    const tappedStreet = streets.find(s => s.id === streetId);
    if (!tappedStreet) return;

    if (routeStreetIds.length === 0) {
      setRouteStreetIds([streetId]);
      return;
    }

    const lastStreet = streets.find(s => s.id === routeStreetIds[routeStreetIds.length - 1]);
    if (!lastStreet) return;

    if (areStreetsConnected(lastStreet, tappedStreet)) {
      setRouteStreetIds(prev => [...prev, streetId]);
    } else {
      setRouteError("Street not connected to route");
      setTimeout(() => setRouteError(null), 2500);
    }
  }, [routeMode, routeStreetIds, streets]);

  const handleUndoRoute = useCallback(() => {
    setRouteStreetIds(prev => prev.slice(0, -1));
    setRouteError(null);
  }, []);

  const handleClearRoute = useCallback(() => {
    setRouteStreetIds([]);
    setRouteError(null);
  }, []);

  const handleConfirmRoute = useCallback(() => {
    if (routeStreetIds.length < 1 || !currentUser) return;
    createRoute(routeStreetIds, currentUser.id);
    setRouteConfirmed(true);
    setTimeout(() => {
      setRouteMode(false);
      setRouteStreetIds([]);
      setRouteConfirmed(false);
    }, 1500);
  }, [routeStreetIds, currentUser, createRoute]);

  const handleStartRoute = useCallback(() => {
    setRouteMode(true);
    setRouteStreetIds([]);
    setRouteError(null);
    setRouteConfirmed(false);
  }, []);

  const handleExitRoute = useCallback(() => {
    setRouteMode(false);
    setRouteStreetIds([]);
    setRouteError(null);
  }, []);

  const windControlBtn = canChangeWind ? (
    <Pressable
      style={[styles.windButton, windDirection != null && styles.windButtonActive]}
      onPress={() => setWindPickerVisible(true)}
    >
      <Feather name="wind" size={18} color={windDirection ? Colors.white : Colors.primary} />
    </Pressable>
  ) : null;

  const windPicker = canChangeWind ? (
    <WindDirectionPicker
      visible={windPickerVisible}
      current={windDirection}
      onSelect={(dir) => setWindDirection(dir)}
      onClose={() => setWindPickerVisible(false)}
    />
  ) : null;

  if (!activeAlert) {
    return (
      <View style={styles.container}>
        <ZoneMap
          key={focusCount}
          zones={zones}
          selectedZoneId={null}
          onZonePress={() => {}}
          height={SCREEN_HEIGHT}
          showLabels
          locations={locations}
          shelters={shelters}
          streets={streets}
          routeStreetIds={activeRouteIds.length > 0 ? activeRouteIds : undefined}
        />
        <MapOverlayLayout
          topRight={
            <>
              <WindIndicator />
              {windControlBtn}
            </>
          }
        />
        {windPicker}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ZoneMap
        key={focusCount}
        zones={zones}
        selectedZoneId={null}
        onZonePress={() => {}}
        height={SCREEN_HEIGHT}
        showLabels
        locations={locations}
        shelters={shelters}
        personnelLocations={visiblePersonnel}
        onPersonnelPress={handlePersonnelPress}
        hazardZones={activeHazardZones}
        trackedUserIds={intelTrackedIds}
        fitTrackedTrigger={fitTrigger}
        streets={streets}
        onStreetPress={routeMode ? handleRouteStreetPress : undefined}
        routeStreetIds={activeRouteIds.length > 0 ? activeRouteIds : undefined}
      />

      <MapOverlayLayout
        topLeft={
          <>
            <View style={styles.floatingBar}>
              <View style={styles.alertInfoRow}>
                <View style={styles.alertDot} />
                <Text style={styles.alertTypeText}>{activeAlert.type}</Text>
                <Text style={styles.alertSep}>{"\u00B7"}</Text>
                <Text style={styles.alertZoneText}>{activeAlert.zone}</Text>
                <Text style={styles.alertSep}>{"\u00B7"}</Text>
                <Text style={styles.alertTimeText}>
                  {format(new Date(activeAlert.timestamp), "HH:mm")}
                </Text>
              </View>
            </View>
            <SmartAlertPanel
              intelligence={intelligence}
              onFocusZone={handleIntelFocusZone}
              onFocusLocation={handleIntelFocusLocation}
            />
            <IncidentTimelinePanel />
          </>
        }
        topRight={
          <>
            <WindIndicator />
            {windControlBtn}
          </>
        }
        bottomCenter={<MapLegendCounts personnel={visiblePersonnel} />}
      />
      {windPicker}

      {!routeMode && (
        <View style={[styles.routeFab, { bottom: insets.bottom + 80 }]}>
          <Pressable
            style={styles.routeFabBtn}
            onPress={handleStartRoute}
            accessibilityRole="button"
            accessibilityLabel="Start route mode"
          >
            <Feather name="navigation" size={20} color="#fff" />
            <Text style={styles.routeFabText}>Route Mode</Text>
          </Pressable>
        </View>
      )}

      {routeMode && (
        <>
          <View style={[styles.routePanel, { bottom: insets.bottom + 16 }]}>
            <View style={styles.routePanelHeader}>
              <View style={styles.routeTitleRow}>
                <Feather name="navigation" size={16} color="#10B981" />
                <Text style={styles.routePanelTitle}>ECO Route Builder</Text>
              </View>
              <View style={styles.routeStatRow}>
                <Text style={styles.routeStatLabel}>{routeStreetIds.length} street{routeStreetIds.length !== 1 ? "s" : ""}</Text>
                {routeLength > 0 && (
                  <>
                    <Text style={styles.routeStatSep}>{"\u00B7"}</Text>
                    <Text style={styles.routeStatLabel}>
                      {routeLength < 1000
                        ? `${Math.round(routeLength)}m`
                        : `${(routeLength / 1000).toFixed(1)}km`}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {routeStreetIds.length === 0 && !routeConfirmed && (
              <Text style={styles.routeHint}>Tap streets on the map to build a route</Text>
            )}

            {routeStreetIds.length > 0 && !routeConfirmed && (
              <View style={styles.routeSteps}>
                {routeStreetIds.map((sid, i) => {
                  const st = streets.find(s => s.id === sid);
                  return (
                    <View key={sid} style={styles.routeStep}>
                      <View style={styles.routeStepDot}>
                        <Text style={styles.routeStepNum}>{i + 1}</Text>
                      </View>
                      <Text style={styles.routeStepName} numberOfLines={1}>{st?.name ?? sid}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {routeConfirmed && (
              <View style={styles.routeConfirmedRow}>
                <Feather name="check-circle" size={20} color="#10B981" />
                <Text style={styles.routeConfirmedText}>Route confirmed!</Text>
              </View>
            )}

            {!routeConfirmed && (
              <View style={styles.routeBtnRow}>
                <Pressable
                  style={styles.routeBtnSecondary}
                  onPress={handleExitRoute}
                  accessibilityRole="button"
                  accessibilityLabel="Exit route mode"
                >
                  <Feather name="x" size={16} color={Colors.text} />
                  <Text style={styles.routeBtnSecText}>Exit</Text>
                </Pressable>
                <Pressable
                  style={[styles.routeBtnSecondary, routeStreetIds.length === 0 && styles.routeBtnDisabled]}
                  onPress={handleUndoRoute}
                  disabled={routeStreetIds.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Undo last route segment"
                >
                  <Feather name="corner-up-left" size={16} color={routeStreetIds.length === 0 ? Colors.textTertiary : Colors.text} />
                  <Text style={[styles.routeBtnSecText, routeStreetIds.length === 0 && styles.routeBtnDisabledText]}>Undo</Text>
                </Pressable>
                <Pressable
                  style={[styles.routeBtnSecondary, routeStreetIds.length === 0 && styles.routeBtnDisabled]}
                  onPress={handleClearRoute}
                  disabled={routeStreetIds.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Clear route"
                >
                  <Feather name="trash-2" size={16} color={routeStreetIds.length === 0 ? Colors.textTertiary : Colors.danger} />
                  <Text style={[styles.routeBtnSecText, routeStreetIds.length === 0 && styles.routeBtnDisabledText]}>Clear</Text>
                </Pressable>
                <Pressable
                  style={[styles.routeBtnConfirm, routeStreetIds.length === 0 && styles.routeBtnDisabled]}
                  onPress={handleConfirmRoute}
                  disabled={routeStreetIds.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm route"
                >
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.routeBtnConfirmText}>Confirm</Text>
                </Pressable>
              </View>
            )}
          </View>

          {routeError && (
            <View style={[styles.routeErrorBanner, { bottom: insets.bottom + 220 }]}>
              <Feather name="alert-circle" size={16} color="#fff" />
              <Text style={styles.routeErrorText}>{routeError}</Text>
            </View>
          )}
        </>
      )}

      <Modal
        visible={personnelDetail !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPersonnelDetail(null)}
      >
        <Pressable style={styles.detailOverlay} onPress={() => setPersonnelDetail(null)}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailAvatar, {
                backgroundColor: personnelDetail?.status === 'confirmed' ? Colors.safeDim
                  : personnelDetail?.status === 'need_help' ? Colors.primaryDim
                  : Colors.surfaceElevated
              }]}>
                <Text style={[styles.detailAvatarText, {
                  color: personnelDetail?.status === 'confirmed' ? Colors.safe
                    : personnelDetail?.status === 'need_help' ? Colors.primary
                    : Colors.textSecondary
                }]}>
                  {personnelDetail?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={styles.detailHeaderInfo}>
                <Text style={styles.detailName}>{personnelDetail?.name}</Text>
                <Text style={styles.detailBadge}>{personnelDetail?.badge}</Text>
              </View>
              <Pressable style={styles.detailClose} onPress={() => setPersonnelDetail(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <Feather name="shield" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{personnelDetail?.role || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="phone" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{personnelDetail?.mobileNumber || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="activity" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Status</Text>
                <StatusBadge status={personnelDetail?.status as UserResponseStatus ?? "pending"} />
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Assigned</Text>
                <Text style={styles.detailValue}>{personnelDetail?.assignedLocation || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="navigation" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Detected</Text>
                <Text style={styles.detailValue}>{personnelDetail?.detectedLocation || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="clock" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Last Update</Text>
                <Text style={styles.detailValue}>
                  {personnelDetail?.lastUpdate
                    ? format(new Date(personnelDetail.lastUpdate), "HH:mm:ss")
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  floatingBar: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  alertInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  alertTypeText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  alertSep: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  alertZoneText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  alertTimeText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  windButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 5,
  },
  windButtonActive: {
    backgroundColor: Colors.primary,
  },

  routeFab: {
    position: "absolute",
    right: 16,
    zIndex: 20,
  },
  routeFabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10B981",
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  routeFabText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  routePanel: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 30,
  },
  routePanelHeader: {
    gap: 4,
  },
  routeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routePanelTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  routeStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeStatLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  routeStatSep: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  routeHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 8,
  },
  routeSteps: {
    gap: 6,
    maxHeight: 120,
  },
  routeStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  routeStepNum: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  routeStepName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  routeBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  routeBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeBtnSecText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  routeBtnConfirm: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#10B981",
  },
  routeBtnConfirmText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  routeBtnDisabled: {
    opacity: 0.4,
  },
  routeBtnDisabledText: {
    color: Colors.textTertiary,
  },
  routeConfirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  routeConfirmedText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#10B981",
  },
  routeErrorBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(220,38,38,0.9)",
    padding: 12,
    borderRadius: 10,
    zIndex: 40,
  },
  routeErrorText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    flex: 1,
  },

  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  detailAvatarText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
  },
  detailHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  detailName: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  detailBadge: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  detailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  detailBody: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    flex: 1,
  },
});
