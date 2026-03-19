import React from 'react';
import { useLocation } from 'wouter';
import { MapPin, ShieldCheck, Wifi, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileLocationPermission() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[428px] min-h-screen bg-background border-x border-border/40 flex flex-col items-center justify-center p-8 text-center">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <MapPin className="w-14 h-14 text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">Location Access Required</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          This emergency alert system requires access to your device location to determine which safety zone you are currently in (CPF or Camp).
        </p>

        {/* Why we need it */}
        <div className="w-full space-y-3 mb-8">
          {[
            { icon: MapPin, text: 'Detect which zone you are physically in' },
            { icon: ShieldCheck, text: 'Send you alerts relevant to your zone' },
            { icon: Wifi, text: 'Works on WiFi and mobile data' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-left bg-card rounded-xl p-3.5 border border-border/60">
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        <div className="w-full space-y-3">
          <Button
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl"
            onClick={() => navigate('/mobile/home')}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Enable Location Access
          </Button>
          <button
            className="w-full text-sm text-muted-foreground py-3 hover:text-foreground transition-colors"
            onClick={() => navigate('/login')}
          >
            Exit App
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/60">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Your location is only shared with the emergency system</span>
        </div>
      </div>
    </div>
  );
}
