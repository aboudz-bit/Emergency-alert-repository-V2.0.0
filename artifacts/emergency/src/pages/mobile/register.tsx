import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cpfLocations, campLocations } from '@/lib/mock-data';

export default function MobileRegister() {
  const [, navigate] = useLocation();
  const [zone, setZone] = useState<'CPF' | 'Camp'>('CPF');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const locations = zone === 'CPF' ? cpfLocations : campLocations;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/mobile/location-permission');
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[428px] min-h-screen bg-background border-x border-border/40 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center pt-12 pb-6 px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
            <ShieldAlert className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground text-center">Create Account</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">Khurais Emergency Alert System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex-1 px-6 pb-8 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</Label>
            <Input placeholder="e.g. Abdullah Al-Rashidi" className="h-12 bg-card border-border text-sm" required />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Badge Number</Label>
            <Input placeholder="6-digit badge number" className="h-12 bg-card border-border text-sm font-mono" maxLength={6} required />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</Label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} placeholder="Create a password" className="h-12 bg-card border-border text-sm pr-12" required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</Label>
            <div className="relative">
              <Input type={showCPw ? 'text' : 'password'} placeholder="Repeat your password" className="h-12 bg-card border-border text-sm pr-12" required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCPw(v => !v)}>
                {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Working On</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['CPF', 'Camp'] as const).map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z)}
                  className={`h-12 rounded-lg border text-sm font-semibold transition-all ${
                    zone === z
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</Label>
            <Select>
              <SelectTrigger className="h-12 bg-card border-border text-sm">
                <SelectValue placeholder="Select your location..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full h-13 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl">
              REGISTER
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-medium">Sign In</a>
          </p>
        </form>
      </div>
    </div>
  );
}
