// Incident management templates (local placeholders).
// Checklist + communication-tree scaffolding for ECO incident management.
// No real dialing/SMS — these are structures the future backend can populate.
import type { AlertType, ChecklistItem, CommsContact } from '@/types';

// Map an alert type to a checklist "category". Kept loose so future emergency
// types (Fire / Gas leak / Medical / Evacuation) slot in without code changes.
export type IncidentCategory =
  | 'Fire'
  | 'Gas leak'
  | 'Blackout'
  | 'Medical'
  | 'Evacuation'
  | 'Shelter-in-place'
  | 'Drill'
  | 'Security'
  | 'General';

export function alertTypeToCategory(type: AlertType, isDrill?: boolean): IncidentCategory {
  if (isDrill || type === 'Drill') return 'Drill';
  switch (type) {
    case 'Blackout': return 'Blackout';
    case 'Shelter-in': return 'Shelter-in-place';
    case 'Security Alert': return 'Security';
    case 'Restricted Movement': return 'Evacuation';
    default: return 'General';
  }
}

// Base checklist items shared by all incidents, plus per-category additions.
const BASE_ITEMS: string[] = [
  'Confirm incident location and type',
  'Notify affected zone supervisors',
  'Verify alarm broadcast delivered',
];

const CATEGORY_ITEMS: Record<IncidentCategory, string[]> = {
  Fire: [
    'Dispatch fire team to source',
    'Confirm isolation of fuel/gas sources',
    'Establish hot/warm/cold zones',
    'Confirm muster points clear of smoke/wind',
  ],
  'Gas leak': [
    'Identify gas type and source',
    'Set hot/warm/cold zones from wind direction',
    'Confirm downwind personnel evacuated',
    'Request gas detection sweep',
  ],
  Blackout: [
    'Confirm backup power / lighting status',
    'Account for personnel in dark areas',
    'Restrict non-essential movement',
  ],
  Medical: [
    'Dispatch medical team',
    'Clear access route for responders',
    'Confirm casualty count and severity',
  ],
  Evacuation: [
    'Confirm evacuation routes are clear',
    'Direct personnel to muster points',
    'Track headcount at each muster point',
  ],
  'Shelter-in-place': [
    'Confirm doors/windows secured',
    'Confirm ventilation actions taken',
    'Account for all personnel indoors',
  ],
  Drill: [
    'Announce drill start to participants',
    'Observe response times',
    'Record drill performance for scoring',
  ],
  Security: [
    'Notify site security and gate control',
    'Restrict movement across zones',
    'Confirm suspicious activity location',
  ],
  General: [
    'Assess scope and severity',
    'Assign incident roles',
  ],
};

const CLOSE_ITEMS: string[] = [
  'Declare hazard all clear when controlled',
  'Complete personnel accountability',
  'Generate incident report',
];

export function checklistForAlert(type: AlertType, isDrill?: boolean): ChecklistItem[] {
  const category = alertTypeToCategory(type, isDrill);
  const labels = [...BASE_ITEMS, ...(CATEGORY_ITEMS[category] ?? []), ...CLOSE_ITEMS];
  return labels.map((label, i) => ({
    id: `chk_${i}_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24)}`,
    label,
    done: false,
  }));
}

// Communication tree placeholder — structured contact/escalation list.
// detail is a role note for now; future backend supplies real contacts.
export const COMMS_TREE: CommsContact[] = [
  { id: 'eco',        category: 'ECO',        label: 'Emergency Control Officer', detail: 'On-duty ECO (slot A/B/C)' },
  { id: 'supervisor', category: 'Supervisor', label: 'Area Supervisors',          detail: 'All affected-location supervisors' },
  { id: 'area',       category: 'Area Owner', label: 'Area Owner / Operations',   detail: 'Process area owner' },
  { id: 'security',   category: 'Security',   label: 'Site Security',             detail: 'Gate control & patrols' },
  { id: 'medical',    category: 'Medical',    label: 'Medical / Clinic',          detail: 'On-site clinic' },
  { id: 'fire',       category: 'Fire Team',  label: 'Fire & Rescue',             detail: 'Industrial fire team' },
  { id: 'management', category: 'Management', label: 'Site Management',           detail: 'Duty manager / leadership' },
];
