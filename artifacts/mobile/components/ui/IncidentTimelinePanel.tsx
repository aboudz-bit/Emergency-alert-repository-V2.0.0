import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { useIncidentReplay, type ReplaySpeed } from '@/hooks/useIncidentReplay';
import type { IncidentEvent, IncidentEventType } from '@/types';

const EVENT_ICONS: Record<IncidentEventType, { icon: string; color: string }> = {
  alert_started:        { icon: 'alert-circle',      color: '#EF4444' },
  alert_ended:          { icon: 'checkmark-circle',   color: '#22C55E' },
  user_received_alert:  { icon: 'notifications',      color: '#F59E0B' },
  user_safe:            { icon: 'shield-checkmark',    color: '#22C55E' },
  user_need_help:       { icon: 'warning',             color: '#EF4444' },
  escalation_level_1:   { icon: 'arrow-up-circle',     color: '#F59E0B' },
  escalation_critical:  { icon: 'flame',               color: '#DC2626' },
  broadcast_sent:       { icon: 'megaphone',            color: '#3B82F6' },
  zone_updated:         { icon: 'location',             color: '#8B5CF6' },
  shelter_assigned:     { icon: 'home',                 color: '#0EA5E9' },
  shelter_in_activated: { icon: 'shield',               color: '#F97316' },
  blackout_activated:   { icon: 'moon',                 color: '#1E293B' },
  supervisor_action:    { icon: 'person',               color: '#6366F1' },
  all_clear:            { icon: 'checkmark-done-circle',color: '#10B981' },
};

