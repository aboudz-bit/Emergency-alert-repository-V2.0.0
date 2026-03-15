import React, { useState, useEffect } from "react";
import {
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

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  ALERT_TYPES,
  DEFAULT_MESSAGES,
} from "@/constants/theme";
import { useStore } from "@/store";
import type { AlertType, AlertPriority } from "@/types";

const ZONE_OPTIONS = ["CPF", "Camp", "All Zones"] as const;
const PRIORITY_OPTIONS: AlertPriority[] = ["High", "Medium", "Low"];

const priorityColors: Record<AlertPriority, string> = {
  High: Colors.primary,
  Medium: Colors.amber,
  Low: Colors.info,
};

export default function SendAlertScreen() {
  const router = useRouter();
  const createAlert = useStore((s) => s.createAlert);
  const currentUser = useStore((s) => s.currentUser);

  const [selectedType, setSelectedType] = useState<AlertType | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>("All Zones");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<AlertPriority>("High");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (selectedType) {
      setMessage(DEFAULT_MESSAGES[selectedType] || "");
    }
  }, [selectedType]);

  const canSend = selectedType && selectedZone && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend || !selectedType) return;
    createAlert({
      type: selectedType,
      zone: selectedZone,
      title: `${selectedType} - ${selectedZone}`,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      sentBy: currentUser?.name || "Super Admin",
      priority,
    });
    setShowConfirm(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Send Alert" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Alert Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {ALERT_TYPES.filter((t) => t !== "All Clear").map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.chip,
                  selectedType === type && styles.chipSelected,
                ]}
                onPress={() => setSelectedType(type as AlertType)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedType === type && styles.chipTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Target Zone */}
        <View style={styles.section}>
          <Text style={styles.label}>Target Zone</Text>
          <View style={styles.zoneRow}>
            {ZONE_OPTIONS.map((zone) => (
              <Pressable
                key={zone}
                style={[
                  styles.zoneCard,
                  selectedZone === zone && styles.zoneCardSelected,
                ]}
                onPress={() => setSelectedZone(zone)}
              >
                <Feather
                  name={
                    zone === "CPF"
                      ? "hard-drive"
                      : zone === "Camp"
                      ? "home"
                      : "globe"
                  }
                  size={20}
                  color={
                    selectedZone === zone
                      ? Colors.primary
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.zoneText,
                    selectedZone === zone && styles.zoneTextSelected,
                  ]}
                >
                  {zone}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter alert message..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITY_OPTIONS.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.chip,
                  priority === p && {
                    backgroundColor: priorityColors[p],
                    borderColor: priorityColors[p],
                  },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.chipText,
                    priority === p && styles.chipTextSelected,
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Preview */}
        {selectedType && (
          <View style={styles.section}>
            <Text style={styles.label}>Preview</Text>
            <Card style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Feather
                  name="alert-triangle"
                  size={18}
                  color={priorityColors[priority]}
                />
                <Text style={styles.previewType}>{selectedType}</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityColors[priority] + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { color: priorityColors[priority] },
                    ]}
                  >
                    {priority}
                  </Text>
                </View>
              </View>
              <Text style={styles.previewZone}>Zone: {selectedZone}</Text>
              <Text style={styles.previewMessage} numberOfLines={3}>
                {message || "No message"}
              </Text>
            </Card>
          </View>
        )}

        {/* Send Button */}
        <Button
          title="SEND ALERT"
          onPress={() => setShowConfirm(true)}
          variant="primary"
          fullWidth
          disabled={!canSend}
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Feather
                name="alert-triangle"
                size={32}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.modalTitle}>Confirm Alert</Text>
            <Text style={styles.modalMessage}>
              You are about to send a{" "}
              <Text style={{ color: priorityColors[priority] }}>
                {priority}
              </Text>{" "}
              priority{" "}
              <Text style={{ color: Colors.primary }}>{selectedType}</Text>{" "}
              alert to{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                {selectedZone}
              </Text>
              . This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowConfirm(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Send Now"
                onPress={handleSend}
                variant="destructive"
                style={{ flex: 1 }}
              />
            </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  chipRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  zoneRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  zoneCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  zoneCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  zoneText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  zoneTextSelected: {
    color: Colors.primary,
  },
  messageInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    minHeight: 120,
  },
  previewCard: {
    borderColor: Colors.borderLight,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewType: {
    flex: 1,
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
  },
  previewZone: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  previewMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: Spacing.md,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
    width: "100%",
  },
});
