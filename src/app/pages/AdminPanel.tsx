import React, { useEffect, useState } from 'react';
import * as api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, AlertCircle, BookOpen, TrendingUp, CheckCircle, Clock, XCircle,
  RefreshCw, Plus, Save, X, Trash2, Building2, Ban, RotateCcw
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'অপেক্ষমান', color: '#D97706', bg: '#FFFBEB' },
  in_progress: { label: 'চলমান', color: '#2563EB', bg: '#EFF6FF' },
  resolved: { label: 'সমাধান হয়েছে', color: '#059669', bg: '#ECFDF5' },
  rejected: { label: 'প্রত্যাখ্যাত', color: '#DC2626', bg: '#FEF2F2' },
};

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  Road: { icon: '🛣️', label: 'সড়ক', color: '#F97316' },
  Garbage: { icon: '🗑️', label: 'বর্জ্য', color: '#92400E' },
  Water: { icon: '💧', label: 'পানি', color: '#2563EB' },
  Electricity: { icon: '⚡', label: 'বিদ্যুৎ', color: '#D97706' },
  Other: { icon: '📋', label: 'অন্যান্য', color: '#8B5CF6' },
};

const ALL_CATEGORIES = ['Road', 'Garbage', 'Water', 'Electricity', 'Other'];
const CATEGORY_LABELS: Record<string, string> = { Road: 'সড়ক', Garbage: 'বর্জ্য', Water: 'পানি', Electricity: 'বিদ্যুৎ', Other: 'অন্যান্য' };

const TABS = [
  { id: 'overview', label: 'সারসংক্ষেপ', icon: <TrendingUp size={16} /> },
  { id: 'problems', label: 'সমস্যাসমূহ', icon: <AlertCircle size={16} /> },
  { id: 'users', label: 'ব্যবহারকারী', icon: <Users size={16} /> },
  { id: 'orgs', label: 'সংস্থা', icon: <Building2 size={16} /> },
];

