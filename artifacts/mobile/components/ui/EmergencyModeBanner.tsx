import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useTranslation } from "@/i18n/useTranslation";

export function EmergencyModeBanner() {
  const { banners } = useAlertSystemState();
  const { t } = useTranslation();

  if (banners.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {banners.map((banner) => {
        const isShelter = banner.type === 'shelterIn';
        const isBlackout = banner.type === 'blackout';
        const zoneLabel = banner.zones.length > 0 ? banner.zones.join(", ") : null;

        return (
          <View
            key={banner.type}
            style={[
              styles.banner,
              isShelter && styles.shelterBanner,
              isBlackout && styles.blackoutBanner,
              banner.type === 'zoneAlert' && styles.zoneAlertBanner,
            ]}
          >
            <Feather
              name={isShelter ? "shield" : isBlackout ? "zap-off" : "alert-triangle"}
              size={16}
              color="#fff"
            />
            <Text style={styles.bannerText}>
              {isShelter
                ? `${t.shelterInActivated}${zoneLabel ? ` — ${zoneLabel}` : ""}`
                : isBlackout
                ? `${t.blackoutActivated}${zoneLabel ? ` — ${zoneLabel}` : ""}`
                : banner.label}
            </Text>
            <View style={styles.pulse} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 0 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  shelterBanner: {
    backgroundColor: "#D97706",
  },
  blackoutBanner: {
    backgroundColor: "#5B3A8E",
  },
  zoneAlertBanner: {
    backgroundColor: Colors.primary,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
