'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const barData = [
  { name: 'Apr 2025', paid: 1200, checkout: 1500 },
  { name: 'May 2025', paid: 1400, checkout: 1800 },
  { name: 'Jun 2025', paid: 1100, checkout: 1300 },
  { name: 'Jul 2025', paid: 1600, checkout: 1900 },
  { name: 'Aug 2025', paid: 1300, checkout: 1700 },
  { name: 'Sep 2025', paid: 1500, checkout: 1850 },
  { name: 'Oct 2025', paid: 1700, checkout: 2000 },
];

const pieData = [
  { name: 'To Be Packed', value: 110000, color: '#3b82f6' },
  { name: 'Process Delivery', value: 98000, color: '#06b6d4' },
  { name: 'Delivery Done', value: 140000, color: '#10b981' },
  { name: 'Returned', value: 67236, color: '#f43f5e' },
];

export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Customers Activity
            </h3>
            <p className="text-xs text-zinc-500">Comportamiento de compra mensual</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded-sm bg-blue-500" /> Paid product
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded-sm bg-cyan-500" /> Checkout Product
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="paid" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="checkout" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Product Activity
          </h3>
          <div className="flex gap-1">
            {['1W', '1M', '3M'].map(t => (
              <button key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors uppercase font-bold">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">415.236</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-tighter font-bold">Total Activity</span>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {pieData.map(item => (
            <div key={item.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">{item.name}</span>
              </div>
              <span className="text-[11px] font-bold text-zinc-200">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Customers Active
          </h3>
          <button className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {[
            { country: 'United Kingdom', flag: '🇬🇧', value: 12628, percentage: 80, color: 'bg-green-500' },
            { country: 'United States', flag: '🇺🇸', value: 10628, percentage: 70, color: 'bg-orange-500' },
            { country: 'Sweden', flag: '🇸🇪', value: 8628, percentage: 60, color: 'bg-blue-500' },
            { country: 'Turkey', flag: '🇹🇷', value: 6628, percentage: 40, color: 'bg-purple-500' },
            { country: 'Spain', flag: '🇪🇸', value: 3628, percentage: 30, color: 'bg-yellow-500' },
          ].map((item) => (
            <div key={item.country} className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <span className="text-zinc-300">{item.country}</span>
                </div>
                <div className="text-zinc-400">
                  <span className="text-zinc-100 font-bold">{item.value.toLocaleString()}</span> ({item.percentage}%)
                </div>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={cn("h-full rounded-full", item.color)} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