function eventLabel(evt: IncidentEvent): string {
  switch (evt.type) {
    case 'alert_started':
      return `Alert Started${evt.zoneName ? ` — ${evt.zoneName}` : ''}`;
    case 'alert_ended':
      return 'Alert Ended';
    case 'user_safe':
      return `${evt.userName ?? 'User'} marked SAFE`;
    case 'user_need_help':
      return `${evt.userName ?? 'User'} needs HELP`;
    case 'escalation_level_1':
      return `${evt.userName ?? 'User'} escalated (Level 1)`;
    case 'escalation_critical':
      return `${evt.userName ?? 'User'} CRITICAL escalation`;
    case 'zone_updated': {
      const action = (evt.metadata?.action as string) ?? 'updated';
      return `Zone ${evt.zoneName ?? ''} ${action}`;
    }
    case 'shelter_in_activated':
      return `Shelter-In activated by ${evt.userName ?? 'System'}`;
    case 'blackout_activated':
      return `Blackout activated by ${evt.userName ?? 'System'}`;
    case 'all_clear':
      return `ALL CLEAR by ${evt.userName ?? 'System'}`;
    default:
      return evt.type.replace(/_/g, ' ');
  }
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

interface Props {
  onEventFocus?: (event: IncidentEvent) => void;
}

export default function IncidentTimelinePanel({ onEventFocus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'live' | 'replay'>('live');
  const timeline = useStore((s) => s.incidentTimeline);
  const clearTimeline = useStore((s) => s.clearIncidentTimeline);
  const scrollRef = useRef<ScrollView>(null);

  const replay = useIncidentReplay();
  const events = mode === 'replay' ? replay.visibleEvents : timeline;
  const eventCount = mode === 'replay' ? replay.totalEvents : timeline.length;

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);
  const switchMode = useCallback((m: 'live' | 'replay') => {
    setMode(m);
    if (m === 'live') replay.reset();
  }, [replay]);

  if (eventCount === 0 && !expanded) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={16} color="#94A3B8" />
          <Text style={styles.headerTitle}>TIMELINE</Text>
          {eventCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eventCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={16}
          color="#64748B"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'live' && styles.modeBtnActive]}
              onPress={() => switchMode('live')}
            >
              <Text style={[styles.modeBtnText, mode === 'live' && styles.modeBtnTextActive]}>
                Live
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'replay' && styles.modeBtnActive]}
              onPress={() => switchMode('replay')}
            >
              <Text style={[styles.modeBtnText, mode === 'replay' && styles.modeBtnTextActive]}>
                Replay
              </Text>
            </TouchableOpacity>
            {mode === 'live' && eventCount > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearTimeline}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {mode === 'replay' && <ReplayControls replay={replay} />}

          <ScrollView
            ref={scrollRef}
            style={styles.eventList}
            nestedScrollEnabled
            onContentSizeChange={() => {
              if (mode === 'live') scrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {events.length === 0 ? (
              <Text style={styles.emptyText}>
                {mode === 'replay' ? 'Press play to start replay' : 'No events recorded yet'}
              </Text>
            ) : (
              events.map((evt, idx) => (
                <TimelineEvent
                  key={evt.id}
                  event={evt}
                  isLast={idx === events.length - 1}
                  isCurrent={mode === 'replay' && idx === replay.currentIndex}
                  onPress={() => {
                    if (mode === 'replay') replay.scrubTo(idx);
                    onEventFocus?.(evt);
                  }}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function ReplayControls({ replay }: { replay: ReturnType<typeof useIncidentReplay> }) {
  const speeds: ReplaySpeed[] = [1, 2, 4, 8];

  return (
    <View style={styles.replayBar}>
      <View style={styles.replayBtns}>
        <TouchableOpacity onPress={replay.reset} style={styles.replayBtn}>
          <Ionicons name="refresh" size={18} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={replay.isPlaying ? replay.pause : replay.play}
          style={[styles.replayBtn, styles.playBtn]}
        >
          <Ionicons
            name={replay.isPlaying ? 'pause' : 'play'}
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${replay.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {formatDuration(replay.elapsed)} / {formatDuration(replay.duration)}
        </Text>
      </View>

      <View style={styles.speedRow}>
        {speeds.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.speedBtn, replay.speed === s && styles.speedBtnActive]}
            onPress={() => replay.setSpeed(s)}
          >
            <Text style={[styles.speedBtnText, replay.speed === s && styles.speedBtnTextActive]}>
              {s}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TimelineEvent({
  event,
  isLast,
  isCurrent,
  onPress,
}: {
  event: IncidentEvent;
  isLast: boolean;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const cfg = EVENT_ICONS[event.type] ?? { icon: 'ellipse', color: '#64748B' };

  return (
    <TouchableOpacity
      style={[styles.eventRow, isCurrent && styles.eventRowCurrent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.eventTimeline}>
        <View style={[styles.eventDot, { backgroundColor: cfg.color }]}>
          <Ionicons name={cfg.icon as any} size={12} color="#FFF" />
        </View>
        {!isLast && <View style={styles.eventLine} />}
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventLabel} numberOfLines={2}>
          {eventLabel(event)}
        </Text>
        <Text style={styles.eventTime}>{formatTs(event.timestamp)}</Text>
        {event.locationName && (
          <Text style={styles.eventMeta}>{event.locationName}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  modeBtnActive: {
    backgroundColor: '#3B82F6',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  clearBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  replayBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  replayBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: '#3B82F6',
  },
  progressContainer: {
    gap: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'right',
  },
  speedRow: {
    flexDirection: 'row',
    gap: 4,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  speedBtnActive: {
    backgroundColor: '#3B82F6',
  },
  speedBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  speedBtnTextActive: {
    color: '#FFF',
  },
  eventList: {
    maxHeight: 280,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  eventRowCurrent: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  eventTimeline: {
    width: 28,
    alignItems: 'center',
    paddingTop: 4,
  },
  eventDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E293B',
    marginVertical: 2,
  },
  eventContent: {
    flex: 1,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingBottom: 8,
  },
  eventLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  eventTime: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  eventMeta: {
    color: '#475569',
    fontSize: 10,
    marginTop: 1,
  },
});
