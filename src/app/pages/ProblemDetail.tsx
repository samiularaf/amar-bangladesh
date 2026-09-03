import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { ArrowLeft, ThumbsUp, MapPin, Clock, CheckCircle, TrendingUp, AlertCircle, Edit2, Save, X, MessageSquare } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  Road: { icon: '🛣️', color: '#F97316', bg: '#FFF7ED', label: 'সড়ক' },
  Garbage: { icon: '🗑️', color: '#92400E', bg: '#FFFBEB', label: 'বর্জ্য' },
  Water: { icon: '💧', color: '#2563EB', bg: '#EFF6FF', label: 'পানি' },
  Electricity: { icon: '⚡', color: '#D97706', bg: '#FFFBEB', label: 'বিদ্যুৎ' },
  Other: { icon: '📋', color: '#8B5CF6', bg: '#F5F3FF', label: 'অন্যান্য' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'অপেক্ষমান', color: '#D97706', bg: '#FFFBEB' },
  in_progress: { label: 'চলমান', color: '#2563EB', bg: '#EFF6FF' },
  resolved: { label: 'সমাধান হয়েছে', color: '#059669', bg: '#ECFDF5' },
  rejected: { label: 'প্রত্যাখ্যাত', color: '#DC2626', bg: '#FEF2F2' },
};

const STATUSES = [
  { value: 'pending', label: '⏳ অপেক্ষমান' },
  { value: 'in_progress', label: '🔄 চলমান' },
  { value: 'resolved', label: '✅ সমাধান হয়েছে' },
  { value: 'rejected', label: '❌ প্রত্যাখ্যাত' },
];

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getProblem(id!);
        setProblem(data);
        setEditStatus(data.status);
        setEditNote(data.adminNote || '');
      } catch (err) {
        console.error('Load problem error:', err);
        setError('সমস্যাটি পাওয়া যায়নি');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpvote = async () => {
    if (user?.role === 'admin') return;
    try {
      const res = await api.upvoteProblem(id!);
      setProblem((prev: any) => ({
        ...prev, upvotes: res.upvotes,
        upvotedBy: res.upvoted ? [...(prev.upvotedBy || []), user?.id] : (prev.upvotedBy || []).filter((uid: string) => uid !== user?.id)
      }));
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProblem(id!, { status: editStatus, adminNote: editNote });
      setProblem(updated);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600">সমস্যাটি পাওয়া যায়নি</h2>
        <Link to="/problems" className="text-[#006A4E] hover:underline mt-2 inline-block">← সমস্যার তালিকায় ফিরুন</Link>
      </div>
    );
  }

  const cat = CATEGORY_CONFIG[problem.category];
  const status = STATUS_CONFIG[problem.status];
  const isUpvoted = (problem.upvotedBy || []).includes(user?.id);
  const canEdit = user?.role === 'admin';

  const formatDate = (d: string) => new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft size={18} />
        <span className="text-sm">ফিরে যান</span>
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: cat?.bg }}>
                {cat?.icon}
              </div>
              <div>
                <span className="inline-block text-xs font-medium px-2 py-1 rounded-full mb-2" style={{ color: cat?.color, background: cat?.bg }}>
                  {cat?.label}
                </span>
                <h1 className="text-xl font-bold text-gray-800 leading-tight">{problem.title}</h1>
              </div>
            </div>
            <span className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium" style={{ color: status?.color, background: status?.bg }}>
              {status?.label}
            </span>
          </div>
        </div>

        {problem.imageUrl && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">সংযুক্ত ছবি</h3>
            <a href={problem.imageUrl} target="_blank" rel="noreferrer" className="block">
              <img src={problem.imageUrl} alt="রিপোর্ট করা সমস্যার ছবি" className="w-full max-h-[28rem] object-contain rounded-xl border border-gray-200 bg-gray-50" />
            </a>
          </div>
        )}

        {/* Description */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">বিবরণ</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{problem.description}</p>
        </div>

        {/* Meta Info */}
        <div className="p-6 border-b border-gray-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">রিপোর্টকারী</p>
            <p className="text-sm font-medium text-gray-700">{problem.userName}</p>
          </div>
          {problem.location && (
            <div>
              <p className="text-xs text-gray-400 mb-1">অবস্থান</p>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <MapPin size={12} className="text-gray-400" />
                {problem.location}
              </p>
            </div>
          )}
          {(problem.division || problem.district) && (
            <div>
              <p className="text-xs text-gray-400 mb-1">বিভাগ / জেলা</p>
              <p className="text-sm font-medium text-gray-700">{problem.division} / {problem.district}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-1">সমাধান পদ্ধতি</p>
            <p className="text-sm font-medium text-gray-700">{problem.solveMethod === 'own' ? '🙋 নিজে সমাধান' : `🏛️ ${problem.organizationId || 'সংস্থার মাধ্যমে'}`}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">জমার তারিখ</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(problem.createdAt)}</p>
          </div>
          {problem.resolvedAt && (
            <div>
              <p className="text-xs text-gray-400 mb-1">সমাধানের তারিখ</p>
              <p className="text-sm font-medium text-green-600">{formatDate(problem.resolvedAt)}</p>
            </div>
          )}
        </div>

        {/* Admin Note */}
        {(problem.adminNote || canEdit) && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <MessageSquare size={14} />
                কর্তৃপক্ষের মন্তব্য
              </h3>
              {canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-[#006A4E] hover:underline">
                  <Edit2 size={12} />
                  সম্পাদনা করুন
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">অবস্থা পরিবর্তন করুন</label>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUSES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setEditStatus(s.value)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${editStatus === s.value ? 'border-[#006A4E] bg-[#006A4E]/5 text-[#006A4E]' : 'border-gray-200 text-gray-600'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">মন্তব্য লিখুন</label>
                  <textarea
                    value={editNote} onChange={e => setEditNote(e.target.value)}
                    placeholder="কর্তৃপক্ষের মন্তব্য বা আপডেট লিখুন..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006A4E] resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition-colors" style={{ background: '#006A4E' }}>
                    <Save size={14} />
                    {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditStatus(problem.status); setEditNote(problem.adminNote || ''); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                    <X size={14} />
                    বাতিল
                  </button>
                </div>
              </div>
            ) : (
              problem.adminNote ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-sm text-blue-800">{problem.adminNote}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">এখনো কোনো মন্তব্য নেই</p>
              )
            )}
          </div>
        )}

        {/* Upvote */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">এই সমস্যাটি কি আপনিও অনুভব করছেন?</p>
              <p className="text-xs text-gray-400">আপভোট করে সমস্যাটির গুরুত্ব বাড়ান</p>
            </div>
            {user?.role === 'admin' ? (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-medium text-sm">
                <ThumbsUp size={16} />
                {problem.upvotes || 0} জন নাগরিক সমর্থন করেছেন
              </div>
            ) : (
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isUpvoted ? 'bg-[#006A4E] text-white' : 'border-2 border-[#006A4E] text-[#006A4E] hover:bg-[#006A4E]/5'}`}
              >
                <ThumbsUp size={16} className={isUpvoted ? 'fill-white' : ''} />
                {problem.upvotes || 0} সমর্থন
              </button>
            )}
          </div>

          {problem.status === 'resolved' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-semibold text-sm">সমস্যাটি সমাধান হয়েছে! 🎉</p>
                <p className="text-green-600 text-xs">রিপোর্টকারী +৫০ পয়েন্ট পেয়েছেন</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
