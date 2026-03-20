import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ShieldAlert, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cpfLocations, campLocations } from '@/lib/mock-data';
import { useStore } from '@/store';
import type { EmploymentType } from '@/types';

export default function MobileRegister() {
  const [, navigate] = useLocation();
  const registerUser = useStore(s => s.registerUser);
  const login = useStore(s => s.login);

  const [zone, setZone] = useState<'CPF' | 'Camp'>('CPF');
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const locationOptions = zone === 'CPF' ? cpfLocations : campLocations;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (badge.length !== 6 || !/^\d+$/.test(badge)) {
      setError('Badge number must be exactly 6 digits.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!employmentType) {
      setError('Please select an employment type.');
      return;
    }
    if (!location) {
      setError('Please select a location.');
      return;
    }

    const result = registerUser({ name, badge, password, zone, location, employmentType });
    if (!result.success) {
      setError(result.error || 'Registration failed.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      login(badge, password);
      navigate('/mobile/location-permission');
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-[428px] min-h-screen bg-background border-x border-border/40 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-safe/10 border border-safe/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-safe" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Account Created!</h2>
          <p className="text-muted-foreground text-sm">Redirecting you to set up location permissions...</p>
        </div>
      </div>
    );
  }

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
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Abdullah Al-Rashidi"
              className="h-12 bg-card border-border text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Badge Number</Label>
            <Input
              value={badge}
              onChange={e => setBadge(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit badge number"
              className="h-12 bg-card border-border text-sm font-mono"
              maxLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</Label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="h-12 bg-card border-border text-sm pr-12"
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</Label>
            <div className="relative">
              <Input
                type={showCPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="h-12 bg-card border-border text-sm pr-12"
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCPw(v => !v)}>
                {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employment Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {([{ value: 'Aramco', label: 'Aramco' }, { value: 'Contract', label: 'Contract' }] as const).map(et => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setEmploymentType(et.value)}
                  className={`h-12 rounded-lg border text-sm font-semibold transition-all ${
                    employmentType === et.value
                      ? et.value === 'Aramco'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Working On</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['CPF', 'Camp'] as const).map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => { setZone(z); setLocation(''); }}
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
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger className="h-12 bg-card border-border text-sm">
                <SelectValue placeholder="Select your location..." />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl">
              REGISTER
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