const BLANK_ORG = { id: '', name: '', shortName: '', categories: [] as string[] };

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [newOrg, setNewOrg] = useState(BLANK_ORG);
  const [addingOrg, setAddingOrg] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, u, o] = await Promise.all([
        api.getAdminStats(), api.getProblems(), api.getAdminUsers(), api.getOrganizations()
      ]);
      setStats(s);
      setProblems(p);
      setUsers(u);
      setOrgs(o);
    } catch (err) { console.error('Admin load error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const statusChartData = stats ? [
    { name: 'অপেক্ষমান', value: stats.problemsByStatus?.pending || 0, color: '#D97706' },
    { name: 'চলমান', value: stats.problemsByStatus?.in_progress || 0, color: '#2563EB' },
    { name: 'সমাধান', value: stats.problemsByStatus?.resolved || 0, color: '#059669' },
    { name: 'প্রত্যাখ্যাত', value: stats.problemsByStatus?.rejected || 0, color: '#DC2626' },
  ] : [];

  const categoryChartData = stats ? Object.entries(stats.categoryStats || {}).map(([key, val]) => ({
    name: CATEGORY_CONFIG[key]?.label || key,
    count: val as number,
    color: CATEGORY_CONFIG[key]?.color || '#006A4E',
  })) : [];

  const filteredProblems = filterStatus ? problems.filter(p => p.status === filterStatus) : problems;

  const handleStatusChange = async (problemId: string, status: string) => {
    setUpdatingId(problemId);
    try {
      await api.updateProblem(problemId, { status });
      setProblems(prev => prev.map(p => p.id === problemId ? { ...p, status } : p));
      showToast('✅ অবস্থা আপডেট হয়েছে');
    } catch (err: any) {
      showToast('❌ আপডেট ব্যর্থ: ' + err.message);
    } finally { setUpdatingId(null); }
  };

  const handleSuspend = async (userId: string) => {
    setSuspendingId(userId);
    try {
      await api.suspendUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: true } : u));
      showToast('⛔ ব্যবহারকারী স্থগিত করা হয়েছে');
    } catch (err: any) {
      showToast('❌ ' + err.message);
    } finally { setSuspendingId(null); }
  };

  const handleReactivate = async (userId: string) => {
    setSuspendingId(userId);
    try {
      await api.reactivateUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: false } : u));
      showToast('✅ ব্যবহারকারী পুনরায় সক্রিয় করা হয়েছে');
    } catch (err: any) {
      showToast('❌ ' + err.message);
    } finally { setSuspendingId(null); }
  };

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.id || !newOrg.name) { showToast('❌ আইডি ও নাম আবশ্যক'); return; }
    if (newOrg.categories.length === 0) { showToast('❌ অন্তত একটি বিভাগ নির্বাচন করুন'); return; }
    setAddingOrg(true);
    try {
      await api.addOrganization(newOrg);
      showToast('✅ সংস্থা যোগ হয়েছে!');
      setNewOrg(BLANK_ORG);
      const o = await api.getOrganizations();
      setOrgs(o);
    } catch (err: any) {
      showToast('❌ ' + err.message);
    } finally { setAddingOrg(false); }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!confirm('এই সংস্থাটি মুছে ফেলতে চান?')) return;
    setDeletingOrgId(id);
    try {
      await api.deleteOrganization(id);
      showToast('✅ সংস্থা মুছে ফেলা হয়েছে');
      setOrgs(prev => prev.filter(o => o.id !== id));
    } catch (err: any) {
      showToast('❌ ' + err.message);
    } finally { setDeletingOrgId(null); }
  };

  const toggleOrgCategory = (cat: string) => {
    setNewOrg(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-0">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">অ্যাডমিন প্যানেল</h1>
          <p className="text-gray-500 text-sm">সিস্টেম পরিচালনা করুন</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} />
          রিফ্রেশ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Users size={20} />, label: 'মোট ব্যবহারকারী', value: stats?.totalUsers || 0, color: '#7C3AED', bg: '#F5F3FF' },
          { icon: <AlertCircle size={20} />, label: 'মোট সমস্যা', value: stats?.totalProblems || 0, color: '#F97316', bg: '#FFF7ED' },
          { icon: <CheckCircle size={20} />, label: 'সমাধান হয়েছে', value: stats?.problemsByStatus?.resolved || 0, color: '#059669', bg: '#ECFDF5' },
          { icon: <BookOpen size={20} />, label: 'মোট কোর্স', value: stats?.totalCourses || 0, color: '#2563EB', bg: '#EFF6FF' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-[#006A4E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">অবস্থা অনুযায়ী সমস্যা</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {statusChartData.map((entry, index) => <Cell key={`status-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val}টি`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {statusChartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}></div>
                    <span className="text-xs text-gray-600">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">বিভাগ অনুযায়ী সমস্যা</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => <Cell key={`cat-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">দ্রুত সারসংক্ষেপ</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'অপেক্ষমান', value: stats?.problemsByStatus?.pending || 0, icon: <Clock size={18} />, color: '#D97706', bg: '#FFFBEB' },
                { label: 'চলমান', value: stats?.problemsByStatus?.in_progress || 0, icon: <TrendingUp size={18} />, color: '#2563EB', bg: '#EFF6FF' },
                { label: 'সমাধান হয়েছে', value: stats?.problemsByStatus?.resolved || 0, icon: <CheckCircle size={18} />, color: '#059669', bg: '#ECFDF5' },
                { label: 'প্রত্যাখ্যাত', value: stats?.problemsByStatus?.rejected || 0, icon: <XCircle size={18} />, color: '#DC2626', bg: '#FEF2F2' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-xl" style={{ background: s.bg }}>
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-600 mt-0.5 text-center">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Problems Tab */}
      {activeTab === 'problems' && (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button onClick={() => setFilterStatus('')} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${!filterStatus ? 'bg-[#006A4E] text-white border-[#006A4E]' : 'border-gray-200 text-gray-600'}`}>সব ({problems.length})</button>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <button key={key} onClick={() => setFilterStatus(key === filterStatus ? '' : key)} className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors" style={filterStatus === key ? { background: val.color, color: 'white', borderColor: val.color } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
                {val.label} ({problems.filter(p => p.status === key).length})
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">সমস্যা</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">বিভাগ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">অবস্থা পরিবর্তন</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProblems.map(prob => {
                    const cat = CATEGORY_CONFIG[prob.category];
                    return (
                      <tr key={prob.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{prob.title}</p>
                          <p className="text-xs text-gray-400">{prob.userName}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm">{cat?.icon} {cat?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={prob.status}
                            onChange={e => handleStatusChange(prob.id, e.target.value)}
                            disabled={updatingId === prob.id}
                            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#006A4E] bg-white disabled:opacity-50"
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-400">{new Date(prob.createdAt).toLocaleDateString('bn-BD')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProblems.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">কোনো সমস্যা পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">ব্যবহারকারী</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">ইমেইল</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">বিভাগ</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">অবস্থা</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.suspended ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: u.suspended ? '#9CA3AF' : '#006A4E' }}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.problemCount || 0}টি সমস্যা</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{u.division || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">⛔ স্থগিত</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">✅ সক্রিয়</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <button
                          onClick={() => handleReactivate(u.id)}
                          disabled={suspendingId === u.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw size={12} />
                          {suspendingId === u.id ? '...' : 'পুনরায় সক্রিয়'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(u.id)}
                          disabled={suspendingId === u.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <Ban size={12} />
                          {suspendingId === u.id ? '...' : 'স্থগিত করুন'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">কোনো ব্যবহারকারী নেই</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'orgs' && (
        <div className="space-y-5">
          {/* Add Org Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-[#006A4E]" />
              নতুন সংস্থা যোগ করুন
            </h3>
            <form onSubmit={handleAddOrg} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সংস্থার আইডি <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={newOrg.id} onChange={e => setNewOrg(p => ({ ...p, id: e.target.value.toUpperCase() }))}
                    placeholder="যেমন: DNCC"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সংক্ষিপ্ত নাম</label>
                  <input
                    type="text" value={newOrg.shortName} onChange={e => setNewOrg(p => ({ ...p, shortName: e.target.value }))}
                    placeholder="যেমন: DNCC"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">সংস্থার পূর্ণ নাম <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={newOrg.name} onChange={e => setNewOrg(p => ({ ...p, name: e.target.value }))}
                    placeholder="সংস্থার পূর্ণ বাংলা নাম"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">সমস্যার বিভাগ <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map(cat => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const selected = newOrg.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleOrgCategory(cat)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all"
                          style={selected
                            ? { background: cfg.color, color: 'white', borderColor: cfg.color }
                            : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
                          }
                        >
                          {cfg.icon} {cfg.label}
                          {selected && <X size={10} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={addingOrg} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium disabled:opacity-60 transition-colors text-sm" style={{ background: '#006A4E' }}>
                <Save size={15} />
                {addingOrg ? 'যোগ হচ্ছে...' : 'সংস্থা সংরক্ষণ করুন'}
              </button>
            </form>
          </div>

          {/* Org List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">নিবন্ধিত সংস্থাসমূহ ({orgs.length}টি)</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {orgs.map(org => (
                <div key={org.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#006A4E]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-[#006A4E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{org.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">{org.id}</span>
                      <span className="text-gray-300">·</span>
                      {(org.categories || []).map((cat: string) => {
                        const cfg = CATEGORY_CONFIG[cat];
                        return (
                          <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cfg?.color, background: cfg?.color + '18' }}>
                            {cfg?.icon} {cfg?.label || cat}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOrg(org.id)}
                    disabled={deletingOrgId === org.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {orgs.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">কোনো সংস্থা নেই</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
