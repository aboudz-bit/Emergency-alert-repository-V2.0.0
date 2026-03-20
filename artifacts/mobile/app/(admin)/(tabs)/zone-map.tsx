import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

export default function ZoneMapTab() {
  const router = useRouter();

  useEffect(() => {
    router.push("/(admin)/zones");
  }, [router]);

  return <View style={{ flex: 1 }} />;
}
