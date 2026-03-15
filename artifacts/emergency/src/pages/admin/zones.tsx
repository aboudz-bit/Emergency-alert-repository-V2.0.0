import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Plus, Trash2, X, Pencil, Undo2, Save, Layers, Users,
  MapPin, Palette, Type, ChevronRight, CheckCircle2,
  Circle as CircleIcon, Hexagon, RotateCcw, MousePointer2,
  GripVertical, Info, LocateFixed, AlertCircle,
} from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore, useShallow } from '@/store';
import type { Zone, ZoneBoundaryType, LatLng } from '@/types';
import {
  MapContainer, TileLayer, Polygon, Circle, useMapEvents, useMap,
  Tooltip, Marker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const KHURAIS_CENTER: [number, number] = [25.082, 48.178];
const DEFAULT_ZOOM = 14;
const ZONE_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

type EditMode = 'idle' | 'drawing' | 'editing';

function makeVertexIcon(color: string, isDraft = false) {
  return L.divIcon({
    className: isDraft ? 'vertex-handle-draft' : 'vertex-handle',
    iconSize: [isDraft ? 12 : 14, isDraft ? 12 : 14],
    iconAnchor: [isDraft ? 6 : 7, isDraft ? 6 : 7],
    html: `<div style="width:100%;height:100%;background:${color};border-radius:50%;"></div>`,
  });
}

function makeCenterIcon() {
  return L.divIcon({ className: 'circle-center-handle', iconSize: [16, 16], iconAnchor: [8, 8] });
}

function makeRadiusIcon() {
  return L.divIcon({ className: 'circle-radius-handle', iconSize: [12, 12], iconAnchor: [6, 6] });
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

function ClickToAddPoints({ active, onAdd }: { active: boolean; onAdd: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function DraggableVertices({
  points, color, onChange, onRemove, canRemove,
}: {
  points: LatLng[];
  color: string;
  onChange: (idx: number, pos: LatLng) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  const icon = useMemo(() => makeVertexIcon(color), [color]);
  return (
    <>
      {points.map((p, i) => (
        <Marker
          key={i}
          position={[p.lat, p.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e: any) => {
              const latlng = e.target.getLatLng();
              onChange(i, { lat: latlng.lat, lng: latlng.lng });
            },
            contextmenu: (e: any) => {
              e.originalEvent.preventDefault();
              if (canRemove) onRemove(i);
            },
          }}
        />
      ))}
    </>
  );
}

function CircleEditHandles({
  center, radius, color, onCenterChange, onRadiusChange,
}: {
  center: LatLng; radius: number; color: string;
  onCenterChange: (c: LatLng) => void; onRadiusChange: (r: number) => void;
}) {
  const map = useMap();
  const radiusPoint = useMemo(() => {
    const point = map.latLngToLayerPoint(L.latLng(center.lat, center.lng));
    const metersPerPixel = 40075016.686 * Math.abs(Math.cos(center.lat * Math.PI / 180)) / Math.pow(2, map.getZoom() + 8);
    const radiusInPixels = radius / metersPerPixel;
    const rPoint = L.point(point.x + radiusInPixels, point.y);
    return map.layerPointToLatLng(rPoint);
  }, [center, radius, map]);

  return (
    <>
      <Circle center={[center.lat, center.lng]} radius={radius}
        pathOptions={{ color, weight: 3, fillOpacity: 0.15, fillColor: color, dashArray: '8 4' }} />
      <Marker position={[center.lat, center.lng]} icon={makeCenterIcon()} draggable
        eventHandlers={{ dragend: (e: any) => { const ll = e.target.getLatLng(); onCenterChange({ lat: ll.lat, lng: ll.lng }); } }} />
      <Marker position={radiusPoint} icon={makeRadiusIcon()} draggable
        eventHandlers={{ dragend: (e: any) => {
          const ll = e.target.getLatLng();
          onRadiusChange(Math.max(50, L.latLng(center.lat, center.lng).distanceTo(L.latLng(ll.lat, ll.lng))));
        } }} />
    </>
  );
}

function Toast({ message, onDone, variant = 'success' }: { message: string; onDone: () => void; variant?: 'success' | 'error' }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] toast-animate">
      <div className={cn(
        'flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm text-white',
        variant === 'success' ? 'bg-emerald-600' : 'bg-red-600',
      )}>
        {variant === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
        {message}
      </div>
    </div>
  );
}

function makeLocationIcon() {
  return L.divIcon({
    className: 'my-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div style="width:100%;height:100%;background:#2563eb;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25),0 2px 8px rgba(0,0,0,0.2);"></div>',
  });
}

function MapRefCapture({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMap(map); }, [map]);
  return null;
}

function AddZoneModal({
  onClose, onSave, existingZones,
}: {
  onClose: () => void;
  onSave: (data: { name: string; zoneCategory: 'main' | 'sub'; parentZoneId: number | null; boundaryType: ZoneBoundaryType; color: string }) => void;
  existingZones: Zone[];
}) {
  const [name, setName] = useState('');
  const [zoneCategory, setZoneCategory] = useState<'main' | 'sub'>('main');
  const [parentZoneId, setParentZoneId] = useState<number | null>(null);
  const [boundary, setBoundary] = useState<ZoneBoundaryType>('Polygon');
  const [color, setColor] = useState('#10B981');
  const mainZones = existingZones.filter(z => z.isActive);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Add New Zone
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure zone properties, then draw on the map</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ name, zoneCategory, parentZoneId: zoneCategory === 'sub' ? parentZoneId : null, boundaryType: boundary, color }); }} className="p-5 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Zone Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Substation Alpha"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Zone Level</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'main' as const, label: 'Main Zone', icon: Hexagon, desc: 'Top-level zone' },
                { id: 'sub' as const, label: 'Sub Zone', icon: MapPin, desc: 'Nested inside another' },
              ]).map(opt => (
                <button key={opt.id} type="button" onClick={() => setZoneCategory(opt.id)}
                  className={cn('p-3 rounded-xl border text-left transition-all',
                    zoneCategory === opt.id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300')}>
                  <opt.icon className={cn('w-4 h-4 mb-1', zoneCategory === opt.id ? 'text-blue-600' : 'text-slate-400')} />
                  <p className={cn('text-sm font-bold', zoneCategory === opt.id ? 'text-slate-900' : 'text-slate-500')}>{opt.label}</p>
                  <p className="text-[10px] text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {zoneCategory === 'sub' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Parent Zone</label>
              <select value={parentZoneId ?? ''} onChange={e => setParentZoneId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                <option value="">None</option>
                {mainZones.map(z => (<option key={z.id} value={z.id}>{z.name}</option>))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Boundary Shape</label>
            <div className="grid grid-cols-2 gap-2">
              {([{ id: 'Polygon' as const, icon: Hexagon, label: 'Polygon' }, { id: 'Circle' as const, icon: CircleIcon, label: 'Circle' }]).map(b => (
                <button key={b.id} type="button" onClick={() => setBoundary(b.id)}
                  className={cn('py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2',
                    boundary === b.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300')}>
                  <b.icon className="w-4 h-4" /> {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Zone Color</label>
            <div className="flex gap-2 flex-wrap">
              {ZONE_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('w-9 h-9 rounded-full border-2 transition-all', color === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={!name.trim()}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
              Continue to Draw <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameModal({ zone, onClose, onSave }: { zone: Zone; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(zone.name);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Type className="w-4 h-4 text-blue-600" /> Rename Zone</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Current Name</label>
            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">{zone.name}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">New Name</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button onClick={() => { onSave(name); onClose(); }} disabled={!name.trim() || name === zone.name}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">Save Name</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeColorModal({ zone, onClose, onSave }: { zone: Zone; onClose: () => void; onSave: (color: string) => void }) {
  const [color, setColor] = useState(zone.color);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Palette className="w-4 h-4 text-blue-600" /> Change Color</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">Select a new color for <span className="text-slate-900 font-bold">{zone.name}</span></p>
          <div className="flex gap-3 flex-wrap justify-center">
            {ZONE_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={cn('w-11 h-11 rounded-full border-2 transition-all', color === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105')}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button onClick={() => { onSave(color); onClose(); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Zones() {
  const { zones, disableZone, deleteZone, addZone, updateZone, users } = useStore(useShallow(s => ({
    zones: s.zones, disableZone: s.disableZone, deleteZone: s.deleteZone, addZone: s.addZone, updateZone: s.updateZone, users: s.users,
  })));

  const [showAddModal, setShowAddModal] = useState(false);
  const [renameZone, setRenameZone] = useState<Zone | null>(null);
  const [colorZone, setColorZone] = useState<Zone | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('idle');
  const [draftPoints, setDraftPoints] = useState<LatLng[]>([]);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingColor, setEditingColor] = useState('#10B981');
  const [editingBoundary, setEditingBoundary] = useState<ZoneBoundaryType>('Polygon');
  const [circleCenter, setCircleCenter] = useState<LatLng>({ lat: 25.082, lng: 48.178 });
  const [circleRadius, setCircleRadius] = useState(500);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);

  const activeZones = zones.filter(z => z.isActive);
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const isEditing = editMode !== 'idle';
  const canSave = editingBoundary === 'Circle' || draftPoints.length >= 3;

  const getUserCount = (zoneName: string) =>
    users.filter(u => u.zone === zoneName && u.accountStatus === 'active').length;

  const isSystemZone = (zone: Zone) => zone.name === 'CPF' || zone.name === 'Camp';

  const handleCreateZone = (data: {
    name: string; zoneCategory: 'main' | 'sub'; parentZoneId: number | null;
    boundaryType: ZoneBoundaryType; color: string;
  }) => {
    addZone({
      name: data.name, type: 'Custom', parentZoneId: data.parentZoneId,
      boundaryType: data.boundaryType, points: [], polygonPoints: [],
      center: data.boundaryType === 'Circle' ? { lat: 25.082, lng: 48.178 } : undefined,
      radius: data.boundaryType === 'Circle' ? 500 : undefined,
      isActive: true, color: data.color,
    });
    const newZone = useStore.getState().zones[useStore.getState().zones.length - 1];
    setEditingZoneId(newZone.id);
    setEditingColor(data.color);
    setEditingBoundary(data.boundaryType);
    setSelectedZoneId(newZone.id);
    setShowAddModal(false);
    if (data.boundaryType === 'Circle') {
      setCircleCenter({ lat: 25.082, lng: 48.178 });
      setCircleRadius(500);
    } else {
      setDraftPoints([]);
    }
    setEditMode('drawing');
  };

  const handleSaveDrawing = () => {
    if (!editingZoneId) return;
    if (editingBoundary === 'Circle') {
      updateZone(editingZoneId, { center: circleCenter, radius: circleRadius, polygonPoints: [] });
    } else if (draftPoints.length >= 3) {
      updateZone(editingZoneId, { polygonPoints: draftPoints });
    } else { return; }
    setEditMode('idle'); setDraftPoints([]); setEditingZoneId(null);
    setToast({ message: 'Zone boundary saved successfully', variant: 'success' });
  };

  const handleStartEdit = (zone: Zone) => {
    setEditingZoneId(zone.id); setEditingColor(zone.color);
    setEditingBoundary(zone.boundaryType); setSelectedZoneId(zone.id);
    if (zone.boundaryType === 'Circle' && zone.center) {
      setCircleCenter(zone.center); setCircleRadius(zone.radius || 500);
    } else { setDraftPoints([...zone.polygonPoints]); }
    setEditMode('editing');
  };

  const handleCancelEdit = () => {
    if (editMode !== 'idle' && (draftPoints.length > 0 || editingBoundary === 'Circle')) {
      if (!confirm('Discard unsaved changes to this zone boundary?')) return;
    }
    setEditMode('idle'); setDraftPoints([]); setEditingZoneId(null);
  };

  const handleVertexDrag = (idx: number, pos: LatLng) => {
    setDraftPoints(prev => prev.map((p, i) => i === idx ? pos : p));
  };

  const handleRemoveVertex = (idx: number) => {
    setDraftPoints(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddPoint = (latlng: LatLng) => {
    setDraftPoints(prev => [...prev, latlng]);
  };

  const handleRename = (name: string) => {
    if (renameZone) { updateZone(renameZone.id, { name }); setToast({ message: `Zone renamed to "${name}"`, variant: 'success' }); }
  };

  const handleColorChange = (color: string) => {
    if (colorZone) { updateZone(colorZone.id, { color }); setToast({ message: 'Zone color updated', variant: 'success' }); }
  };

  const handleDisable = (zone: Zone) => {
    if (confirm(`Disable zone "${zone.name}"? It will be hidden from the map.`)) {
      disableZone(zone.id);
      if (selectedZoneId === zone.id) setSelectedZoneId(null);
      setToast({ message: `Zone "${zone.name}" disabled`, variant: 'success' });
    }
  };

  const handleDeleteZone = (zone: Zone) => {
    if (confirm(`Are you sure you want to delete zone "${zone.name}"? This action cannot be undone.`)) {
      deleteZone(zone.id);
      if (selectedZoneId === zone.id) setSelectedZoneId(null);
      if (editingZoneId === zone.id) { setEditMode('idle'); setDraftPoints([]); setEditingZoneId(null); }
      setToast({ message: `Zone "${zone.name}" deleted`, variant: 'success' });
    }
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setToast({ message: 'Geolocation is not supported by your browser', variant: 'error' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const map = mapRef.current;
        if (map) map.flyTo([latlng.lat, latlng.lng], 16, { duration: 1.2 });
        if (locationMarkerRef.current) {
          locationMarkerRef.current.setLatLng([latlng.lat, latlng.lng]);
        } else if (map) {
          const m = L.marker([latlng.lat, latlng.lng], { icon: makeLocationIcon(), zIndexOffset: 1000 }).addTo(map);
          m.bindTooltip('My Location', { direction: 'top', offset: [0, -14], className: 'zone-label' });
          locationMarkerRef.current = m;
        }
        setLocating(false);
        setToast({ message: 'Location found', variant: 'success' });
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setToast({ message: 'Location permission denied', variant: 'error' });
        else if (err.code === err.POSITION_UNAVAILABLE) setToast({ message: 'Location unavailable', variant: 'error' });
        else if (err.code === err.TIMEOUT) setToast({ message: 'Location request timed out', variant: 'error' });
        else setToast({ message: 'Unable to determine location', variant: 'error' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    return () => { if (locationMarkerRef.current) locationMarkerRef.current.remove(); };
  }, []);

  return (
    <AdminLayout title="Zone Management">
      {showAddModal && <AddZoneModal onClose={() => setShowAddModal(false)} onSave={handleCreateZone} existingZones={activeZones} />}
      {renameZone && <RenameModal zone={renameZone} onClose={() => setRenameZone(null)} onSave={handleRename} />}
      {colorZone && <ChangeColorModal zone={colorZone} onClose={() => setColorZone(null)} onSave={handleColorChange} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDone={() => setToast(null)} />}

      {/* Light professional wrapper — overrides the dark theme for this page only */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)]">

        {/* ═══ Left Panel — Zone List ═══ */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col shrink-0 order-2 lg:order-1 min-h-0 lg:h-full h-72">

          {/* Header + Add */}
          <div className="flex justify-between items-center mb-3 bg-white/90 backdrop-blur rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> Zones
              <span className="text-slate-400 font-normal">({activeZones.length})</span>
            </h2>
            <button onClick={() => setShowAddModal(true)} disabled={isEditing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" /> Add Zone
            </button>
          </div>

          {/* Zone List */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
            {activeZones.length === 0 && (
              <div className="text-center py-8 bg-white/80 rounded-xl border border-slate-200">
                <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No zones configured</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add Zone" to get started</p>
              </div>
            )}
            {activeZones.map(zone => {
              const count = getUserCount(zone.name);
              const isSelected = selectedZoneId === zone.id;
              const isBeingEdited = editingZoneId === zone.id;
              return (
                <div key={zone.id}
                  onClick={() => !isEditing && setSelectedZoneId(isSelected ? null : zone.id)}
                  className={cn(
                    'rounded-xl border p-3.5 transition-all',
                    isEditing && !isBeingEdited ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
                    isSelected
                      ? 'bg-white border-blue-300 shadow-md ring-1 ring-blue-200'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-sm',
                    isBeingEdited && 'ring-2 ring-blue-400 bg-blue-50',
                  )}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-4 h-4 rounded-full shrink-0 ring-2 ring-slate-200" style={{ backgroundColor: zone.color }} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{zone.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{zone.type}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            {zone.boundaryType === 'Polygon' ? <Hexagon className="w-2.5 h-2.5" /> : <CircleIcon className="w-2.5 h-2.5" />}
                            {zone.boundaryType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-700">{count}</p>
                      <p className="text-[10px] text-slate-400">people</p>
                    </div>
                  </div>

                  {isSelected && !isEditing && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-5 gap-1">
                      <button onClick={e => { e.stopPropagation(); if (!isSystemZone(zone)) setRenameZone(zone); }}
                        className={cn('flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
                          isSystemZone(zone) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}
                        title={isSystemZone(zone) ? 'System zones cannot be renamed' : 'Rename zone'}>
                        <Type className="w-3.5 h-3.5" /><span className="text-[9px] font-semibold">Rename</span>
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleStartEdit(zone); }}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /><span className="text-[9px] font-semibold">Shape</span>
                      </button>
                      <button onClick={e => { e.stopPropagation(); setColorZone(zone); }}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                        <Palette className="w-3.5 h-3.5" /><span className="text-[9px] font-semibold">Color</span>
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDisable(zone); }}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                        <X className="w-3.5 h-3.5" /><span className="text-[9px] font-semibold">Disable</span>
                      </button>
                      <button onClick={e => { e.stopPropagation(); if (!isSystemZone(zone)) handleDeleteZone(zone); }}
                        className={cn('flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
                          isSystemZone(zone) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-red-600 hover:bg-red-50')}
                        title={isSystemZone(zone) ? 'System zones cannot be deleted' : 'Delete zone permanently'}>
                        <Trash2 className="w-3.5 h-3.5" /><span className="text-[9px] font-semibold">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Zone Details */}
          {selectedZone && !isEditing && (
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3.5 h-3.5 rounded-full ring-2 ring-slate-200" style={{ backgroundColor: selectedZone.color }} />
                <span className="font-bold text-sm text-slate-800 flex-1 truncate">{selectedZone.name}</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{selectedZone.boundaryType}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <Users className="w-3.5 h-3.5 text-blue-600 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-slate-800">{getUserCount(selectedZone.name)}</p>
                  <p className="text-[9px] text-slate-400">Personnel</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <GripVertical className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-slate-800">{selectedZone.polygonPoints.length}</p>
                  <p className="text-[9px] text-slate-400">Vertices</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <Hexagon className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-slate-800">{selectedZone.type}</p>
                  <p className="text-[9px] text-slate-400">Type</p>
                </div>
              </div>
              {selectedZone.center && (
                <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
                  {selectedZone.center.lat.toFixed(4)}°N, {selectedZone.center.lng.toFixed(4)}°E
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 bg-white/90 border border-slate-200 rounded-xl p-3 shrink-0 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Map Legend</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {activeZones.map(z => (
                <div key={z.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: z.color }} />
                  <span className={cn(selectedZoneId === z.id && 'text-slate-800 font-semibold')}>{z.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Right Panel — Map ═══ */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden relative order-1 lg:order-2 min-h-[320px] lg:min-h-0 shadow-sm isolate">

          {/* Drawing / Editing Banner */}
          {isEditing && (
            <div className="absolute top-3 left-3 right-3 z-[1000]">
              <div className="bg-white/95 backdrop-blur-xl border border-blue-200 rounded-xl px-4 py-3 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      {editingBoundary === 'Polygon'
                        ? <MousePointer2 className="w-4 h-4 text-blue-600" />
                        : <CircleIcon className="w-4 h-4 text-blue-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {editMode === 'drawing' ? 'Drawing Mode' : 'Editing Mode'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {editingBoundary === 'Polygon'
                          ? editMode === 'drawing'
                            ? `Tap on the map to place points (${draftPoints.length} placed)`
                            : `Drag points to adjust · Click map to add · Right-click vertex to remove · ${draftPoints.length} vertices`
                          : 'Drag the center or edge handle to adjust the circle'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {editingBoundary === 'Polygon' && (
                      <>
                        <button onClick={() => setDraftPoints(prev => prev.slice(0, -1))} disabled={draftPoints.length === 0}
                          className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo">
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDraftPoints([])} disabled={draftPoints.length === 0}
                          className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Reset">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={handleSaveDrawing} disabled={!canSave}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm">
                      <Save className="w-3.5 h-3.5" /> Save Zone
                    </button>
                    <button onClick={handleCancelEdit}
                      className="px-3 py-2 text-slate-600 hover:text-slate-800 bg-slate-50 rounded-lg border border-slate-200 text-xs font-semibold">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hint when no zone selected */}
          {!isEditing && !selectedZone && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg px-4 py-2 shadow-md flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500">Click a zone on the map or in the list to select it</p>
              </div>
            </div>
          )}

          <MapContainer
            center={KHURAIS_CENTER}
            zoom={DEFAULT_ZOOM}
            className="w-full h-full"
            style={{ background: '#f1f5f9' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <FitBoundsControl zones={activeZones} />
            <ClickToAddPoints active={isEditing && editingBoundary === 'Polygon'} onAdd={handleAddPoint} />
            <MapRefCapture onMap={(m) => { mapRef.current = m; }} />

            {activeZones.map(zone => {
              if (editingZoneId === zone.id && isEditing) return null;
              const isSel = selectedZoneId === zone.id;

              if (zone.boundaryType === 'Circle' && zone.center && zone.radius) {
                return (
                  <Circle key={zone.id} center={[zone.center.lat, zone.center.lng]} radius={zone.radius}
                    pathOptions={{ color: zone.color, weight: isSel ? 4 : 2.5, fillOpacity: isSel ? 0.25 : 0.12, fillColor: zone.color }}
                    eventHandlers={{ click: () => !isEditing && setSelectedZoneId(zone.id) }}>
                    <Tooltip permanent direction="center" className={isSel ? 'zone-label-selected' : 'zone-label'}>{zone.name}</Tooltip>
                  </Circle>
                );
              }
              if (zone.polygonPoints.length >= 3) {
                return (
                  <Polygon key={zone.id}
                    positions={zone.polygonPoints.map(p => [p.lat, p.lng] as [number, number])}
                    pathOptions={{ color: zone.color, weight: isSel ? 4 : 2.5, fillOpacity: isSel ? 0.25 : 0.12, fillColor: zone.color }}
                    eventHandlers={{ click: () => !isEditing && setSelectedZoneId(zone.id) }}>
                    <Tooltip permanent direction="center" className={isSel ? 'zone-label-selected' : 'zone-label'}>{zone.name}</Tooltip>
                  </Polygon>
                );
              }
              return null;
            })}

            {isEditing && editingBoundary === 'Polygon' && draftPoints.length >= 2 && (
              <Polygon positions={draftPoints.map(p => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: editingColor, weight: 3, dashArray: editMode === 'drawing' ? '8 4' : undefined, fillOpacity: 0.15, fillColor: editingColor }} />
            )}

            {isEditing && editingBoundary === 'Polygon' && (
              <DraggableVertices points={draftPoints} color={editingColor}
                onChange={handleVertexDrag} onRemove={handleRemoveVertex} canRemove={draftPoints.length > 3} />
            )}

            {isEditing && editingBoundary === 'Circle' && (
              <CircleEditHandles center={circleCenter} radius={circleRadius} color={editingColor}
                onCenterChange={setCircleCenter} onRadiusChange={setCircleRadius} />
            )}
          </MapContainer>

          {/* Floating map controls */}
          {!isEditing && (
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
              <button onClick={handleLocateMe} disabled={locating}
                className={cn(
                  'bg-white border border-slate-200 text-slate-600 rounded-xl p-3 shadow-lg hover:bg-slate-50 hover:text-blue-600 transition-all hover:scale-105',
                  locating && 'animate-pulse text-blue-600',
                )}
                title="My Location">
                <LocateFixed className="w-5 h-5" />
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 shadow-lg transition-all hover:scale-105" title="Add new zone">
                <Plus className="w-5 h-5" />
              </button>
              {selectedZone && (
                <button onClick={() => handleStartEdit(selectedZone)}
                  className="bg-white border border-blue-200 text-blue-600 rounded-xl p-3 shadow-lg hover:bg-blue-50 transition-all hover:scale-105" title="Edit zone shape">
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
