import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LogEvent } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    total: 0,
    products: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
        try {
            const allLicenses = await api.licenses.getAll();
            const allLogs = await api.logs.getAll();
            const allProducts = await api.products.getAll();
            
            setLogs(allLogs.slice(0, 5));
            setStats({
            active: allLicenses.filter(l => l.status === 'ACTIVE').length,
            expired: allLicenses.filter(l => l.status !== 'ACTIVE').length,
            total: allLicenses.length,
            products: allProducts.length
            });

            const data = allProducts.map(p => ({
            name: p.name,
            count: allLicenses.filter(l => l.productId === p.id).length
            }));
            setChartData(data);
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [authLoading, user]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
      <div className={`p-4 rounded-full mr-4 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard data from Firestore...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Licenses" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Licenses" value={stats.active} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Expired/Cancelled" value={stats.expired} icon={AlertCircle} color="bg-red-500" />
        <StatCard title="Products" value={stats.products} icon={Activity} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Licenses Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 mt-2 rounded-full mr-3 shrink-0 
                    ${log.type === 'ERROR' || log.type === 'EXPIRE' ? 'bg-red-500' : 
                      log.type === 'ISSUE' ? 'bg-green-500' : 'bg-blue-500'}`} 
                  />
                  <div>
                    <p className="text-sm text-gray-800">{log.details}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
