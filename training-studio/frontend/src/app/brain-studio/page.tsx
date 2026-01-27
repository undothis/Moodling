'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPhilosophy,
  updatePhilosophy,
  fetchTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  uploadTenants,
  checkCompliance,
  fetchViolations,
  fetchChannelInfluence,
  fetchBrainStatistics,
  fetchBrainInsights,
  updateInsightWeight,
  updateChannelWeight,
} from '@/lib/api';
import {
  Brain,
  FileText,
  Shield,
  Scale,
  PieChart,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import clsx from 'clsx';

type TabType = 'philosophy' | 'tenants' | 'compliance' | 'influence';

// ============================================================================
// PHILOSOPHY TAB
// ============================================================================

function PhilosophyTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [corePhilosophy, setCorePhilosophy] = useState('');

  const { data: philosophy, isLoading } = useQuery({
    queryKey: ['philosophy'],
    queryFn: fetchPhilosophy,
    onSuccess: (data) => {
      setProgramName(data.program_name || '');
      setProgramDescription(data.program_description || '');
      setCorePhilosophy(data.core_philosophy || '');
    },
  });

  const { mutate: savePhilosophy, isPending: isSaving } = useMutation({
    mutationFn: updatePhilosophy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['philosophy'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    savePhilosophy({
      program_name: programName,
      program_description: programDescription,
      core_philosophy: corePhilosophy,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Core Philosophy</h2>
          <p className="text-sm text-gray-500">
            Define what your program does and its core philosophy
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Program Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
              placeholder="e.g., Mood Leaf"
            />
          ) : (
            <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
              {philosophy?.program_name || 'Not set'}
            </p>
          )}
        </div>

        {/* Program Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program Description
          </label>
          <p className="text-xs text-gray-500 mb-2">
            What does your program do? This helps ensure training data aligns with your purpose.
          </p>
          {isEditing ? (
            <textarea
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
              placeholder="Describe what your program does..."
            />
          ) : (
            <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap min-h-[100px]">
              {philosophy?.program_description || 'Not set'}
            </div>
          )}
        </div>

        {/* Core Philosophy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Core Philosophy
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Your guiding principles and values. All training data will be checked against this.
          </p>
          {isEditing ? (
            <textarea
              value={corePhilosophy}
              onChange={(e) => setCorePhilosophy(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
              placeholder="Write your core philosophy..."
            />
          ) : (
            <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap min-h-[200px]">
              {philosophy?.core_philosophy || 'Not set'}
            </div>
          )}
        </div>
      </div>

      {philosophy?.updated_at && (
        <p className="text-xs text-gray-400">
          Last updated: {new Date(philosophy.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// TENANTS TAB
// ============================================================================

function TenantsTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState({ name: '', description: '', category: 'general' });
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '' });

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
  });

  const { mutate: addTenant, isPending: isAdding } = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowAddForm(false);
      setNewTenant({ name: '', description: '', category: 'general' });
    },
  });

  const { mutate: saveTenant, isPending: isSaving } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditingId(null);
    },
  });

  const { mutate: removeTenant } = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const { mutate: bulkUpload, isPending: isUploading } = useMutation({
    mutationFn: (tenants: any[]) => uploadTenants(tenants, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let tenants: any[] = [];

      if (file.name.endsWith('.json')) {
        tenants = JSON.parse(text);
      } else {
        // Parse as text file (one tenant per line)
        const lines = text.split('\n').filter(l => l.trim());
        tenants = lines.map((line, i) => ({
          name: `Tenant ${i + 1}`,
          description: line.trim(),
        }));
      }

      if (Array.isArray(tenants) && tenants.length > 0) {
        bulkUpload(tenants);
      }
    } catch (err) {
      console.error('Failed to parse file:', err);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEdit = (tenant: any) => {
    setEditingId(tenant.id);
    setEditForm({
      name: tenant.name,
      description: tenant.description,
      category: tenant.category,
    });
  };

  const categories = ['general', 'ethics', 'safety', 'tone', 'boundaries', 'approach'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Core Tenants</h2>
          <p className="text-sm text-gray-500">
            Principles that all training data must align with
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600"
          >
            <Plus className="w-4 h-4" />
            Add Tenant
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-leaf-50 border border-leaf-200 rounded-lg p-4 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTenant.name}
              onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
              placeholder="Tenant name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            />
            <select
              value={newTenant.category}
              onChange={(e) => setNewTenant({ ...newTenant, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newTenant.description}
            onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })}
            placeholder="Tenant description - what principle must be followed?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => addTenant(newTenant)}
              disabled={!newTenant.name || !newTenant.description || isAdding}
              className="px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Tenants List */}
      <div className="space-y-3">
        {tenantsData?.tenants.map((tenant, index) => (
          <div
            key={tenant.id}
            className={clsx(
              "bg-white border rounded-lg p-4",
              !tenant.is_active && "opacity-50"
            )}
          >
            {editingId === tenant.id ? (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveTenant({ id: tenant.id, data: editForm })}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-leaf-500 text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {tenant.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{tenant.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(tenant)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this tenant?')) {
                        removeTenant(tenant.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tenantsData?.tenants.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tenants defined yet</p>
            <p className="text-sm text-gray-400">Add tenants to check training data against</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPLIANCE TAB
// ============================================================================

function ComplianceTab() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['brain-stats'],
    queryFn: fetchBrainStatistics,
  });

  const { data: violations, isLoading: loadingViolations } = useQuery({
    queryKey: ['violations'],
    queryFn: fetchViolations,
    refetchInterval: 5000, // Refresh every 5 seconds while checking
  });

  const { mutate: runCheck, isPending: isChecking } = useMutation({
    mutationFn: checkCompliance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['brain-stats'] });
    },
  });

  const { mutate: updateWeight } = useMutation({
    mutationFn: ({ id, weight, active }: { id: string; weight: number; active: boolean }) =>
      updateInsightWeight(id, weight, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compliance Check</h2>
          <p className="text-sm text-gray-500">
            Compare all knowledge in the brain against core tenants
          </p>
        </div>
        <button
          onClick={() => runCheck()}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Scale className="w-4 h-4" />
              Compare Knowledge to Tenants
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Insights</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_insights || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Active Insights</p>
          <p className="text-2xl font-bold text-leaf-600">{stats?.active_insights || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Tenants</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_tenants || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Violations Found</p>
          <p className={clsx(
            "text-2xl font-bold",
            (stats?.total_violations || 0) > 0 ? "text-red-500" : "text-green-500"
          )}>
            {stats?.total_violations || 0}
          </p>
        </div>
      </div>

      {/* Violations List */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">
          Misaligned Insights ({violations?.total || 0})
        </h3>

        {loadingViolations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : violations?.violations.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium">All insights align with tenants!</p>
            <p className="text-sm text-green-600">No violations found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {violations?.violations.map((v) => (
              <div
                key={v.compliance_id}
                className="bg-white border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {v.insight_marker || v.insight_id.slice(0, 8)}
                      </code>
                      <span className="text-xs text-gray-500">{v.insight_category}</span>
                    </div>
                    <p className="text-gray-900 text-sm mb-2">{v.insight_text}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 font-medium">Violates:</span>
                      <span className="text-gray-700">{v.tenant_name}</span>
                    </div>
                    {v.violation_reason && (
                      <p className="text-sm text-gray-500 mt-1 italic">{v.violation_reason}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        Alignment: {v.alignment_score}%
                      </span>
                      <span className="text-xs text-gray-500">
                        Weight: {v.influence_weight}x
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => updateWeight({ id: v.insight_id, weight: 0.1, active: true })}
                      className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      Lower Weight
                    </button>
                    <button
                      onClick={() => updateWeight({ id: v.insight_id, weight: v.influence_weight, active: false })}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INFLUENCE TAB
// ============================================================================

function InfluenceTab() {
  const queryClient = useQueryClient();
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const { data: influence, isLoading } = useQuery({
    queryKey: ['channel-influence'],
    queryFn: fetchChannelInfluence,
  });

  const { data: stats } = useQuery({
    queryKey: ['brain-stats'],
    queryFn: fetchBrainStatistics,
  });

  const { mutate: updateWeight } = useMutation({
    mutationFn: ({ channelId, weight }: { channelId: string; weight: number }) =>
      updateChannelWeight(channelId, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-influence'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Channel Influence</h2>
        <p className="text-sm text-gray-500">
          See how each channel influences the brain and adjust weights
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Weighted Influence</p>
          <p className="text-2xl font-bold text-gray-900">
            {influence?.total_weighted_influence?.toFixed(1) || 0}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Active Channels</p>
          <p className="text-2xl font-bold text-leaf-600">
            {influence?.channels?.length || 0}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Average Weight</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.average_weight || 1.0}x
          </p>
        </div>
      </div>

      {/* Channel List */}
      <div className="space-y-3">
        {influence?.channels?.map((channel) => (
          <div key={channel.channel_id} className="bg-white border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedChannel(
                expandedChannel === channel.channel_id ? null : channel.channel_id
              )}
            >
              <div className="flex items-center gap-4">
                {expandedChannel === channel.channel_id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{channel.channel_name}</h3>
                  <p className="text-sm text-gray-500">
                    {channel.approved_insights} insights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {/* Influence Bar */}
                <div className="w-48">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Influence</span>
                    <span className="font-medium">{channel.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-leaf-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, channel.percentage)}%` }}
                    />
                  </div>
                </div>
                {/* Weight Control */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Weight:</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={channel.influence_weight}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      updateWeight({
                        channelId: channel.channel_id,
                        weight: parseFloat(e.target.value),
                      });
                    }}
                    className="w-20"
                  />
                  <span className="text-sm font-medium w-10">
                    {channel.influence_weight}x
                  </span>
                </div>
                {/* Include Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle include in training
                  }}
                  className={clsx(
                    "p-1 rounded",
                    channel.include_in_training ? "text-leaf-600" : "text-gray-400"
                  )}
                >
                  {channel.include_in_training ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedChannel === channel.channel_id && (
              <div className="border-t bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(channel.category_distribution || {}).map(([cat, count]) => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-white border rounded text-xs"
                    >
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {(!influence?.channels || influence.channels.length === 0) && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No channels with approved insights yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BrainStudioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('philosophy');

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'philosophy', label: 'Philosophy', icon: FileText },
    { id: 'tenants', label: 'Tenants', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: Scale },
    { id: 'influence', label: 'Influence', icon: PieChart },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Brain Studio</h1>
        </div>
        <p className="text-gray-500">
          Monitor and tune the LLM brain - manage philosophy, tenants, and influence weights
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {activeTab === 'philosophy' && <PhilosophyTab />}
        {activeTab === 'tenants' && <TenantsTab />}
        {activeTab === 'compliance' && <ComplianceTab />}
        {activeTab === 'influence' && <InfluenceTab />}
      </div>
    </div>
  );
}
