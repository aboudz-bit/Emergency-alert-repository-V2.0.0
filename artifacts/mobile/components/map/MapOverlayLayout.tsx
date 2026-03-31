import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';

export const MAP_UI = {
  topPad: Platform.OS === 'web' ? 8 : 12,
  sidePad: 12,
  gutter: 10,
  bottomPad: 12,
  zAlert: 1000,
  zIntel: 900,
  zTimeline: 850,
  zWind: 800,
  zLegend: 750,
  zAction: 700,
} as const;

interface Props {
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomCenter?: React.ReactNode;
  bottomAction?: React.ReactNode;
  bottomPadExtra?: number;
}

export function MapOverlayLayout({
  topLeft,
  topRight,
  bottomCenter,
  bottomAction,
  bottomPadExtra = 0,
}: Props) {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={[styles.topRow, { top: MAP_UI.topPad }]} pointerEvents="box-none">
        <View style={styles.topLeftZone} pointerEvents="box-none">
          {topLeft}
        </View>
        <View style={styles.topRightZone} pointerEvents="box-none">
          {topRight}
        </View>
      </View>

      {bottomCenter && (
        <View
          style={[styles.bottomZone, { bottom: MAP_UI.bottomPad + bottomPadExtra + (bottomAction ? 60 : 0) }]}
          pointerEvents="box-none"
        >
          {bottomCenter}
        </View>
      )}

      {bottomAction && (
        <View
          style={[styles.actionZone, { bottom: MAP_UI.bottomPad + bottomPadExtra }]}
          pointerEvents="box-none"
        >
          {bottomAction}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  topRow: {
    position: 'absolute',
    left: MAP_UI.sidePad,
    right: MAP_UI.sidePad,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MAP_UI.gutter,
  },
  topLeftZone: {
    flex: 1,
    gap: MAP_UI.gutter,
  },
  topRightZone: {
    alignItems: 'flex-end',
    gap: MAP_UI.gutter,
  },
  bottomZone: {
    position: 'absolute',
    left: MAP_UI.sidePad,
    right: MAP_UI.sidePad,
    alignItems: 'center',
  },
  actionZone: {
    position: 'absolute',
    left: MAP_UI.sidePad + 4,
    right: MAP_UI.sidePad + 4,
  },
});
