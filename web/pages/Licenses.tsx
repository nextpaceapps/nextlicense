import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { License, Plan, Product, LicenseStatus } from '../types';
import { Plus, Search, MoreHorizontal, Monitor, RotateCcw, XCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Licenses: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState<License | null>(null);
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(false);

  const [issueForm, setIssueForm] = useState({ productId: '', planId: '', userEmail: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      const l = await api.licenses.getAll();
      const prod = await api.products.getAll();
      const p = await api.plans.getAll();
      setLicenses(l);
      setProducts(prod);
      setPlans(p);
    } catch (error) {
      console.error("Failed to load licenses data", error);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const newLicense = await api.licenses.add(issueForm);
        setCreatedLicense(newLicense);
        setIssueForm({ productId: '', planId: '', userEmail: '' });
        await loadData();
    } catch (e) {
        alert("Error issuing license");
    } finally {
        setLoading(false);
    }
  };

  const handleCloseIssueModal = () => {
    setIsModalOpen(false);
    setCreatedLicense(null);
    setIssueForm({ productId: '', planId: '', userEmail: '' });
  };

  const handleRenew = async (id: string) => {
    await api.licenses.renew(id);
    await loadData();
    // Refresh modal details
    const updated = await api.licenses.getAll();
    if(detailsModal) setDetailsModal(updated.find(l => l.id === id) || null);
  };

  const handleCancel = async (id: string) => {
    if(confirm('Are you sure you want to cancel this license? This cannot be undone.')) {
      await api.licenses.cancel(id);
      await loadData();
      const updated = await api.licenses.getAll();
      if(detailsModal) setDetailsModal(updated.find(l => l.id === id) || null);
    }
  };

  const filteredPlans = plans.filter(p => p.productId === issueForm.productId);

  const filteredLicenses = licenses.filter(l => 
    l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <button onClick={handleCopy} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900" title="Copy to clipboard">
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
             <input 
               className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary outline-none"
               placeholder="Search email or key..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Issue License
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key / Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued / Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Devices</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLicenses.map(license => {
              const product = products.find(p => p.id === license.productId);
              const plan = plans.find(p => p.id === license.planId);
              return (
                <tr key={license.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full
                      ${license.status === LicenseStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                        license.status === LicenseStatus.EXPIRED ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono font-medium text-gray-900">{license.key}</div>
                      <CopyButton text={license.key} />
                    </div>
                    <div className="text-xs text-gray-500">{product?.name} - {plan?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {license.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    <div>Iss: {new Date(license.issuedAt).toLocaleDateString()}</div>
                    <div>Exp: {new Date(license.expiresAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {license.activations.length} / {plan?.deviceLimit || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setDetailsModal(license)} className="text-primary hover:text-indigo-900">Details</button>
                  </td>
                </tr>
              );
            })}
             {filteredLicenses.length === 0 && (
               <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No licenses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h2 className="text-xl font-bold">License Details</h2>
               <button onClick={() => setDetailsModal(null)}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="p-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="p-3 bg-gray-50 rounded">
                    <span className="text-xs text-gray-500 block">License Key</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-800 break-all">{detailsModal.key}</span>
                        <CopyButton text={detailsModal.key} />
                    </div>
                 </div>
                 <div className="p-3 bg-gray-50 rounded">
                    <span className="text-xs text-gray-500 block">Plan</span>
                    <span className="font-semibold text-gray-800">
                        {products.find(p => p.id === detailsModal.productId)?.name} ({plans.find(p => p.id === detailsModal.planId)?.name})
                    </span>
                 </div>
               </div>
               
               <div className="mb-6">
                  <h3 className="font-bold text-gray-700 mb-2 flex items-center"><Monitor className="w-4 h-4 mr-2"/> Activations ({detailsModal.activations.length})</h3>
                  <div className="border rounded-lg overflow-hidden">
                     {detailsModal.activations.length === 0 ? <div className="p-3 text-sm text-gray-500">No devices activated yet.</div> :
                       detailsModal.activations.map((act, idx) => (
                         <div key={idx} className="p-3 border-b last:border-0 border-gray-100 flex justify-between text-sm">
                            <span className="font-mono">{act.deviceId}</span>
                            <span className="text-gray-500">Last seen: {new Date(act.lastUsedAt).toLocaleString()}</span>
                         </div>
                       ))
                     }
                  </div>
               </div>

               <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => handleRenew(detailsModal.id)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-100 flex items-center justify-center"
                  >
                     <RotateCcw className="w-4 h-4 mr-2"/> Renew Subscription
                  </button>
                  {detailsModal.status === LicenseStatus.ACTIVE && (
                    <button 
                        onClick={() => handleCancel(detailsModal.id)}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center"
                    >
                        <XCircle className="w-4 h-4 mr-2"/> Cancel License
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            {createdLicense ? (
              <div className="text-center space-y-4">
                 <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                 </div>
                 <h2 className="text-xl font-bold">License Created!</h2>
                 <p className="text-gray-500 text-sm">The license key has been generated successfully.</p>
                 
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase mb-1">License Key</p>
                    <div className="flex items-center justify-center gap-2">
                       <span className="font-mono font-bold text-lg text-gray-900">{createdLicense.key}</span>
                       <CopyButton text={createdLicense.key} />
                    </div>
                 </div>

                 <div className="flex justify-center pt-4">
                    <button onClick={handleCloseIssueModal} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                      Done
                    </button>
                 </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Issue New License</h2>
                <form onSubmit={handleIssue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <select required className="w-full border border-gray-300 rounded-lg p-2" 
                      value={issueForm.productId} onChange={e => setIssueForm({...issueForm, productId: e.target.value, planId: ''})}>
                      <option value="">Select Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                    <select required className="w-full border border-gray-300 rounded-lg p-2" 
                      value={issueForm.planId} onChange={e => setIssueForm({...issueForm, planId: e.target.value})} disabled={!issueForm.productId}>
                      <option value="">Select Plan...</option>
                      {filteredPlans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.durationDays} days)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                    <input type="email" required className="w-full border border-gray-300 rounded-lg p-2" 
                      value={issueForm.userEmail} onChange={e => setIssueForm({...issueForm, userEmail: e.target.value})} placeholder="user@company.com" />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={handleCloseIssueModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                        {loading ? 'Issuing...' : 'Issue Key'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
