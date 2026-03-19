import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Settings, Globe, Map, Bell, Shield, HelpCircle, Save, Wifi, MapPin, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useStore, useShallow } from '@/store';

function SettingsCard({ icon: Icon, title, description, children, onSave }: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Separator className="bg-border/60" />
      <div className="space-y-4">{children}</div>
      <div className="flex justify-end pt-1">
        <Button onClick={onSave} size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2">
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function PolicyRow({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Icon className="w-4 h-4 text-primary/70 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, updateNotificationSettings } = useStore(useShallow(s => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
    updateNotificationSettings: s.updateNotificationSettings,
  })));

  return (
    <AdminLayout breadcrumbs={[{ label: 'Settings' }]}>
      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">System Settings</h1>
            <p className="text-sm text-muted-foreground">Configure system-wide preferences and policies</p>
          </div>
        </div>

        {/* General */}
        <SettingsCard
          icon={Globe}
          title="General"
          description="Core system preferences and locale configuration"
          onSave={() => {}}
        >
          <SettingRow label="System Name">
            <Input
              value={settings.systemName}
              onChange={e => updateSettings({ systemName: e.target.value })}
              className="w-full sm:w-64 h-8 text-sm"
            />
          </SettingRow>
          <SettingRow label="Timezone">
            <Select value={settings.timezone} onValueChange={v => updateSettings({ timezone: v })}>
              <SelectTrigger className="w-48 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ast">AST (UTC+3)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">EST (UTC-5)</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Primary Language">
            <Select value={settings.language} onValueChange={v => updateSettings({ language: v })}>
              <SelectTrigger className="w-48 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Planned)</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="RTL Support" description="Arabic right-to-left layout — planned for Phase 3">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.rtlSupport}
                onCheckedChange={v => updateSettings({ rtlSupport: v })}
                disabled
              />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Soon</Badge>
            </div>
          </SettingRow>
        </SettingsCard>

        {/* Zone Management */}
        <SettingsCard
          icon={Map}
          title="Zone Management"
          description="GPS geofencing and location detection settings"
          onSave={() => {}}
        >
          <SettingRow label="Auto-detect zone entry / exit" description="Use GPS to automatically assign users to zones">
            <Switch
              checked={settings.autoDetectZone}
              onCheckedChange={v => updateSettings({ autoDetectZone: v })}
            />
          </SettingRow>
          <SettingRow label="GPS Accuracy Threshold">
            <Select
              value={String(settings.gpsAccuracyMeters)}
              onValueChange={v => updateSettings({ gpsAccuracyMeters: Number(v) })}
            >
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 meters</SelectItem>
                <SelectItem value="25">25 meters</SelectItem>
                <SelectItem value="50">50 meters</SelectItem>
                <SelectItem value="100">100 meters</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Location Update Interval">
            <Select
              value={String(settings.locationUpdateIntervalSeconds)}
              onValueChange={v => updateSettings({ locationUpdateIntervalSeconds: Number(v) })}
            >
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Every 15 sec</SelectItem>
                <SelectItem value="30">Every 30 sec</SelectItem>
                <SelectItem value="60">Every 1 min</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingsCard>

        {/* Hazard Zone Defaults */}
        <SettingsCard
          icon={AlertTriangle}
          title="Hazard Zone Defaults"
          description="Default radius values for Red / Yellow / Green warning zones (in meters)"
          onSave={() => {}}
        >
          <SettingRow label="Red Zone Radius (Danger)" description="Inner danger zone radius in meters">
            <Input
              type="number"
              min={10}
              max={1000}
              value={settings.hazardRedRadius}
              onChange={e => updateSettings({ hazardRedRadius: Number(e.target.value) || 50 })}
              className="w-32 h-8 text-sm"
            />
          </SettingRow>
          <SettingRow label="Yellow Zone Radius (Hazard)" description="Middle hazard zone radius in meters">
            <Input
              type="number"
              min={10}
              max={2000}
              value={settings.hazardYellowRadius}
              onChange={e => updateSettings({ hazardYellowRadius: Number(e.target.value) || 150 })}
              className="w-32 h-8 text-sm"
            />
          </SettingRow>
          <SettingRow label="Green Zone Radius (Safe)" description="Outer safe perimeter radius in meters">
            <Input
              type="number"
              min={10}
              max={5000}
              value={settings.hazardGreenRadius}
              onChange={e => updateSettings({ hazardGreenRadius: Number(e.target.value) || 300 })}
              className="w-32 h-8 text-sm"
            />
          </SettingRow>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          icon={Bell}
          title="Notifications"
          description="Alert delivery and escalation configuration"
          onSave={() => {}}
        >
          <SettingRow label="Alert Sound" description="Play an alarm tone when emergency alerts are broadcast">
            <Switch
              checked={settings.notifications.alertSound}
              onCheckedChange={v => updateNotificationSettings({ alertSound: v })}
            />
          </SettingRow>
          <SettingRow label="Push Notifications" description="Send mobile push notifications to all in-zone users">
            <Switch
              checked={settings.notifications.pushNotifications}
              onCheckedChange={v => updateNotificationSettings({ pushNotifications: v })}
            />
          </SettingRow>
          <SettingRow label="Escalation Timeout" description="Auto-escalate if no response within this window">
            <Select
              value={String(settings.notifications.escalationTimeoutMinutes)}
              onValueChange={v => updateNotificationSettings({ escalationTimeoutMinutes: Number(v) })}
            >
              <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingsCard>

        {/* Account & Security */}
        <SettingsCard
          icon={Shield}
          title="Account & Security"
          description="Authentication policies and session management"
          onSave={() => {}}
        >
          <SettingRow label="Session Timeout" description="Automatically log out inactive users">
            <Select
              value={String(settings.sessionTimeoutMinutes)}
              onValueChange={v => updateSettings({ sessionTimeoutMinutes: Number(v) })}
            >
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Login Method" description="How users authenticate into the system">
            <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">Badge Number + Password</Badge>
          </SettingRow>
          <div className="pt-2 space-y-2.5 rounded-lg bg-muted/30 border border-border/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Policies</p>
            <PolicyRow icon={UserCheck} text="Badge number is used as the username — no email required" />
            <PolicyRow icon={MapPin} text="Location permission is mandatory for app functionality" />
            <PolicyRow icon={Wifi} text="System works on both WiFi and mobile data (4G/LTE)" />
            <PolicyRow icon={Clock} text="RTL (Arabic) support planned for Phase 3" />
          </div>
        </SettingsCard>

        {/* Support */}
        <SettingsCard
          icon={HelpCircle}
          title="Support"
          description="System information and IT contact details"
          onSave={() => {}}
        >
          <SettingRow label="System Version">
            <Badge variant="outline" className="font-mono text-xs">{settings.systemVersion}</Badge>
          </SettingRow>
          <SettingRow label="Environment">
            <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">Development</Badge>
          </SettingRow>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" size="sm" className="gap-2 flex-1">
              <HelpCircle className="w-4 h-4" />
              Contact IT Support
            </Button>
            <Button variant="outline" size="sm" className="gap-2 flex-1">
              View Documentation
            </Button>
          </div>
        </SettingsCard>
      </div>
    </AdminLayout>
  );
}
