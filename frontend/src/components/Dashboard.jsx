import React, { useState } from 'react';
import { 
  AlertTriangle, UserX, ServerOff, Laptop, ChevronDown, 
  Search, Filter, ShieldAlert, Activity, Shield, Link2, Bell
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';

// Mock Data
const lineData = [
  { name: '19 Oct', alerts: 50 }, { name: '20 Oct', alerts: 80 },
  { name: '21 Oct', alerts: 60 }, { name: '22 Oct', alerts: 45 },
  { name: '23 Oct', alerts: 90 }, { name: '24 Oct', alerts: 110 },
  { name: '25 Oct', alerts: 85 }, { name: '26 Oct', alerts: 154 },
  { name: '27 Oct', alerts: 120 }, { name: '28 Oct', alerts: 130 },
];

const pieData = [
  { name: 'Hacktool', value: 13.5, color: '#34d399' }, // emerlad-400
  { name: 'Virus',    value: 10,   color: '#a855f7' }, // purple-500
  { name: 'Spyware',  value: 9.5,  color: '#ec4899' }, // pink-500
  { name: 'Malware',  value: 25.5, color: '#f59e0b' }, // amber-500
  { name: 'Phishing', value: 40.5, color: '#3b82f6' }, // blue-500
];

const barData = Array.from({ length: 30 }, (_, i) => ({
  name: `Agent ${i}`,
  value1: Math.floor(Math.random() * 50) + 10,
  value2: Math.floor(Math.random() * 30) + 5,
  value3: Math.floor(Math.random() * 20),
}));

const tableData = [
  { id: 1, name: 'Parked:velodrivv...', vendor: 'Palo Alto Networks', time: 'Sep 4, 2024', severity: 'Info', vColor: 'text-orange-500' },
  { id: 2, name: 'Weak Cipher Su...', vendor: 'Revain', time: 'Sep 7, 2024', severity: 'Info', vColor: 'text-purple-500' },
  { id: 3, name: 'Deprecated SSL/...', vendor: 'Zclassic', time: 'Sep 15, 2024', severity: 'Info', vColor: 'text-orange-400' },
  { id: 4, name: 'Parked:chihuahu...', vendor: 'ExtraHop', time: 'Sep 19, 2024', severity: 'Info', vColor: 'text-slate-100' },
  { id: 5, name: 'ARP Scan', vendor: 'SentinelOne', time: 'Sep 25, 2024', severity: 'Info', vColor: 'text-purple-600' },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
      
      {/* Top Row: Cards + Donut + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full h-full">
        
        {/* Left Column (Stat Cards + Area Chart) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              icon={<AlertTriangle className="h-4 w-4 text-slate-400" />} 
              label="Critical" 
              value="6,462" 
              trend="+42.8%" 
              trendUp={true} 
            />
            <StatCard 
              icon={<UserX className="h-4 w-4 text-slate-400" />} 
              label="Unassign Alerts" 
              value="15,540" 
              trend="-56.9%" 
              trendUp={false} 
            />
            <StatCard 
              icon={<ServerOff className="h-4 w-4 text-slate-400" />} 
              label="Assets Missing" 
              value="8,078" 
              trend="-83.2%" 
              trendUp={false} 
            />
            <StatCard 
              icon={<Laptop className="h-4 w-4 text-slate-400" />} 
              label="Agent Requiring" 
              value="428" 
              trend="+25.5%" 
              trendUp={true} 
            />
          </div>

          {/* High Alerts Line Chart */}
          <div className="glass-panel p-6 flex-1 min-h-[300px] flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="text-white/90 font-medium text-lg">High Alerts</h3>
              <button className="flex items-center gap-1 text-xs text-white/60 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-white/5">
                Week <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            
            <div className="flex justify-between items-end mb-6 relative z-10">
              <div>
                <p className="text-white/50 text-xs mb-1">Total time worked</p>
                <div className="flex items-end gap-2 text-white">
                  <span className="text-2xl font-bold tracking-tight">16 hr 30 min</span>
                </div>
              </div>
              <span className="text-white/80 font-medium font-mono text-sm">54.34%</span>
            </div>

            <div className="flex-1 w-full min-h-[160px] relative z-10 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#181622', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAlerts)" 
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Column (Donut Chart) */}
        <div className="lg:col-span-4 h-full">
          <div className="glass-panel p-6 h-full flex flex-col justify-between group relative overflow-hidden">
            <h3 className="text-white/90 font-medium text-lg mb-8 relative z-10">Open Alerts by Classification</h3>
            
            <div className="relative flex-1 flex items-center justify-center min-h-[220px]">
              <div className="absolute inset-0 flex items-center justify-center mt-2 flex-col pointer-events-none z-10">
                <span className="text-3xl font-bold text-white tracking-tight">9.1k</span>
                <span className="text-xs text-slate-400 mt-1">Application</span>
              </div>
              <ResponsiveContainer width="100%" height={260} className="relative z-0">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#181622', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-y-3 mt-4 relative z-10 w-full px-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 group/item">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover/item:scale-125" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 text-sm">{item.name}</span>
                  <span className="text-slate-500 text-xs ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Bar Chart) */}
        <div className="lg:col-span-4 h-full">
          <div className="glass-panel p-6 h-full flex flex-col group relative overflow-hidden">
             <h3 className="text-white/90 font-medium text-lg mb-4 relative z-10">Agents Requiring Attention</h3>
             
             <div className="flex justify-between items-end mb-6 relative z-10">
               <div>
                 <p className="text-white font-bold text-2xl font-mono tracking-tight">$21,374.00</p>
               </div>
               <span className="text-rose-400 font-mono text-sm">-$30.00 t</span>
             </div>

             <div className="flex-1 w-full min-h-[140px] relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                   <Bar dataKey="value1" stackId="a" fill="#f59e0b" radius={[0, 0, 2, 2]} />
                   <Bar dataKey="value2" stackId="a" fill="#ec4899" />
                   <Bar dataKey="value3" stackId="a" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                   <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#181622', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                 </BarChart>
               </ResponsiveContainer>
             </div>

             <div className="grid grid-cols-2 gap-y-3 mt-8 relative z-10 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-slate-400">Pending Deprecation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-slate-400">Reboot less</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span className="text-slate-400">Extended Exclusive</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400">NE CF Not</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Table + Some extra container placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 glass-panel p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-white/90 font-medium text-lg">Top 5 Open Alerts by Severity</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search identities" 
                  className="bg-black/20 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-500 w-48"
                />
              </div>
              <button className="p-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-400 bg-black/10 border-b border-white/5">
                <tr>
                  <th className="font-normal px-6 py-3 w-10">
                    <input type="checkbox" className="rounded bg-black/20 border-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0" />
                  </th>
                  <th className="font-normal px-4 py-3">Alert Name</th>
                  <th className="font-normal px-4 py-3">Vendor</th>
                  <th className="font-normal px-4 py-3">Reported Time</th>
                  <th className="font-normal px-4 py-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded bg-black/20 border-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-4 text-slate-200">{row.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center ${row.vColor}`}>
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        {row.vendor}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{row.time}</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {row.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 glass-panel p-6 flex flex-col group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white/90 font-medium text-lg">Quick Actions</h3>
          </div>
          <div className="space-y-3 flex-1">
             <button className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all group/btn">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover/btn:scale-110 group-hover/btn:bg-purple-500/20 transition-all">
                   <Link2 className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                   <p className="text-slate-200 font-medium text-sm">Connect Integration</p>
                   <p className="text-slate-500 text-xs mt-0.5">Add a new security vendor</p>
                 </div>
               </div>
             </button>
             <button className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all group/btn">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/btn:scale-110 group-hover/btn:bg-emerald-500/20 transition-all">
                   <Shield className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                   <p className="text-slate-200 font-medium text-sm">Run Deep Scan</p>
                   <p className="text-slate-500 text-xs mt-0.5">Initialize a new network scan</p>
                 </div>
               </div>
             </button>
             <button className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all group/btn">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/btn:scale-110 group-hover/btn:bg-blue-500/20 transition-all">
                   <Bell className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                   <p className="text-slate-200 font-medium text-sm">Configure Alerts</p>
                   <p className="text-slate-500 text-xs mt-0.5">Manage routing rules & notifications</p>
                 </div>
               </div>
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function StatCard({ icon, label, value, trend, trendUp }) {
  return (
    <div className="glass-panel p-5 flex flex-col group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-900/10 hover:shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
          {icon}
        </div>
        <span className="text-slate-200 text-sm font-medium tracking-wide">{label}</span>
      </div>
      <div className="mt-auto relative z-10">
        <div className="text-3xl font-bold tracking-tight text-white mb-2">{value}</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
          <span className="text-xs text-slate-500">Previous Week</span>
        </div>
      </div>
    </div>
  );
}
