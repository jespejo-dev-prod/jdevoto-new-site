'use client';

import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatsCardProps {
  title: string;
  value: string;
  unit?: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  data: { value: number }[];
}

export function StatsCard({ title, value, unit, change, trend, icon: Icon, data }: StatsCardProps) {
  const isUp = trend === 'up';

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900/60 transition-all group overflow-hidden relative">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
          <Icon className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
        </div>
        <button className="text-zinc-600 hover:text-zinc-400">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
          {unit && <span className="text-xs text-zinc-600 font-medium">{unit}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
        <div className="h-[20px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isUp ? "#22c55e" : "#ef4444"} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
