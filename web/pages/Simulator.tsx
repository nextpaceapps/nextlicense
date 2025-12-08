import React, { useState } from 'react';
import { api } from '../services/api';
import { ValidationResponse } from '../types';
import { Play, Terminal, Wifi, Check, X } from 'lucide-react';

export const Simulator: React.FC = () => {
  const [key, setKey] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [response, setResponse] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay and call backend
    try {
        const result = await api.validate(key, deviceId);
        setResponse(result);
    } catch (e) {
        setResponse({ valid: false, message: "Network/Server Error" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">API Simulator</h1>
      <p className="text-gray-600">
        This tool simulates the client-side API call to <code className="bg-gray-200 px-1 rounded text-sm">POST /api/v1/validate</code>. 
        It now connects to live <strong>Firestore</strong> to validate keys and perform transactional device counting.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="bg-gray-100 p-2 rounded-lg mr-3">
              <Wifi className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-bold">Client Request</h2>
          </div>
          
          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Key</label>
              <input required className="w-full font-mono border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" 
                value={key} onChange={e => setKey(e.target.value)} placeholder="LIC-XXXXXX-XXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device ID (Hardware Fingerprint)</label>
              <input required className="w-full font-mono border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" 
                value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="e.g. mac-book-pro-user-1" />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white flex items-center justify-center transition-all
                ${loading ? 'bg-indigo-400' : 'bg-primary hover:bg-indigo-700'}`}
            >
              {loading ? 'Validating...' : <><Play className="w-4 h-4 mr-2" /> Send Request</>}
            </button>
          </form>
        </div>

        {/* Response Panel */}
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 flex flex-col text-gray-300 font-mono text-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-4">
             <div className="flex items-center">
                <Terminal className="w-5 h-5 mr-3 text-green-500" />
                <span className="font-bold text-white">Server Response</span>
             </div>
             {response && (
                <span className={`px-2 py-1 rounded text-xs font-bold ${response.valid ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                   {response.valid ? '200 OK' : '403 FORBIDDEN'}
                </span>
             )}
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {!response && !loading && (
               <div className="h-full flex items-center justify-center text-gray-600 italic">
                  Waiting for request...
               </div>
            )}
            {loading && (
               <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
               </div>
            )}
            {response && (
               <pre className="whitespace-pre-wrap text-green-400">
                  {JSON.stringify(response, null, 2)}
               </pre>
            )}
          </div>

          {response && (
            <div className={`mt-4 p-3 rounded border ${response.valid ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'} flex items-start`}>
               {response.valid ? <Check className="w-5 h-5 text-green-500 mr-2 shrink-0"/> : <X className="w-5 h-5 text-red-500 mr-2 shrink-0"/>}
               <p className={response.valid ? 'text-green-300' : 'text-red-300'}>
                  {response.message}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
