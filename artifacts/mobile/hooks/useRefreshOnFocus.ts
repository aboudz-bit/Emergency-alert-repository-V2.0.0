import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Returns a counter that increments every time the screen gains focus.
 * Use this as a `key` on components that need to re-mount with fresh
 * store data after login, role switch, or tab navigation.
 */
export function useRefreshOnFocus(): number {
  const [focusCount, setFocusCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusCount((c) => c + 1);
    }, [])
  );

  return focusCount;
}
