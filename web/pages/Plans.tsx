import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plan, Product } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Plans: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Plan>>({ 
    name: '', productId: '', durationDays: 30, deviceLimit: 1, features: [], price: 0 
  });
  const [featuresInput, setFeaturesInput] = useState('');

  const loadData = async () => {
    try {
      const p = await api.plans.getAll();
      const prod = await api.products.getAll();
      setPlans(p);
      setProducts(prod);
    } catch (error) {
      console.error('Failed to load plans data', error);
    }
  };
  
  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.name) return;
    setLoading(true);

    await api.plans.add({
      ...formData as Omit<Plan, 'id'>,
      features: featuresInput.split(',').map(f => f.trim()).filter(Boolean)
    });
    
    setIsModalOpen(false);
    setFeaturesInput('');
    setFormData({ name: '', productId: '', durationDays: 30, deviceLimit: 1, features: [], price: 0 });
    await loadData();
    setLoading(false);
  };

  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || 'Unknown Product';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">License Plans</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devices</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{getProductName(plan.productId)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{plan.durationDays} Days</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{plan.deviceLimit} Max</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map(f => (
                      <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={async () => { await api.plans.delete(plan.id); loadData(); }} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
               <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No plans created.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Plan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select required className="w-full border border-gray-300 rounded-lg p-2" 
                  value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input required className="w-full border border-gray-300 rounded-lg p-2" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Enterprise" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                  <input type="number" required className="w-full border border-gray-300 rounded-lg p-2" 
                    value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Devices</label>
                  <input type="number" required className="w-full border border-gray-300 rounded-lg p-2" 
                    value={formData.deviceLimit} onChange={e => setFormData({...formData, deviceLimit: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                <input className="w-full border border-gray-300 rounded-lg p-2" 
                  value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} placeholder="export, api, sso" />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                    {loading ? 'Saving...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
