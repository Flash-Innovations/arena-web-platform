import React from 'react';
import { Shield, Award, Crown, Swords, Zap, Flame } from 'lucide-react';

export function getTierFromElo(elo = 1200) {
  const rating = Number(elo) || 1200;
  if (rating < 1000) {
    return {
      name: 'Initiate',
      color: 'text-zinc-400',
      bg: 'bg-zinc-800/80',
      border: 'border-zinc-700',
      icon: Shield
    };
  }
  if (rating < 1200) {
    return {
      name: 'Challenger',
      color: 'text-amber-500',
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/60',
      icon: Swords
    };
  }
  if (rating < 1400) {
    return {
      name: 'Combatant',
      color: 'text-slate-300',
      bg: 'bg-slate-800/60',
      border: 'border-slate-600/60',
      icon: Shield
    };
  }
  if (rating < 1600) {
    return {
      name: 'Centurion',
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-600/60',
      icon: Award
    };
  }
  if (rating < 1800) {
    return {
      name: 'Vanguard',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-600/60',
      icon: Zap
    };
  }
  if (rating < 2000) {
    return {
      name: 'Sovereign',
      color: 'text-purple-400',
      bg: 'bg-purple-950/40',
      border: 'border-purple-600/60',
      icon: Crown
    };
  }
  return {
    name: 'Grand Champion',
    color: 'text-rose-400',
    bg: 'bg-rose-950/50',
    border: 'border-rose-500/80 shadow-rose-950/50 shadow-lg',
    icon: Flame,
    glow: true
  };
}

export default function GladiatorBadge({
  elo = 1200,
  tierName,
  size = 'md',
  showElo = true,
  className = ''
}) {
  const tier = getTierFromElo(elo);
  const displayName = tierName || tier.name;
  const IconComponent = tier.icon;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono tracking-wide ${tier.bg} ${tier.border} ${tier.color} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <IconComponent size={iconSizes[size] || 14} className="shrink-0" />
      <span className="font-semibold uppercase tracking-wider">{displayName}</span>
      {showElo && (
        <span className="font-normal opacity-80 border-l border-current/20 pl-1.5">
          {elo}
        </span>
      )}
    </span>
  );
}
