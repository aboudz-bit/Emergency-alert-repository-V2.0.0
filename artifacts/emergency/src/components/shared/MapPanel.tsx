import React from 'react';
import { Users } from 'lucide-react';

export function MapPanel() {
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
          <text x="300" y="280" fill="#f1f5f9" className="font-sans text-sm" textAnchor="middle">30 Active Personnel</text>
          
          {/* Scatter points representing users */}
          <circle cx="200" cy="200" r="4" fill="#22c55e" />
          <circle cx="250" cy="180" r="4" fill="#22c55e" />
          <circle cx="350" cy="300" r="4" fill="#eab308" />
          <circle cx="400" cy="220" r="4" fill="#22c55e" />
          <circle cx="280" cy="320" r="4" fill="#eab308" />
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
          <text x="625" y="390" fill="#f1f5f9" className="font-sans text-sm" textAnchor="middle">20 Active Personnel</text>
          
          <circle cx="600" cy="300" r="4" fill="#22c55e" />
          <circle cx="680" cy="350" r="4" fill="#22c55e" />
          <circle cx="650" cy="450" r="4" fill="#22c55e" />
        </g>
      </svg>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur border border-border rounded-lg p-2 shadow-lg flex flex-col gap-2">
        <button className="w-8 h-8 flex items-center justify-center bg-background rounded border border-border hover:bg-muted text-foreground transition-colors">+</button>
        <button className="w-8 h-8 flex items-center justify-center bg-background rounded border border-border hover:bg-muted text-foreground transition-colors">-</button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-4 shadow-lg">
        <h4 className="text-sm font-semibold text-foreground mb-3">Live Status</h4>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-safe"></span> Confirmed Safe</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-missing"></span> Missing / Unresponsive</div>
        </div>
      </div>
    </div>
  );
}
