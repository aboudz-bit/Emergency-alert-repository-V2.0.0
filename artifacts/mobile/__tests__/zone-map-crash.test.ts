/**
 * Zone Map Crash Verification
 *
 * Tests that:
 * 1. v25 migration backfills missing polygonPoints on zones
 * 2. zoneToPolygon guards handle undefined/null/bad polygonPoints without crash
 * 3. zonesToRegion handles zones with missing polygonPoints without crash
 * 4. New zones with empty boundaries (polygonPoints: []) work correctly
 */

// ── Inline the functions under test (avoids needing module resolution) ──

interface LatLng { lat: number; lng: number; }

interface Zone {
  id: number;
  name: string;
  type: string;
  boundaryType: string;
  polygonPoints: LatLng[];
  center?: LatLng;
  radius?: number;
  isActive: boolean;
  color: string;
  alertActive: boolean;
  alertType: null;
  alertPriority: null;
  alertMessage: string;
  alertUpdatedAt: null;
  alertHistory: any[];
}

interface ZonePolygon {
  id: number;
  name: string;
  coordinates: LatLng[];
  center?: LatLng;
  color: string;
  isActive: boolean;
  isSelected: boolean;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ── Exact copy of zoneToPolygon from components/map/types.ts ──
function zoneToPolygon(zone: Zone, selectedId: number | null): ZonePolygon {
  if (!zone) {
    return { id: 0, name: '??', coordinates: [], color: '#999', isActive: false, isSelected: false };
  }
  const safeCoords = Array.isArray((zone as any).polygonPoints)
    ? (zone as any).polygonPoints.filter((pt: any) => {
        if (!pt || typeof pt.lat !== 'number' || typeof pt.lng !== 'number' || isNaN(pt.lat) || isNaN(pt.lng)) {
          return false;
        }
        return true;
      })
    : [];
  return {
    id: zone.id,
    name: zone.name,
    coordinates: safeCoords,
    center: zone.center,
    color: zone.color,
    isActive: zone.isActive,
    isSelected: zone.id === selectedId,
  };
}

// ── Exact copy of zonesToRegion from components/map/types.ts ──
function zonesToRegion(zones: Zone[]): MapRegion {
  const DEFAULT_REGION: MapRegion = {
    latitude: 25.082,
    longitude: 48.175,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };
  if (!Array.isArray(zones)) {
    return DEFAULT_REGION;
  }
  const allPoints = zones.flatMap((z) => {
    if (!z || !Array.isArray((z as any).polygonPoints)) {
      return [];
    }
    return (z as any).polygonPoints;
  }).filter((p: any) => {
    if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number' || isNaN(p.lat) || isNaN(p.lng)) {
      return false;
    }
    return true;
  });
  if (allPoints.length === 0) {
    return DEFAULT_REGION;
  }
  const lats = allPoints.map((p: LatLng) => p.lat);
  const lngs = allPoints.map((p: LatLng) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.4 || 0.03,
    longitudeDelta: (maxLng - minLng) * 1.4 || 0.03,
  };
}

// ── Exact copy of v25 migration logic ──
function migrateV25(state: any, version: number): any {
  if (version < 25) {
    if (Array.isArray(state?.zones)) {
      state.zones = state.zones.map((z: any) => ({
        ...z,
        polygonPoints: Array.isArray(z.polygonPoints) ? z.polygonPoints : [],
      }));
    }
  }
  return state;
}

// ── Test harness ──
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${label}`);
  }
}

function doesNotThrow(fn: () => void, label: string) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${label}`);
  } catch (e: any) {
    failed++;
    console.error(`  ❌ FAIL (threw ${e.name}: ${e.message}): ${label}`);
  }
}

