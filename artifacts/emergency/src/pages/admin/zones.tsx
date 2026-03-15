import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Plus, Trash2, X, Pencil, Undo2, Save, Eye, Map as MapIcon, Layers, Target } from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore, useShallow } from '@/store';
import type { Zone, ZoneBoundaryType, LatLng } from '@/types';
import { MapContainer, TileLayer, Polygon, Circle, useMapEvents, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const KHURAIS_CENTER: [number, number] = [25.082, 48.178];
const DEFAULT_ZOOM = 14;

function DrawingLayer({
  isDrawing,
  draftPoints,
  setDraftPoints,
  drawingColor,
}: {
  isDrawing: boolean;
  draftPoints: LatLng[];
  setDraftPoints: React.Dispatch<React.SetStateAction<LatLng[]>>;
  drawingColor: string;
}) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      setDraftPoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    },
  });

  if (draftPoints.length < 2) {
    return null;
  }

  return (
    <Polygon
      positions={draftPoints.map(p => [p.lat, p.lng] as [number, number])}
      pathOptions={{
        color: drawingColor,
        weight: 2,
        dashArray: '6 4',
        fillOpacity: 0.15,
        fillColor: drawingColor,
      }}
    />
  );
}

function FitBoundsControl({ zones }: { zones: Zone[] }) {
  const map = useMap();
  const zoneCount = zones.length;
  const totalVertices = zones.reduce((acc, z) => acc + z.polygonPoints.length, 0);

  useEffect(() => {
    if (zones.length === 0) return;
    const allPoints: [number, number][] = [];
    zones.forEach(z => {
      if (z.polygonPoints.length > 0) {
        z.polygonPoints.forEach(p => allPoints.push([p.lat, p.lng]));
      } else if (z.center) {
        allPoints.push([z.center.lat, z.center.lng]);
      }
    });
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints).pad(0.3));
    }
  }, [zoneCount, totalVertices]);

  return null;
}

function AddZoneModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, type: 'CPF' | 'Camp', boundary: ZoneBoundaryType, color: string) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'CPF' | 'Camp'>('CPF');
  const [boundary, setBoundary] = useState<ZoneBoundaryType>('Polygon');
  const [color, setColor] = useState('#10B981');

  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, type, boundary, color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground">New Zone</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Zone Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Substation A"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Zone Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['CPF', 'Camp'] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn('py-2 rounded-lg border text-sm font-bold transition-all', type === t ? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Boundary Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Polygon', 'Circle'] as const).map(b => (
                <button key={b} type="button" onClick={() => setBoundary(b)}
                  className={cn('py-2 rounded-lg border text-sm font-bold transition-all', boundary === b ? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40')}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Zone Color</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-8 h-8 rounded-full border-2 transition-transform', color === c ? 'border-white scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">Create & Draw</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Zones() {
  const { zones, disableZone, addZone, updateZone, users } = useStore(useShallow(s => ({
    zones: s.zones,
    disableZone: s.disableZone,
    addZone: s.addZone,
    updateZone: s.updateZone,
    users: s.users,
  })));
  const [showModal, setShowModal] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<LatLng[]>([]);
  const [drawingZoneId, setDrawingZoneId] = useState<number | null>(null);
  const [drawingColor, setDrawingColor] = useState('#10B981');

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  const getUserCount = (zoneName: string) =>
    users.filter(u => u.zone === zoneName && u.accountStatus === 'active').length;

  const handleCreateZone = (name: string, type: 'CPF' | 'Camp', boundaryType: ZoneBoundaryType, color: string) => {
    addZone({ name, type, boundaryType, points: [], polygonPoints: [], center: undefined, radius: undefined, isActive: true, color });
    const newZone = useStore.getState().zones[useStore.getState().zones.length - 1];
    setDrawingZoneId(newZone.id);
    setDrawingColor(color);
    setDraftPoints([]);
    setIsDrawing(true);
    setSelectedZoneId(newZone.id);
  };

  const handleSaveDraft = () => {
    if (drawingZoneId && draftPoints.length >= 3) {
      updateZone(drawingZoneId, { polygonPoints: draftPoints });
      setIsDrawing(false);
      setDraftPoints([]);
      setDrawingZoneId(null);
    }
  };

  const handleUndoPoint = () => {
    setDraftPoints(prev => prev.slice(0, -1));
  };

  const handleClearDraft = () => {
    setDraftPoints([]);
  };

  const handleStartEdit = (zone: Zone) => {
    setDrawingZoneId(zone.id);
    setDrawingColor(zone.color);
    setDraftPoints([...zone.polygonPoints]);
    setIsDrawing(true);
    setSelectedZoneId(zone.id);
  };

  return (
    <AdminLayout title="Zone Management">
      {showModal && <AddZoneModal onClose={() => setShowModal(false)} onSave={handleCreateZone} />}

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
        {/* Left Panel — Zone List */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col shrink-0 order-2 lg:order-1 min-h-0 lg:h-full h-64">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Zones
            </h2>
            <button onClick={() => setShowModal(true)}
              className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {zones.filter(z => z.isActive).map(zone => {
              const count = getUserCount(zone.name);
              const isSelected = selectedZoneId === zone.id;
              return (
                <div key={zone.id}
                  onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3.5 transition-all group cursor-pointer',
                    isSelected ? 'bg-card border-primary/50 shadow-lg shadow-primary/5' : 'bg-card/50 border-border hover:border-border/80 hover:bg-card',
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">{zone.type} · {zone.boundaryType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={e => { e.stopPropagation(); handleStartEdit(zone); }}
                        className="p-1 text-muted-foreground hover:text-primary bg-background rounded border border-transparent hover:border-border" title="Edit polygon">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); if (confirm(`Disable zone "${zone.name}"?`)) disableZone(zone.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive bg-background rounded border border-transparent hover:border-border" title="Disable">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{zone.polygonPoints.length} vertices</span>
                    <span>{count} personnel</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected zone info */}
          {selectedZone && !isDrawing && (
            <div className="mt-3 bg-card border border-border rounded-xl p-3.5 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedZone.color }} />
                  <span className="font-bold text-sm text-foreground">{selectedZone.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{selectedZone.boundaryType}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background rounded-lg p-2 border border-border">
                  <p className="text-muted-foreground">Personnel</p>
                  <p className="font-bold text-foreground">{getUserCount(selectedZone.name)}</p>
                </div>
                <div className="bg-background rounded-lg p-2 border border-border">
                  <p className="text-muted-foreground">Vertices</p>
                  <p className="font-bold text-foreground">{selectedZone.polygonPoints.length}</p>
                </div>
              </div>
              {selectedZone.center && (
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                  Center: {selectedZone.center.lat.toFixed(4)}, {selectedZone.center.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {/* Map Legend */}
          <div className="mt-3 bg-card/50 border border-border rounded-xl p-3 shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
            <div className="space-y-1.5">
              {zones.filter(z => z.isActive).map(z => (
                <div key={z.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: z.color }} />
                  <span>{z.name}</span>
                </div>
              ))}
              {isDrawing && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <div className="w-2.5 h-2.5 rounded-sm border border-dashed border-primary" />
                  <span>Drawing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel — Map */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden relative order-1 lg:order-2 min-h-[300px] lg:min-h-0">
          {/* Drawing toolbar */}
          {isDrawing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-card/95 backdrop-blur-md border border-border rounded-xl px-4 py-2.5 shadow-2xl">
              <span className="text-xs font-bold text-primary mr-2">
                Drawing Mode — Click map to add points ({draftPoints.length} placed)
              </span>
              <button onClick={handleUndoPoint} disabled={draftPoints.length === 0}
                className="p-1.5 text-muted-foreground hover:text-foreground bg-background rounded-lg border border-border disabled:opacity-30 disabled:cursor-not-allowed" title="Undo last point">
                <Undo2 className="w-4 h-4" />
              </button>
              <button onClick={handleClearDraft}
                className="p-1.5 text-muted-foreground hover:text-destructive bg-background rounded-lg border border-border" title="Clear draft">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={handleSaveDraft} disabled={draftPoints.length < 3}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5" title="Save zone polygon">
                <Save className="w-3.5 h-3.5" /> Save Zone
              </button>
              <button onClick={() => { setIsDrawing(false); setDraftPoints([]); setDrawingZoneId(null); }}
                className="p-1.5 text-muted-foreground hover:text-foreground bg-background rounded-lg border border-border" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <MapContainer
            center={KHURAIS_CENTER}
            zoom={DEFAULT_ZOOM}
            className="w-full h-full"
            style={{ background: '#0a0c10' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <FitBoundsControl zones={zones.filter(z => z.isActive)} />

            {/* Render saved zone polygons */}
            {zones.filter(z => z.isActive).map(zone => {
              if (isDrawing && zone.id === drawingZoneId) return null;
              if (zone.boundaryType === 'Circle' && zone.center && zone.radius) {
                return (
                  <Circle key={zone.id}
                    center={[zone.center.lat, zone.center.lng]}
                    radius={zone.radius}
                    pathOptions={{
                      color: zone.color,
                      weight: selectedZoneId === zone.id ? 3 : 2,
                      fillOpacity: selectedZoneId === zone.id ? 0.25 : 0.12,
                      fillColor: zone.color,
                    }}
                    eventHandlers={{ click: () => setSelectedZoneId(zone.id) }}
                  >
                    <Tooltip permanent direction="center" className="zone-label">
                      {zone.name}
                    </Tooltip>
                  </Circle>
                );
              }
              if (zone.polygonPoints.length >= 3) {
                return (
                  <Polygon key={zone.id}
                    positions={zone.polygonPoints.map(p => [p.lat, p.lng] as [number, number])}
                    pathOptions={{
                      color: zone.color,
                      weight: selectedZoneId === zone.id ? 3 : 2,
                      fillOpacity: selectedZoneId === zone.id ? 0.25 : 0.12,
                      fillColor: zone.color,
                    }}
                    eventHandlers={{ click: () => setSelectedZoneId(zone.id) }}
                  >
                    <Tooltip permanent direction="center" className="zone-label">
                      {zone.name}
                    </Tooltip>
                  </Polygon>
                );
              }
              return null;
            })}

            {/* Drawing layer */}
            <DrawingLayer
              isDrawing={isDrawing}
              draftPoints={draftPoints}
              setDraftPoints={setDraftPoints}
              drawingColor={drawingColor}
            />
          </MapContainer>

          {/* Map controls overlay */}
          {!isDrawing && (
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowModal(true);
                }}
                className="bg-card/90 backdrop-blur-md border border-border text-foreground rounded-lg p-2.5 shadow-lg hover:bg-card transition-colors"
                title="Draw new zone"
              >
                <Plus className="w-5 h-5" />
              </button>
              {selectedZone && (
                <button
                  onClick={() => handleStartEdit(selectedZone)}
                  className="bg-card/90 backdrop-blur-md border border-border text-primary rounded-lg p-2.5 shadow-lg hover:bg-card transition-colors"
                  title="Edit selected zone"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
