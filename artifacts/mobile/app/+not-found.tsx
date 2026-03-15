import { Feather } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Feather name="alert-circle" size={48} color={Colors.textTertiary} />
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  link: {
    marginTop: Spacing.md,
  },
  linkText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
});