// ── Helper: make a minimal zone ──
function makeZone(overrides: Partial<Zone> & { id: number; name: string }): Zone {
  return {
    type: 'CPF',
    boundaryType: 'Polygon',
    polygonPoints: [],
    isActive: true,
    color: '#EF4444',
    alertActive: false,
    alertType: null,
    alertPriority: null,
    alertMessage: '',
    alertUpdatedAt: null,
    alertHistory: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: v25 migration backfills missing polygonPoints
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 1: v25 migration backfills missing polygonPoints ═══');

{
  const state = {
    zones: [
      { id: 1, name: 'Zone A' },                               // no polygonPoints at all
      { id: 2, name: 'Zone B', polygonPoints: undefined },      // explicit undefined
      { id: 3, name: 'Zone C', polygonPoints: null },           // explicit null
      { id: 4, name: 'Zone D', polygonPoints: 'bad' },          // wrong type
      { id: 5, name: 'Zone E', polygonPoints: [{ lat: 1, lng: 2 }] }, // already valid
    ],
  };

  const migrated = migrateV25(state, 24);

  assert(Array.isArray(migrated.zones[0].polygonPoints), 'Zone with missing polygonPoints → []');
  assert(migrated.zones[0].polygonPoints.length === 0, '  length is 0');

  assert(Array.isArray(migrated.zones[1].polygonPoints), 'Zone with undefined polygonPoints → []');
  assert(migrated.zones[1].polygonPoints.length === 0, '  length is 0');

  assert(Array.isArray(migrated.zones[2].polygonPoints), 'Zone with null polygonPoints → []');
  assert(migrated.zones[2].polygonPoints.length === 0, '  length is 0');

  assert(Array.isArray(migrated.zones[3].polygonPoints), 'Zone with string polygonPoints → []');
  assert(migrated.zones[3].polygonPoints.length === 0, '  length is 0');

  assert(Array.isArray(migrated.zones[4].polygonPoints), 'Zone with valid polygonPoints preserved');
  assert(migrated.zones[4].polygonPoints.length === 1, '  length is 1');
  assert(migrated.zones[4].polygonPoints[0].lat === 1, '  data intact');
}

// Migration should be a no-op when version >= 25
{
  const state = {
    zones: [
      { id: 1, name: 'Zone A' }, // no polygonPoints
    ],
  };
  const migrated = migrateV25(state, 25);
  assert(migrated.zones[0].polygonPoints === undefined, 'No-op when version >= 25');
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: zoneToPolygon guards — crash is gone
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 2: zoneToPolygon guards — no crash on bad data ═══');

{
  // Zone with undefined polygonPoints (pre-migration legacy data)
  const badZone = { id: 1, name: 'Bad' } as any;
  doesNotThrow(() => {
    const result = zoneToPolygon(badZone, null);
    assert(Array.isArray(result.coordinates), 'Returns empty coordinates array');
    assert(result.coordinates.length === 0, '  length is 0');
  }, 'undefined polygonPoints does not crash');

  // Zone with null polygonPoints
  const nullZone = makeZone({ id: 2, name: 'NullPoly' });
  (nullZone as any).polygonPoints = null;
  doesNotThrow(() => {
    const result = zoneToPolygon(nullZone, null);
    assert(result.coordinates.length === 0, 'null polygonPoints → empty coordinates');
  }, 'null polygonPoints does not crash');

  // Zone with bad coordinates in polygonPoints
  const mixedZone = makeZone({ id: 3, name: 'Mixed' });
  (mixedZone as any).polygonPoints = [
    { lat: 25.0, lng: 48.0 },   // good
    null,                         // bad
    { lat: NaN, lng: 48.1 },     // bad
    { lat: 25.1, lng: 48.1 },   // good
    undefined,                    // bad
  ];
  doesNotThrow(() => {
    const result = zoneToPolygon(mixedZone, null);
    assert(result.coordinates.length === 2, 'Filters out bad coords, keeps 2 good ones');
  }, 'mixed bad coords does not crash');

  // null zone itself
  doesNotThrow(() => {
    const result = zoneToPolygon(null as any, null);
    assert(result.id === 0, 'null zone returns fallback');
  }, 'null zone does not crash');
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: zonesToRegion — old zones with missing polygonPoints
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 3: zonesToRegion — old zones with missing polygonPoints ═══');

{
  // All zones have missing/bad polygonPoints
  const badZones = [
    { id: 1, name: 'A' } as any,
    { id: 2, name: 'B', polygonPoints: null } as any,
    { id: 3, name: 'C', polygonPoints: undefined } as any,
  ];
  doesNotThrow(() => {
    const region = zonesToRegion(badZones);
    assert(region.latitude === 25.082, 'Falls back to default region latitude');
    assert(region.longitude === 48.175, 'Falls back to default region longitude');
  }, 'All-bad zones does not crash');

  // Mix of good and bad zones
  const mixedZones = [
    { id: 1, name: 'Bad' } as any,
    makeZone({
      id: 2,
      name: 'Good',
      polygonPoints: [
        { lat: 25.0, lng: 48.0 },
        { lat: 25.1, lng: 48.1 },
      ],
    }),
  ];
  doesNotThrow(() => {
    const region = zonesToRegion(mixedZones);
    assert(region.latitude === 25.05, 'Computes region from valid zone only');
  }, 'Mix of good and bad zones does not crash');

  // Not an array
  doesNotThrow(() => {
    const region = zonesToRegion(null as any);
    assert(region.latitude === 25.082, 'null zones → default region');
  }, 'null zones array does not crash');
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: New zones without boundaries work correctly
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 4: New zones with empty boundaries work correctly ═══');

{
  const newZone = makeZone({ id: 10, name: 'New Zone' });
  // polygonPoints is [] by default from makeZone

  doesNotThrow(() => {
    const poly = zoneToPolygon(newZone, null);
    assert(poly.id === 10, 'Correct id');
    assert(poly.name === 'New Zone', 'Correct name');
    assert(Array.isArray(poly.coordinates), 'coordinates is array');
    assert(poly.coordinates.length === 0, 'coordinates is empty (no boundary yet)');
    assert(poly.isSelected === false, 'Not selected');
    assert(poly.isActive === true, 'Is active');
  }, 'New zone with empty polygonPoints[] does not crash');

  doesNotThrow(() => {
    const region = zonesToRegion([newZone]);
    assert(region.latitude === 25.082, 'Empty zone → default region');
  }, 'zonesToRegion with empty-boundary zone does not crash');

  // Selected new zone
  doesNotThrow(() => {
    const poly = zoneToPolygon(newZone, 10);
    assert(poly.isSelected === true, 'Selected new zone is marked selected');
  }, 'Selecting a new empty zone does not crash');
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
