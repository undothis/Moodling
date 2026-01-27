'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
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
  fetchBrainGoals,
  createBrainGoal,
  updateBrainGoal,
  deleteBrainGoal,
  fetchBrainComparison,
  fetchBrainCategories,
  testPromptInLab,
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
  Target,
  Beaker,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Download,
  ExternalLink,
  Lightbulb,
  Video,
} from 'lucide-react';
import clsx from 'clsx';

type TabType = 'philosophy' | 'tenants' | 'compliance' | 'influence' | 'goals' | 'visualization' | 'prompt-lab';

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
  });

  // Update form when data loads
  useState(() => {
    if (philosophy) {
      setProgramName(philosophy.program_name || '');
      setProgramDescription(philosophy.program_description || '');
      setCorePhilosophy(philosophy.core_philosophy || '');
    }
  });

  const { mutate: savePhilosophy, isPending: isSaving } = useMutation({
    mutationFn: updatePhilosophy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['philosophy'] });
      setIsEditing(false);
    },
  });

  const handleEdit = () => {
    setProgramName(philosophy?.program_name || '');
    setProgramDescription(philosophy?.program_description || '');
    setCorePhilosophy(philosophy?.core_philosophy || '');
    setIsEditing(true);
  };

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
            onClick={handleEdit}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Program Name</label>
          {isEditing ? (
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            />
          ) : (
            <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
              {philosophy?.program_name || 'Not set'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Program Description</label>
          {isEditing ? (
            <textarea
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            />
          ) : (
            <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap min-h-[100px]">
              {philosophy?.program_description || 'Not set'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Core Philosophy</label>
          {isEditing ? (
            <textarea
              value={corePhilosophy}
              onChange={(e) => setCorePhilosophy(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
            />
          ) : (
            <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap min-h-[200px]">
              {philosophy?.core_philosophy || 'Not set'}
            </div>
          )}
        </div>
      </div>
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const { mutate: bulkUpload } = useMutation({
    mutationFn: (tenants: any[]) => uploadTenants(tenants, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
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
        const lines = text.split('\n').filter(l => l.trim());
        tenants = lines.map((line, i) => ({ name: `Tenant ${i + 1}`, description: line.trim() }));
      }
      if (tenants.length > 0) bulkUpload(tenants);
    } catch (err) {
      console.error('Failed to parse file:', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categories = ['general', 'ethics', 'safety', 'tone', 'boundaries', 'approach'];

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Core Tenants</h2>
          <p className="text-sm text-gray-500">Principles that all training data must align with</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".txt,.json" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Upload className="w-4 h-4" />Upload
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600">
            <Plus className="w-4 h-4" />Add Tenant
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-leaf-50 border border-leaf-200 rounded-lg p-4 space-y-4">
          <div className="flex gap-4">
            <input type="text" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="Tenant name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
            <select value={newTenant.category} onChange={(e) => setNewTenant({ ...newTenant, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea value={newTenant.description} onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })} placeholder="Tenant description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={() => addTenant(newTenant)} disabled={!newTenant.name || !newTenant.description || isAdding} className="px-4 py-2 bg-leaf-500 text-white rounded-lg disabled:opacity-50">
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tenantsData?.tenants.map((tenant, index) => (
          <div key={tenant.id} className={clsx("bg-white border rounded-lg p-4", !tenant.is_active && "opacity-50")}>
            {editingId === tenant.id ? (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-600">Cancel</button>
                  <button onClick={() => saveTenant({ id: tenant.id, data: editForm })} disabled={isSaving} className="px-3 py-1.5 bg-leaf-500 text-white rounded-lg">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{tenant.category}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{tenant.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingId(tenant.id); setEditForm({ name: tenant.name, description: tenant.description, category: tenant.category }); }} className="p-2 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete?')) removeTenant(tenant.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tenantsData?.tenants.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tenants defined yet</p>
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

  const { data: stats } = useQuery({ queryKey: ['brain-stats'], queryFn: fetchBrainStatistics });
  const { data: violations, isLoading: loadingViolations } = useQuery({
    queryKey: ['violations'],
    queryFn: fetchViolations,
    refetchInterval: 5000,
  });

  const { mutate: runCheck, isPending: isChecking } = useMutation({
    mutationFn: checkCompliance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['brain-stats'] });
    },
  });

  const { mutate: updateWeight } = useMutation({
    mutationFn: ({ id, weight, active }: { id: string; weight: number; active: boolean }) => updateInsightWeight(id, weight, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compliance Check</h2>
          <p className="text-sm text-gray-500">Compare all knowledge against core tenants</p>
        </div>
        <button onClick={() => runCheck()} disabled={isChecking} className="flex items-center gap-2 px-4 py-2 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50">
          {isChecking ? <><Loader2 className="w-4 h-4 animate-spin" />Checking...</> : <><Scale className="w-4 h-4" />Compare Knowledge to Tenants</>}
        </button>
      </div>

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
          <p className={clsx("text-2xl font-bold", (stats?.total_violations || 0) > 0 ? "text-red-500" : "text-green-500")}>{stats?.total_violations || 0}</p>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Misaligned Insights ({violations?.total || 0})</h3>
        {loadingViolations ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : violations?.violations.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium">All insights align with tenants!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {violations?.violations.map((v) => (
              <div key={v.compliance_id} className="bg-white border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{v.insight_marker || v.insight_id.slice(0, 8)}</code>
                    </div>
                    <p className="text-gray-900 text-sm mb-2">{v.insight_text}</p>
                    <div className="text-sm"><span className="text-red-600 font-medium">Violates:</span> {v.tenant_name}</div>
                    {v.violation_reason && <p className="text-sm text-gray-500 mt-1 italic">{v.violation_reason}</p>}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => updateWeight({ id: v.insight_id, weight: 0.1, active: true })} className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Lower Weight</button>
                    <button onClick={() => updateWeight({ id: v.insight_id, weight: v.influence_weight, active: false })} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Deactivate</button>
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

  const { data: influence, isLoading } = useQuery({ queryKey: ['channel-influence'], queryFn: fetchChannelInfluence });

  const { mutate: updateWeight } = useMutation({
    mutationFn: ({ channelId, weight }: { channelId: string; weight: number }) => updateChannelWeight(channelId, weight),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-influence'] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Channel Influence</h2>
        <p className="text-sm text-gray-500">See how each channel influences the brain</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Weighted Influence</p>
          <p className="text-2xl font-bold text-gray-900">{influence?.total_weighted_influence?.toFixed(1) || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Active Channels</p>
          <p className="text-2xl font-bold text-leaf-600">{influence?.channels?.length || 0}</p>
        </div>
      </div>

      <div className="space-y-3">
        {influence?.channels?.map((channel) => (
          <div key={channel.channel_id} className="bg-white border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedChannel(expandedChannel === channel.channel_id ? null : channel.channel_id)}>
              <div className="flex items-center gap-4">
                {expandedChannel === channel.channel_id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                <div>
                  <h3 className="font-medium text-gray-900">{channel.channel_name}</h3>
                  <p className="text-sm text-gray-500">{channel.approved_insights} insights</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-48">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Influence</span><span className="font-medium">{channel.percentage}%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-leaf-500 h-2 rounded-full" style={{ width: `${Math.min(100, channel.percentage)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Weight:</span>
                  <input type="range" min="0" max="2" step="0.1" value={channel.influence_weight} onClick={(e) => e.stopPropagation()} onChange={(e) => updateWeight({ channelId: channel.channel_id, weight: parseFloat(e.target.value) })} className="w-20" />
                  <span className="text-sm font-medium w-10">{channel.influence_weight}x</span>
                </div>
              </div>
            </div>
            {expandedChannel === channel.channel_id && (
              <div className="border-t bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(channel.category_distribution || {}).map(([cat, count]) => (
                    <span key={cat} className="px-2 py-1 bg-white border rounded text-xs">{cat}: {count}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// GOALS TAB - Brain Comparison Visualization
// ============================================================================

function GoalsTab() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ category: '', target_percentage: 10, priority: 2, description: '', recommended_sources: '' });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalData, setEditGoalData] = useState({ target_percentage: 10, priority: 2, description: '', recommended_sources: '' });

  const { data: comparison, isLoading } = useQuery({ queryKey: ['brain-comparison'], queryFn: fetchBrainComparison });
  const { data: goalsData } = useQuery({ queryKey: ['brain-goals'], queryFn: fetchBrainGoals });
  const { data: categories } = useQuery({ queryKey: ['brain-categories'], queryFn: fetchBrainCategories });

  const { mutate: addGoal, isPending: isAdding } = useMutation({
    mutationFn: createBrainGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brain-goals'] });
      queryClient.invalidateQueries({ queryKey: ['brain-comparison'] });
      setShowAddForm(false);
      setNewGoal({ category: '', target_percentage: 10, priority: 2, description: '', recommended_sources: '' });
    },
  });

  const { mutate: editGoal, isPending: isEditing } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBrainGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brain-goals'] });
      queryClient.invalidateQueries({ queryKey: ['brain-comparison'] });
      setEditingGoalId(null);
    },
  });

  const { mutate: removeGoal } = useMutation({
    mutationFn: deleteBrainGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brain-goals'] });
      queryClient.invalidateQueries({ queryKey: ['brain-comparison'] });
    },
  });

  const startEditing = (goal: any) => {
    setEditingGoalId(goal.id);
    setEditGoalData({
      target_percentage: goal.target_percentage,
      priority: goal.priority || 2,
      description: goal.description || '',
      recommended_sources: goal.recommended_sources || '',
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  const allCategories = [...new Set([
    ...Object.keys(comparison?.current_state || {}),
    ...Object.keys(comparison?.goal_state || {})
  ])].sort();

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold opacity-90">Brain Health Score</h2>
            <p className="text-sm opacity-75">How close are you to your training goals?</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{comparison?.health_score || 0}%</p>
            <p className="text-sm opacity-75">{comparison?.total_insights || 0} total insights</p>
          </div>
        </div>
      </div>

      {/* Brain Comparison - Two Columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Current Brain */}
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Current Brain</h3>
          </div>
          <div className="space-y-3">
            {allCategories.map((cat) => {
              const current = comparison?.current_state[cat] || 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 truncate">{cat}</span>
                    <span className="font-medium text-gray-900">{current}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, current)}%` }} />
                  </div>
                </div>
              );
            })}
            {allCategories.length === 0 && <p className="text-gray-500 text-sm">No training data yet</p>}
          </div>
        </div>

        {/* Goal Brain */}
        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Goal Brain</h3>
            </div>
            <button onClick={() => setShowAddForm(true)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
              <Plus className="w-3 h-3 inline" /> Add Goal
            </button>
          </div>
          <div className="space-y-3">
            {allCategories.map((cat) => {
              const target = comparison?.goal_state[cat] || 0;
              const current = comparison?.current_state[cat] || 0;
              const hasGoal = target > 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={clsx("truncate", hasGoal ? "text-gray-600" : "text-gray-400")}>{cat}</span>
                    <span className={clsx("font-medium", hasGoal ? "text-gray-900" : "text-gray-400")}>{target}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 relative">
                    <div className={clsx("h-3 rounded-full transition-all", hasGoal ? "bg-green-500" : "bg-gray-300")} style={{ width: `${Math.min(100, target)}%` }} />
                    {/* Current position marker */}
                    {hasGoal && current > 0 && (
                      <div className="absolute top-0 h-3 w-0.5 bg-blue-600" style={{ left: `${Math.min(100, current)}%` }} title={`Current: ${current}%`} />
                    )}
                  </div>
                </div>
              );
            })}
            {allCategories.length === 0 && <p className="text-gray-500 text-sm">Add goals to define your target</p>}
          </div>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">Add Training Goal</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <select value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select or type...</option>
                {categories?.categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
              </select>
              <input type="text" value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })} placeholder="Or type custom category" className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Target %</label>
              <input type="number" min="1" max="100" value={newGoal.target_percentage} onChange={(e) => setNewGoal({ ...newGoal, target_percentage: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Priority</label>
            <select value={newGoal.priority} onChange={(e) => setNewGoal({ ...newGoal, priority: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value={1}>High - Must have</option>
              <option value={2}>Medium - Important</option>
              <option value={3}>Low - Nice to have</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Recommended Sources</label>
            <input type="text" value={newGoal.recommended_sources} onChange={(e) => setNewGoal({ ...newGoal, recommended_sources: e.target.value })} placeholder="e.g., Therapy channels, Interview podcasts" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={() => addGoal(newGoal)} disabled={!newGoal.category || isAdding} className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50">
              {isAdding ? 'Adding...' : 'Add Goal'}
            </button>
          </div>
        </div>
      )}

      {/* Gaps / Recommendations with Smart Suggestions */}
      {comparison?.gaps && comparison.gaps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Training Gaps - What You Need More Of</h3>
            </div>
            <Link href="/channels" className="text-xs px-3 py-1.5 bg-yellow-200 text-yellow-800 rounded-lg hover:bg-yellow-300 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Find Channels
            </Link>
          </div>

          {/* Smart Suggestion Summary */}
          {comparison.total_insights > 0 && (
            <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">Smart Suggestion</p>
                  <p className="text-xs text-gray-500 mt-1">
                    You have {comparison.total_insights} insights. To fill all gaps, process approximately{' '}
                    <span className="font-semibold text-yellow-700">
                      {Math.ceil(comparison.gaps.reduce((sum, g) => sum + (comparison.total_insights * g.gap / 100 / 4), 0))} videos
                    </span>{' '}
                    (~4 insights per video average).
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {comparison.gaps.slice(0, 5).map((gap) => {
              // Calculate suggested videos: (total_insights * gap%) / (100 * avg_insights_per_video)
              const videosNeeded = comparison.total_insights > 0
                ? Math.ceil((comparison.total_insights * gap.gap) / 100 / 4)
                : Math.ceil(gap.gap / 5); // Default to gap/5 if no insights yet
              return (
                <div key={gap.category} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={clsx("w-2 h-2 rounded-full", gap.priority === 1 ? "bg-red-500" : gap.priority === 2 ? "bg-yellow-500" : "bg-gray-400")} />
                        <span className="font-medium text-gray-900">{gap.category}</span>
                      </div>
                      {gap.recommended_sources && <p className="text-xs text-gray-500 mt-1">{gap.recommended_sources}</p>}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{gap.current}%</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-green-600">{gap.target}%</span>
                      </div>
                      <span className="text-xs text-yellow-600">Need +{gap.gap}%</span>
                    </div>
                  </div>
                  {/* Video Suggestion Row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Video className="w-3 h-3" />
                      <span>Process ~{videosNeeded} {videosNeeded === 1 ? 'video' : 'videos'} to fill gap</span>
                    </div>
                    <Link
                      href={`/batch?category=${encodeURIComponent(gap.category)}`}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Batch Process
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {comparison.gaps.length > 5 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              + {comparison.gaps.length - 5} more gaps • Total videos needed: ~{Math.ceil(comparison.gaps.reduce((sum, g) => sum + (comparison.total_insights > 0 ? (comparison.total_insights * g.gap / 100 / 4) : g.gap / 5), 0))}
            </p>
          )}
        </div>
      )}

      {/* Goal List */}
      {goalsData?.goals && goalsData.goals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">All Goals ({goalsData.goals.length})</h3>
            <button onClick={() => setShowAddForm(true)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Goal
            </button>
          </div>
          <div className="space-y-3">
            {goalsData.goals.map((goal) => (
              <div key={goal.id} className="bg-white border rounded-lg p-4">
                {editingGoalId === goal.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{goal.category}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editGoal({ id: goal.id, data: editGoalData })}
                          disabled={isEditing}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingGoalId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Target %</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editGoalData.target_percentage}
                          onChange={(e) => setEditGoalData({ ...editGoalData, target_percentage: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Priority</label>
                        <select
                          value={editGoalData.priority}
                          onChange={(e) => setEditGoalData({ ...editGoalData, priority: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value={1}>High</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Low</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Recommended Sources</label>
                      <input
                        type="text"
                        value={editGoalData.recommended_sources}
                        onChange={(e) => setEditGoalData({ ...editGoalData, recommended_sources: e.target.value })}
                        placeholder="e.g., Therapy channels, Interview podcasts"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "w-2 h-2 rounded-full",
                          goal.priority === 1 ? "bg-red-500" : goal.priority === 2 ? "bg-yellow-500" : "bg-gray-400"
                        )} />
                        <span className="font-medium text-gray-900">{goal.category}</span>
                        <span className="text-sm text-green-600 font-medium">{goal.target_percentage}%</span>
                      </div>
                      {goal.recommended_sources && (
                        <p className="text-xs text-gray-500 mt-1 ml-4">{goal.recommended_sources}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEditing(goal)} className="text-gray-400 hover:text-blue-500">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeGoal(goal.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - No Goals */}
      {(!goalsData?.goals || goalsData.goals.length === 0) && !showAddForm && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-2">No Training Goals Set</h3>
          <p className="text-sm text-gray-500 mb-4">
            Define target percentages for each category to guide your training data collection.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Plus className="w-4 h-4" />
            Add Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BRAIN VISUALIZATION TAB - Two Brains Showing Goal vs Current State
// ============================================================================

// Brain region mappings to insight categories
const BRAIN_REGIONS = {
  prefrontal: {
    name: 'Prefrontal Cortex',
    description: 'Decision making, planning, self-control',
    categories: ['decision_making', 'cognitive_patterns', 'self_discovery', 'values_beliefs'],
    color: '#8B5CF6', // purple
    position: { x: 50, y: 15 },
  },
  temporal: {
    name: 'Temporal Lobe',
    description: 'Communication, language, social understanding',
    categories: ['communication_patterns', 'friendship_dynamics', 'belonging_community', 'companionship'],
    color: '#3B82F6', // blue
    position: { x: 20, y: 45 },
  },
  limbic: {
    name: 'Limbic System',
    description: 'Emotional regulation, joy, motivation',
    categories: ['joy_celebration', 'excitement_passion', 'gratitude_appreciation', 'hope_optimism', 'emotional_evolution'],
    color: '#10B981', // green
    position: { x: 50, y: 50 },
  },
  amygdala: {
    name: 'Amygdala',
    description: 'Fear, anxiety, emotional memories',
    categories: ['fear_anxiety', 'emotional_struggles', 'trauma_recovery', 'anger_frustration', 'depression_hopelessness'],
    color: '#EF4444', // red
    position: { x: 55, y: 60 },
  },
  hippocampus: {
    name: 'Hippocampus',
    description: 'Memory, learning, growth',
    categories: ['growth_moments', 'life_lessons', 'wisdom_perspective', 'memory_echoes', 'integration_moments'],
    color: '#F59E0B', // amber
    position: { x: 45, y: 60 },
  },
  parietal: {
    name: 'Parietal Lobe',
    description: 'Self-awareness, body perception',
    categories: ['embodied_emotion', 'somatic_markers', 'body_health', 'rest_burnout'],
    color: '#EC4899', // pink
    position: { x: 50, y: 30 },
  },
  occipital: {
    name: 'Occipital Lobe',
    description: 'Perception, insight, creativity',
    categories: ['creativity_expression', 'awe_wonder', 'spirituality_faith', 'meaning_purpose'],
    color: '#6366F1', // indigo
    position: { x: 75, y: 45 },
  },
  brainstem: {
    name: 'Brainstem',
    description: 'Core survival, basic needs',
    categories: ['coping_strategies', 'what_helps_hurts', 'vulnerability', 'boundaries'],
    color: '#14B8A6', // teal
    position: { x: 50, y: 80 },
  },
};

// SVG Brain Component
function BrainSVG({
  regionFills,
  title,
  isGoal = false,
}: {
  regionFills: Record<string, { fill: string; opacity: number; hasAlert?: boolean }>;
  title: string;
  isGoal?: boolean;
}) {
  return (
    <div className="relative">
      <h3 className={clsx(
        "text-center font-semibold mb-2",
        isGoal ? "text-green-600" : "text-blue-600"
      )}>
        {title}
      </h3>
      <svg viewBox="0 0 100 100" className="w-full h-auto max-w-xs mx-auto">
        {/* Brain outline - simplified side view */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Brain base shape */}
        <path
          d="M15,50 C15,25 30,10 50,10 C70,10 85,25 85,45 C85,55 80,65 75,70 C70,75 60,85 50,85 C40,85 30,80 25,70 C20,60 15,55 15,50 Z"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="1"
        />

        {/* Prefrontal Cortex - front top */}
        <ellipse
          cx={BRAIN_REGIONS.prefrontal.position.x}
          cy={BRAIN_REGIONS.prefrontal.position.y}
          rx="18"
          ry="10"
          fill={regionFills.prefrontal?.fill || BRAIN_REGIONS.prefrontal.color}
          opacity={regionFills.prefrontal?.opacity || 0.3}
          stroke={regionFills.prefrontal?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.prefrontal?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Parietal Lobe - top middle */}
        <ellipse
          cx={BRAIN_REGIONS.parietal.position.x}
          cy={BRAIN_REGIONS.parietal.position.y}
          rx="15"
          ry="10"
          fill={regionFills.parietal?.fill || BRAIN_REGIONS.parietal.color}
          opacity={regionFills.parietal?.opacity || 0.3}
          stroke={regionFills.parietal?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.parietal?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Temporal Lobe - side */}
        <ellipse
          cx={BRAIN_REGIONS.temporal.position.x}
          cy={BRAIN_REGIONS.temporal.position.y}
          rx="12"
          ry="15"
          fill={regionFills.temporal?.fill || BRAIN_REGIONS.temporal.color}
          opacity={regionFills.temporal?.opacity || 0.3}
          stroke={regionFills.temporal?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.temporal?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Occipital Lobe - back */}
        <ellipse
          cx={BRAIN_REGIONS.occipital.position.x}
          cy={BRAIN_REGIONS.occipital.position.y}
          rx="12"
          ry="15"
          fill={regionFills.occipital?.fill || BRAIN_REGIONS.occipital.color}
          opacity={regionFills.occipital?.opacity || 0.3}
          stroke={regionFills.occipital?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.occipital?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Limbic System - center */}
        <ellipse
          cx={BRAIN_REGIONS.limbic.position.x}
          cy={BRAIN_REGIONS.limbic.position.y}
          rx="12"
          ry="8"
          fill={regionFills.limbic?.fill || BRAIN_REGIONS.limbic.color}
          opacity={regionFills.limbic?.opacity || 0.3}
          stroke={regionFills.limbic?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.limbic?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Hippocampus - inner */}
        <ellipse
          cx={BRAIN_REGIONS.hippocampus.position.x}
          cy={BRAIN_REGIONS.hippocampus.position.y}
          rx="8"
          ry="5"
          fill={regionFills.hippocampus?.fill || BRAIN_REGIONS.hippocampus.color}
          opacity={regionFills.hippocampus?.opacity || 0.3}
          stroke={regionFills.hippocampus?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.hippocampus?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Amygdala - inner */}
        <ellipse
          cx={BRAIN_REGIONS.amygdala.position.x}
          cy={BRAIN_REGIONS.amygdala.position.y}
          rx="6"
          ry="5"
          fill={regionFills.amygdala?.fill || BRAIN_REGIONS.amygdala.color}
          opacity={regionFills.amygdala?.opacity || 0.3}
          stroke={regionFills.amygdala?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.amygdala?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Brainstem - bottom */}
        <ellipse
          cx={BRAIN_REGIONS.brainstem.position.x}
          cy={BRAIN_REGIONS.brainstem.position.y}
          rx="8"
          ry="10"
          fill={regionFills.brainstem?.fill || BRAIN_REGIONS.brainstem.color}
          opacity={regionFills.brainstem?.opacity || 0.3}
          stroke={regionFills.brainstem?.hasAlert ? '#ef4444' : 'none'}
          strokeWidth="2"
          filter={regionFills.brainstem?.hasAlert ? 'url(#glow)' : 'none'}
        />

        {/* Alert indicators (red dots for misalignment) */}
        {Object.entries(regionFills).map(([region, data]) => {
          if (!data.hasAlert) return null;
          const pos = BRAIN_REGIONS[region as keyof typeof BRAIN_REGIONS]?.position;
          if (!pos) return null;
          return (
            <g key={region}>
              <circle
                cx={pos.x + 5}
                cy={pos.y - 5}
                r="4"
                fill="#ef4444"
                className="animate-pulse"
              />
              <circle
                cx={pos.x + 5}
                cy={pos.y - 5}
                r="2"
                fill="#fff"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Default target percentages for each brain region (used when no goals are set)
const DEFAULT_REGION_TARGETS: Record<string, number> = {
  prefrontal: 8,    // decision making, cognitive patterns
  temporal: 10,     // communication, relationships
  limbic: 8,        // joy, emotional regulation
  amygdala: 15,     // emotional struggles, fear, anxiety
  hippocampus: 12,  // growth, wisdom, learning
  parietal: 5,      // body awareness, somatic
  occipital: 7,     // creativity, spirituality, meaning
  brainstem: 12,    // coping, vulnerability, boundaries
};

function BrainVisualizationTab() {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['brain-comparison'],
    queryFn: fetchBrainComparison
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const totalInsights = comparison?.total_insights || 0;
  const hasNoData = totalInsights === 0;

  // Calculate region fills based on current data
  const calculateRegionState = (regionKey: string, categories: string[], currentState: Record<string, number>, goalState: Record<string, number>) => {
    let totalCurrent = 0;
    let totalGoal = 0;
    let currentCount = 0;
    let goalCount = 0;

    categories.forEach(cat => {
      // Check all possible variations of category name
      const catVariants = [cat, cat.replace(/_/g, '-'), cat.replace(/-/g, '_')];
      for (const variant of catVariants) {
        if (currentState[variant] !== undefined) {
          totalCurrent += currentState[variant];
          currentCount++;
          break;
        }
      }
      for (const variant of catVariants) {
        if (goalState[variant] !== undefined) {
          totalGoal += goalState[variant];
          goalCount++;
          break;
        }
      }
    });

    const avgCurrent = currentCount > 0 ? totalCurrent / currentCount : 0;
    // Use default targets if no goals are set for this region
    const avgGoal = goalCount > 0 ? totalGoal / goalCount : DEFAULT_REGION_TARGETS[regionKey] || 10;

    return { current: avgCurrent, goal: avgGoal, currentCount, goalCount };
  };

  // Generate fills for current brain
  const currentBrainFills: Record<string, { fill: string; opacity: number; hasAlert?: boolean }> = {};
  // Generate fills for goal brain
  const goalBrainFills: Record<string, { fill: string; opacity: number; hasAlert?: boolean }> = {};

  // Track all regions with their stats for legend
  const regionStats: Record<string, { current: number; goal: number; gap: number }> = {};

  const misalignments: { region: string; name: string; current: number; goal: number; gap: number; description: string }[] = [];

  Object.entries(BRAIN_REGIONS).forEach(([regionKey, region]) => {
    const state = calculateRegionState(
      regionKey,
      region.categories,
      comparison?.current_state || {},
      comparison?.goal_state || {}
    );

    // Store stats for legend
    const gap = state.goal - state.current;
    regionStats[regionKey] = {
      current: Math.round(state.current * 10) / 10,
      goal: Math.round(state.goal * 10) / 10,
      gap: Math.round(gap * 10) / 10,
    };

    // Current brain - intensity based on how much data we have
    const currentIntensity = Math.min(1, state.current / 30); // 30% = full intensity
    currentBrainFills[regionKey] = {
      fill: region.color,
      opacity: hasNoData ? 0.15 : 0.2 + (currentIntensity * 0.6),
    };

    // Goal brain - full intensity based on goal
    const goalIntensity = Math.min(1, state.goal / 30);
    goalBrainFills[regionKey] = {
      fill: region.color,
      opacity: 0.2 + (goalIntensity * 0.6),
    };

    // Check for misalignment:
    // - If no data at all: ALL regions with goals need attention
    // - If some data: regions with gap > 3% need attention
    const needsAttention = hasNoData ? state.goal > 0 : gap > 3;

    if (needsAttention && state.goal > 0) {
      currentBrainFills[regionKey].hasAlert = true;
      misalignments.push({
        region: regionKey,
        name: region.name,
        current: Math.round(state.current * 10) / 10,
        goal: Math.round(state.goal * 10) / 10,
        gap: Math.round(gap * 10) / 10,
        description: region.description,
      });
    }
  });

  // Sort misalignments by gap (largest first)
  misalignments.sort((a, b) => b.gap - a.gap);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={clsx(
        "rounded-xl p-6 text-white",
        hasNoData
          ? "bg-gradient-to-r from-orange-500 to-red-500"
          : "bg-gradient-to-r from-purple-500 to-indigo-600"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold opacity-90">Brain Alignment Visualization</h2>
            <p className="text-sm opacity-75">
              {hasNoData
                ? "No training data yet - process videos to build your brain!"
                : "Compare your current training state to your ideal goal state"
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{hasNoData ? "0%" : `${comparison?.health_score || 0}%`}</p>
            <p className="text-sm opacity-75">{hasNoData ? "Get Started!" : "Brain Health"}</p>
          </div>
        </div>
      </div>

      {/* Get Started Alert - when no data */}
      {hasNoData && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">Your Brain is Empty!</h3>
              <p className="text-gray-600 mt-1">
                You haven&apos;t processed any videos yet. Go to the <strong>Channels</strong> page to add YouTube channels
                and process videos. The insights extracted will fill in your brain regions.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="/channels"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Channels & Process Videos
                </a>
                <a
                  href="/channels"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Recommended Channels
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Brains Side by Side */}
      <div className="grid grid-cols-2 gap-8">
        {/* Current Brain */}
        <div className="bg-white border rounded-xl p-6">
          <BrainSVG
            regionFills={currentBrainFills}
            title="Current State"
            isGoal={false}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">{comparison?.total_insights || 0} insights trained</p>
            {misalignments.length > 0 && (
              <p className="text-sm text-red-500 mt-1">
                {misalignments.length} region{misalignments.length !== 1 ? 's' : ''} with gaps
              </p>
            )}
          </div>
        </div>

        {/* Goal Brain */}
        <div className="bg-white border rounded-xl p-6">
          <BrainSVG
            regionFills={goalBrainFills}
            title="Goal State"
            isGoal={true}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Target brain configuration</p>
            <p className="text-sm text-green-600 mt-1">Fully aligned state</p>
          </div>
        </div>
      </div>

      {/* Misalignment Alert Section */}
      {misalignments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Regions Needing Attention</h3>
          </div>
          <div className="space-y-3">
            {misalignments.map((m) => (
              <div key={m.region} className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: BRAIN_REGIONS[m.region as keyof typeof BRAIN_REGIONS]?.color }}
                    />
                    <span className="font-medium text-gray-900">{m.name}</span>
                  </div>
                  <span className="text-red-600 font-medium">-{m.gap}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{m.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-600">Current: {m.current}%</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-green-600">Goal: {m.goal}%</span>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Related categories: {BRAIN_REGIONS[m.region as keyof typeof BRAIN_REGIONS]?.categories.slice(0, 3).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {misalignments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Recommendations to Fill Gaps</h3>
            </div>
            <a
              href="/channels"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Process Videos
            </a>
          </div>
          <div className="space-y-3">
            {misalignments.slice(0, 3).map((m) => {
              const region = BRAIN_REGIONS[m.region as keyof typeof BRAIN_REGIONS];
              return (
                <div key={m.region} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-gray-900">Strengthen {m.name}</span>
                    </div>
                    <span className="text-sm text-red-500 font-medium">Need +{m.gap}%</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Process more videos with content about: {region?.categories.slice(0, 4).map(c => c.replace(/_/g, ' ')).join(', ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getSuggestedChannels(m.region).map((suggestion, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend with Percentages */}
      <div className="bg-gray-50 border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Brain Region Training Status</h3>
          <a
            href="/channels"
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Process More Videos
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(BRAIN_REGIONS).map(([key, region]) => {
            const stats = regionStats[key] || { current: 0, goal: 10, gap: 10 };
            const needsMore = stats.gap > 0;
            return (
              <div key={key} className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: region.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{region.name}</p>
                    <p className="text-xs text-gray-500 truncate">{region.description}</p>
                  </div>
                  {needsMore && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full flex-shrink-0">
                      Need +{stats.gap}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Current: {stats.current}%</span>
                      <span className="text-gray-500">Goal: {stats.goal}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (stats.current / stats.goal) * 100)}%`,
                          backgroundColor: region.color,
                        }}
                      />
                      {/* Goal marker */}
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-gray-600"
                        style={{ left: '100%' }}
                      />
                    </div>
                  </div>
                </div>
                {needsMore && (
                  <div className="mt-2 text-xs text-gray-500">
                    Suggested: {getSuggestedChannels(key).slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Score Explanation - only show when actually aligned AND has data */}
      {misalignments.length === 0 && !hasNoData && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-700 mb-2">Brain is Well-Aligned!</h3>
          <p className="text-sm text-green-600">
            Your current training data matches your goal configuration. Keep monitoring as you add more content.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to suggest channels based on brain region
function getSuggestedChannels(region: string): string[] {
  const suggestions: Record<string, string[]> = {
    prefrontal: ['Philosophy channels', 'Decision making podcasts', 'CBT therapy content'],
    temporal: ['Communication skills', 'Relationship therapy', 'Social psychology'],
    limbic: ['Joy & gratitude content', 'Positive psychology', 'Mindfulness channels'],
    amygdala: ['Anxiety management', 'Trauma recovery', 'Emotional regulation'],
    hippocampus: ['Personal growth', 'Life coaching', 'Wisdom traditions'],
    parietal: ['Somatic therapy', 'Body-based healing', 'Mind-body connection'],
    occipital: ['Creativity channels', 'Spiritual content', 'Meaning & purpose'],
    brainstem: ['Coping strategies', 'Boundaries content', 'Self-care'],
  };
  return suggestions[region] || ['Wellness content'];
}

// ============================================================================
// PROMPT LAB TAB
// ============================================================================

function PromptLabTab() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { mutate: testPrompt, isPending } = useMutation({
    mutationFn: () => testPromptInLab(prompt, { showInfluences: true, systemPrompt: systemPrompt || undefined }),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Prompt Lab</h2>
        <p className="text-sm text-gray-500">Test prompts and see which training insights influence the response</p>
      </div>

      {/* Input */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Test Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to test... e.g., 'I've been feeling really anxious lately and can't sleep.'"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button onClick={() => setShowSystemPrompt(!showSystemPrompt)} className="text-sm text-purple-600 hover:text-purple-700">
          {showSystemPrompt ? 'Hide' : 'Show'} Custom System Prompt
        </button>

        {showSystemPrompt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt (optional)</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Custom system prompt..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        <button
          onClick={() => testPrompt()}
          disabled={!prompt.trim() || isPending}
          className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Testing...</> : <><Send className="w-4 h-4" />Test Prompt</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Response */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">Response</h3>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{result.response}</p>
          </div>

          {/* Influences */}
          {result.influences && result.influences.length > 0 && (
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Influencing Insights ({result.total_relevant_insights} relevant)</h3>
                <span className="text-sm text-gray-500">{result.brain_stats.total_insights} total in brain</span>
              </div>
              <div className="space-y-3">
                {result.influences.map((inf: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{inf.marker}</code>
                      <span className="text-xs text-gray-500">{inf.category}</span>
                      <span className="text-xs text-purple-600 ml-auto">Relevance: {inf.relevance_score} | Weight: {inf.influence_weight}x</span>
                    </div>
                    <p className="text-sm text-gray-700">{inf.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!result && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Beaker className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Enter a prompt above to test</p>
          <p className="text-sm text-gray-400">See how your training data influences responses</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BrainStudioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('visualization');

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'visualization', label: 'Brain View', icon: Brain },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'philosophy', label: 'Philosophy', icon: FileText },
    { id: 'tenants', label: 'Tenants', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: Scale },
    { id: 'influence', label: 'Influence', icon: PieChart },
    { id: 'prompt-lab', label: 'Prompt Lab', icon: Beaker },
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
        <p className="text-gray-500">Monitor and tune the LLM brain - goals, philosophy, tenants, and influence weights</p>
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
                activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
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
        {activeTab === 'visualization' && <BrainVisualizationTab />}
        {activeTab === 'goals' && <GoalsTab />}
        {activeTab === 'philosophy' && <PhilosophyTab />}
        {activeTab === 'tenants' && <TenantsTab />}
        {activeTab === 'compliance' && <ComplianceTab />}
        {activeTab === 'influence' && <InfluenceTab />}
        {activeTab === 'prompt-lab' && <PromptLabTab />}
      </div>
    </div>
  );
}
