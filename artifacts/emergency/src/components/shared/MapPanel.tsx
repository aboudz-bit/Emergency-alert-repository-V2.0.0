import React from 'react';
import { useStore } from '@/store';
import type { User, AlertResponseStatus } from '@/types';

/**
 * Returns the marker color for a user based on alert response status and employment type.
 *
 * Priority:
 *   need_help → red
 *   safe → green
 *   contract (no alert response) → yellow
 *   aramco (no alert response) → blue
 */
export function getPersonnelMarkerColor(user: User): string {
  if (user.alertResponseStatus === 'need_help') return '#EF4444'; // red
  if (user.alertResponseStatus === 'safe') return '#22c55e';      // green
  if (user.employmentType === 'contract') return '#eab308';       // yellow
  return '#3b82f6'; // blue (aramco default)
}

export function MapPanel() {
  const users = useStore(s => s.users);

  const cpfUsers = users.filter(u => u.zone === 'CPF' && u.isActive);
  const campUsers = users.filter(u => u.zone === 'Camp' && u.isActive);

  // Generate scattered positions within each zone polygon for live dots
  const cpfBounds = { xMin: 180, xMax: 460, yMin: 130, yMax: 380 };
  const campBounds = { xMin: 520, xMax: 720, yMin: 270, yMax: 480 };

  function seededPositions(userList: User[], bounds: typeof cpfBounds) {
    return userList.map((u, i) => {
      // Deterministic scatter using user id
      const seed = u.id * 2654435761;
      const px = bounds.xMin + ((seed >>> 0) % (bounds.xMax - bounds.xMin));
      const py = bounds.yMin + (((seed >>> 16) ^ (seed >>> 8)) % (bounds.yMax - bounds.yMin));
      return { user: u, cx: px, cy: py };
    });
  }

  const cpfDots = seededPositions(cpfUsers, cpfBounds);
  const campDots = seededPositions(campUsers, campBounds);

  return (
    <div className="w-full h-full min-h-[500px] bg-[#0a0c10] rounded-xl border border-border relative overflow-hidden flex items-center justify-center">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="text-muted-foreground" />
      </svg>

      <svg viewBox="0 0 800 600" className="w-full max-w-4xl h-auto relative z-10 drop-shadow-2xl">
        {/* CPF Zone Polygon */}
        <g className="cursor-pointer hover:opacity-80 transition-opacity">
          <polygon
            points="150,150 350,100 500,200 450,400 200,350"
            fill="rgba(239, 68, 68, 0.15)"
            stroke="#EF4444"
            strokeWidth="3"
            className="animate-pulse"
          />
          <text x="300" y="250" fill="#EF4444" className="font-display font-bold text-2xl tracking-widest" textAnchor="middle">CPF ZONE</text>
          <text x="300" y="280" fill="#f1f5f9" className="font-sans text-sm" textAnchor="middle">{cpfUsers.length} Active Personnel</text>

          {/* Live personnel dots */}
          {cpfDots.map(({ user, cx, cy }) => (
            <circle key={user.id} cx={cx} cy={cy} r="4" fill={getPersonnelMarkerColor(user)} />
          ))}
        </g>

        {/* Camp Zone Polygon */}
        <g className="cursor-pointer hover:opacity-80 transition-opacity">
          <polygon
            points="550,250 750,300 700,500 500,450"
            fill="rgba(59, 130, 246, 0.15)"
            stroke="#3b82f6"
            strokeWidth="3"
          />
          <text x="625" y="360" fill="#3b82f6" className="font-display font-bold text-2xl tracking-widest" textAnchor="middle">CAMP</text>
          <text x="625" y="390" fill="#f1f5f9" className="font-sans text-sm" textAnchor="middle">{campUsers.length} Active Personnel</text>

          {/* Live personnel dots */}
          {campDots.map(({ user, cx, cy }) => (
            <circle key={user.id} cx={cx} cy={cy} r="4" fill={getPersonnelMarkerColor(user)} />
          ))}
        </g>
      </svg>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur border border-border rounded-lg p-2 shadow-lg flex flex-col gap-2">
        <button className="w-8 h-8 flex items-center justify-center bg-background rounded border border-border hover:bg-muted text-foreground transition-colors">+</button>
        <button className="w-8 h-8 flex items-center justify-center bg-background rounded border border-border hover:bg-muted text-foreground transition-colors">-</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-4 shadow-lg">
        <h4 className="text-sm font-semibold text-foreground mb-3">Personnel Legend</h4>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span> Aramco</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#eab308]"></span> Contract</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22c55e]"></span> Safe</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> Need Help</div>
        </div>
      </div>
    </div>
  );
}
