import React, { useState } from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useMcpKeys, useCreateMcpKey, useRevokeMcpKey } from '../hooks/useMcpKeys';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Cpu, 
  Layers, 
  Terminal, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';

export const SettingsPage = () => {
  const { data: health } = useHealthCheck();
  const { data: keys, isLoading: keysLoading } = useMcpKeys();
  const createKeyMutation = useCreateMcpKey();
  const revokeKeyMutation = useRevokeMcpKey();

  const aiConfig = health?.aiConfig || health?.services?.aiProvider;
  const isAiConfigured = Boolean(aiConfig?.configured);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    try {
      const data = await createKeyMutation.mutateAsync(keyName || 'Claude Desktop');
      setCreatedKeyData(data);
      setKeyName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create API key');
    }
  };

  const handleCopyKey = () => {
    if (createdKeyData?.key) {
      navigator.clipboard.writeText(createdKeyData.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRevoke = async (id, name) => {
    if (window.confirm(`Revoke API key "${name}"? External AI clients using this key will immediately lose access.`)) {
      try {
        await revokeKeyMutation.mutateAsync(id);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to revoke key');
      }
    }
  };

  const sampleConfig = `{
  "mcpServers": {
    "studynest": {
      "command": "node",
      "args": [
        "${window.navigator.userAgent.includes('Windows') ? 'C:\\\\path\\\\to\\\\studyNest' : '/path/to/studyNest'}/mcp-server/src/index.js"
      ],
      "env": {
        "STUDYNEST_API_URL": "http://localhost:5000/api/mcp",
        "STUDYNEST_API_KEY": "${createdKeyData?.key || 'sn_live_YOUR_API_KEY'}"
      }
    }
  }
}`;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(sampleConfig);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System &amp; Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage AI providers, environment configurations, and Model Context Protocol (MCP) integrations.
        </p>
      </div>

      {/* Cloudflare AI Configuration Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Cloudflare Workers AI Provider</h3>
              <p className="text-xs text-slate-400">Serverless edge inference &amp; embedding models</p>
            </div>
          </div>
          <StatusBadge 
            status={isAiConfigured ? 'ok' : 'warning'} 
            text={isAiConfigured ? 'Connected' : 'Credentials Needed'} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Chat Generation</span>
            <span className="font-medium text-slate-800">
              Llama 3.2 3B Instruct
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Vector Embeddings</span>
            <span className="font-medium text-slate-800">
              BGE Base English (768-dim)
            </span>
          </div>
        </div>
      </div>

      {/* MCP Integration & API Keys Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Model Context Protocol (MCP) Keys</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Grant external AI tools (Claude Desktop, Cursor, Antigravity) secure read-only access to your notes
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCreatedKeyData(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Key</span>
          </button>
        </div>

        {/* Available MCP Tools Reference */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Exposed MCP Tools
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { name: 'list_notebooks', desc: 'Lists user notebooks' },
              { name: 'list_documents', desc: 'Lists documents inside notebook' },
              { name: 'search_notebook', desc: 'Semantic search via BGE embeddings' },
              { name: 'get_document_excerpt', desc: 'Reads specific page excerpt' },
              { name: 'get_notebook_summary', desc: 'Retrieves synthesized summary' },
            ].map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <code className="px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-slate-200 text-[11px] font-mono">
                  {tool.name}
                </code>
                <span className="text-slate-500 text-[11px] truncate">{tool.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Keys List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Active API Keys</h4>
          {keysLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading keys...</div>
          ) : keys && keys.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {keys.map((k) => (
                <div key={k.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{k.name}</span>
                      <code className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {k.prefix}
                      </code>
                      {k.revokedAt ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold">
                          Revoked
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span>{k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used'}</span>
                    </div>
                  </div>

                  {!k.revokedAt && (
                    <button
                      onClick={() => handleRevoke(k.id, k.name)}
                      disabled={revokeKeyMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No MCP API Keys generated yet. Create one to connect StudyNest to Claude Desktop or other AI clients.
            </div>
          )}
        </div>

        {/* Claude Desktop Config Snippet */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Claude Desktop Config (claude_desktop_config.json)</span>
            </span>
            <button
              onClick={handleCopyConfig}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedConfig ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto p-3 bg-black/40 rounded-xl">
            {sampleConfig}
          </pre>
        </div>
      </div>

      {/* Generate API Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Generate MCP API Key</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdKeyData ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Copy this API key now! For security reasons, the full plain text key will <strong>never</strong> be displayed again.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Your API Key
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <code className="text-xs font-mono font-medium text-slate-800 flex-1 break-all select-all">
                      {createdKeyData.key}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs shrink-0"
                      title="Copy Key"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Claude Desktop (Home MacBook)"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used to identify which external agent is accessing your workspace.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={createKeyMutation.isPending}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createKeyMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {createKeyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{createKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
