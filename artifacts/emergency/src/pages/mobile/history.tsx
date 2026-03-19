import React from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useStore, useShallow } from '@/store';
import { format } from 'date-fns';
import { MapPin, Tag, Inbox } from 'lucide-react';

function getAlertIconColor(type: string): string {
  switch (type) {
    case 'All Clear': return '#16A34A';
    case 'Drill': return '#5B3A8E';
    default: return '#5B3A8E';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'closed': return 'Closed';
    case 'active': return 'Active';
    default: return status;
  }
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'closed': return 'bg-[#F0F1F4] text-[#6B7280] border-[#E5E7EB]';
    case 'active': return 'bg-[rgba(91,58,142,0.08)] text-[#5B3A8E] border-[rgba(91,58,142,0.16)]';
    default: return 'bg-[#F0F1F4] text-[#6B7280] border-[#E5E7EB]';
  }
}

export default function MobileHistory() {
  const { alerts } = useStore(useShallow(s => ({
    alerts: s.alerts,
  })));

  const closedAlerts = alerts.filter(a => a.status === 'closed');

  return (
    <MobileLayout>
      {/* Header — matches mobile Header component */}
      <div className="bg-[#5B3A8E] px-[18px] pt-[14px] pb-[18px]">
        <h1 className="text-[20px] font-bold text-white">Alert History</h1>
        <p className="text-[13px] text-white/70 mt-0.5">{closedAlerts.length} past alerts</p>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto p-[18px] space-y-[14px]">
        {closedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-[120px] px-10 space-y-[14px]">
            <div className="w-[72px] h-[72px] rounded-full bg-[#F0F1F4] flex items-center justify-center mb-2">
              <Inbox className="w-10 h-10 text-[#9CA3AF]" />
            </div>
            <p className="text-[24px] font-bold text-[#111111]">No Alert History</p>
            <p className="text-[15px] text-[#6B7280] text-center leading-[22px]">
              Past emergency alerts will appear here once they have been closed.
            </p>
          </div>
        ) : (
          closedAlerts.map((alert) => {
            const formattedDate = format(new Date(alert.timestamp), "MMM d, yyyy 'at' h:mm a");
            const iconColor = getAlertIconColor(alert.type);

            return (
              <div key={alert.id} className="bg-white border border-[#E5E7EB] rounded-xl p-[18px] space-y-[14px]">
                {/* Header row: icon + title/timestamp + status badge */}
                <div className="flex items-center gap-[14px]">
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${iconColor}20` }}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-semibold text-[#111111] truncate">{alert.title}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{formattedDate}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full border shrink-0 ${getStatusClasses(alert.status)}`}>
                    {getStatusLabel(alert.status)}
                  </span>
                </div>

                {/* Meta chips */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-[#F0F1F4] px-2 py-1 rounded-md">
                    <MapPin className="w-[11px] h-[11px] text-[#6B7280]" />
                    <span className="text-[11px] font-medium text-[#6B7280]">{alert.zone}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F0F1F4] px-2 py-1 rounded-md">
                    <Tag className="w-[11px] h-[11px] text-[#6B7280]" />
                    <span className="text-[11px] font-medium text-[#6B7280]">{alert.type}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex justify-around bg-[#F0F1F4] rounded-md py-[14px] px-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mb-0.5" />
                    <span className="text-[17px] font-bold text-[#111111]">{alert.stats.confirmed}</span>
                    <span className="text-[11px] text-[#6B7280]">Safe</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] mb-0.5" />
                    <span className="text-[17px] font-bold text-[#111111]">{alert.stats.missing}</span>
                    <span className="text-[11px] text-[#6B7280]">Pending</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B3A8E] mb-0.5" />
                    <span className="text-[17px] font-bold text-[#111111]">{alert.stats.needHelp}</span>
                    <span className="text-[11px] text-[#6B7280]">Need Help</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
