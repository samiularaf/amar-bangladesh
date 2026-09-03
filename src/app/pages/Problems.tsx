import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { Search, Filter, ThumbsUp, MapPin, Clock, CheckCircle, TrendingUp, AlertCircle, ChevronDown } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  Road: { icon: '🛣️', color: '#F97316', bg: '#FFF7ED', label: 'সড়ক' },
  Garbage: { icon: '🗑️', color: '#92400E', bg: '#FFFBEB', label: 'বর্জ্য' },
  Water: { icon: '💧', color: '#2563EB', bg: '#EFF6FF', label: 'পানি' },
  Electricity: { icon: '⚡', color: '#D97706', bg: '#FFFBEB', label: 'বিদ্যুৎ' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'অপেক্ষমান', color: '#D97706', bg: '#FFFBEB', icon: <Clock size={12} /> },
  in_progress: { label: 'চলমান', color: '#2563EB', bg: '#EFF6FF', icon: <TrendingUp size={12} /> },
  resolved: { label: 'সমাধান হয়েছে', color: '#059669', bg: '#ECFDF5', icon: <CheckCircle size={12} /> },
  rejected: { label: 'প্রত্যাখ্যাত', color: '#DC2626', bg: '#FEF2F2', icon: <AlertCircle size={12} /> },
};

const SOLVE_LABELS: Record<string, string> = {
  own: '🙋 নিজে সমাধান',
  organization: '🏛️ সংস্থার মাধ্যমে',
};

export default function Problems() {
  const { user } = useAuth();
  const location = useLocation();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>(
    user?.role === 'admin' ? 'all' : (location.state as any)?.myOnly ? 'my' : 'all'
  );
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await api.getProblems({ myOnly: activeTab === 'my', category: filterCategory || undefined, status: filterStatus || undefined });
      setProblems(data);
    } catch (err) {
      console.error('Load problems error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProblems(); }, [activeTab, filterCategory, filterStatus]);

  const filtered = problems.filter(p =>
    !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQ.toLowerCase()) ||
    (p.location || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleUpvote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.upvoteProblem(id);
      setProblems(prev => prev.map(p => p.id === id ? { ...p, upvotes: res.upvotes, upvotedBy: res.upvoted ? [...(p.upvotedBy || []), user?.id] : (p.upvotedBy || []).filter((uid: string) => uid !== user?.id) } : p));
    } catch {}
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'এইমাত্র';
    if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ঘন্টা আগে`;
    return `${Math.floor(diff / 86400)} দিন আগে`;
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">সমস্যাসমূহ</h1>
        <p className="text-gray-500 text-sm">আপনার এলাকার সকল সমস্যা দেখুন</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'all', label: 'সকল সমস্য��' },
          ...(user?.role === 'admin' ? [] : [{ key: 'my', label: 'আমার সমস্যা' }]),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? 'bg-white text-[#006A4E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="সমস্যা খুঁজুন..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm bg-white"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${(filterCategory || filterStatus) ? 'border-[#006A4E] bg-[#006A4E]/5 text-[#006A4E]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
        >
          <Filter size={16} />
          ফিল্টার
          {(filterCategory || filterStatus) && <span className="bg-[#006A4E] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{[filterCategory, filterStatus].filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">বিভাগ</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterCategory('')} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!filterCategory ? 'bg-[#006A4E] text-white border-[#006A4E]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>সব</button>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <button key={key} onClick={() => setFilterCategory(key === filterCategory ? '' : key)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterCategory === key ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`} style={filterCategory === key ? { background: val.color } : {}}>
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">অবস্থা</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterStatus('')} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!filterStatus ? 'bg-[#006A4E] text-white border-[#006A4E]' : 'border-gray-200 text-gray-600'}`}>সব</button>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <button key={key} onClick={() => setFilterStatus(key === filterStatus ? '' : key)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors`} style={filterStatus === key ? { background: val.color, color: 'white', borderColor: val.color } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {(filterCategory || filterStatus) && (
            <button onClick={() => { setFilterCategory(''); setFilterStatus(''); }} className="mt-3 text-xs text-red-500 hover:underline">ফিল্টার মুছুন</button>
          )}
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-3">{filtered.length}টি সমস্যা পাওয়া গেছে</p>

      {/* Problem List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">কোনো সমস্যা পাওয়া যায়নি</p>
          <p className="text-gray-400 text-sm mt-1">{activeTab === 'my' ? 'আপনি এখনো কোনো সমস্যা জমা দেননি' : 'ফিল্টার পরিবর্তন করে দেখুন'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prob => {
            const cat = CATEGORY_CONFIG[prob.category];
            const status = STATUS_CONFIG[prob.status];
            const isUpvoted = (prob.upvotedBy || []).includes(user?.id);
            return (
              <Link
                key={prob.id}
                to={`/problems/${prob.id}`}
                className="block bg-white rounded-2xl border border-gray-100 hover:border-[#006A4E]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: cat?.bg }}>
                      {cat?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{prob.title}</h3>
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium" style={{ color: status?.color, background: status?.bg }}>
                          {status?.icon}
                          <span className="hidden sm:inline">{status?.label}</span>
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{prob.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {prob.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={11} />
                            {prob.location}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(prob.createdAt)}</span>
                        <span className="text-xs text-gray-400">{prob.userName}</span>
                        {prob.solveMethod && (
                          <span className="text-xs text-gray-400">{SOLVE_LABELS[prob.solveMethod]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <button
                      onClick={e => handleUpvote(e, prob.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${isUpvoted ? 'bg-[#006A4E]/10 text-[#006A4E]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <ThumbsUp size={12} className={isUpvoted ? 'fill-[#006A4E]' : ''} />
                      {prob.upvotes || 0} সমর্থন
                    </button>
                    <span className="text-xs text-[#006A4E] font-medium">বিস্তারিত দেখুন →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
