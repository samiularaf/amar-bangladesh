import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import {
  AlertCircle, CheckCircle, Clock, Star, BookOpen,
  PlusCircle, TrendingUp, ArrowRight, MapPin, Zap, Droplets, Trash2, ChevronRight
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  Road: { icon: '🛣️', color: '#F97316', bg: '#FFF7ED', label: 'সড়ক' },
  Garbage: { icon: '🗑️', color: '#92400E', bg: '#FFFBEB', label: 'বর্জ্য' },
  Water: { icon: '💧', color: '#2563EB', bg: '#EFF6FF', label: 'পানি' },
  Electricity: { icon: '⚡', color: '#D97706', bg: '#FFFBEB', label: 'বিদ্যুৎ' },
  Other: { icon: '📋', color: '#8B5CF6', bg: '#F5F3FF', label: 'অন্যান্য' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'অপেক্ষমান', color: '#D97706', bg: '#FFFBEB', icon: <Clock size={14} /> },
  in_progress: { label: 'চলমান', color: '#2563EB', bg: '#EFF6FF', icon: <TrendingUp size={14} /> },
  resolved: { label: 'সমাধান হয়েছে', color: '#059669', bg: '#ECFDF5', icon: <CheckCircle size={14} /> },
  rejected: { label: 'প্রত্যাখ্যাত', color: '#DC2626', bg: '#FEF2F2', icon: <AlertCircle size={14} /> },
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [probs, enrs] = await Promise.all([
          api.getProblems({ myOnly: true }),
          api.getMyEnrollments(),
        ]);
        setProblems(probs);
        setEnrollments(enrs);
        await refreshUser();
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = {
    submitted: problems.length,
    resolved: problems.filter(p => p.status === 'resolved').length,
    pending: problems.filter(p => p.status === 'pending').length,
    inProgress: problems.filter(p => p.status === 'in_progress').length,
    courses: enrollments.length,
    completed: enrollments.filter(e => e.completed).length,
  };

  const recentProblems = problems.slice(0, 4);

  const getLevel = (pts: number) => {
    if (pts < 50) return { name: 'নতুন নাগরিক', next: 50, icon: '🌱' };
    if (pts < 150) return { name: 'সক্রিয় নাগরিক', next: 150, icon: '⭐' };
    if (pts < 300) return { name: 'দায়িত্বশীল নাগরিক', next: 300, icon: '🌟' };
    if (pts < 500) return { name: 'আদর্শ নাগরিক', next: 500, icon: '🏆' };
    return { name: 'বীর নাগরিক', next: 1000, icon: '👑' };
  };

  const level = getLevel(user?.points || 0);
  const progress = Math.min(((user?.points || 0) / level.next) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 lg:pb-0">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #006A4E 0%, #004d38 100%)' }}>
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1">স্বাগতম,</p>
          <h2 className="text-2xl font-bold mb-4">{user?.name} 👋</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <p className="text-white/70 text-xs">আপনার স্তর</p>
                <p className="text-white font-semibold text-sm">{level.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
              <Star size={20} className="text-yellow-300" />
              <div>
                <p className="text-white/70 text-xs">মোট পয়েন্ট</p>
                <p className="text-white font-bold text-lg">{user?.points}</p>
              </div>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>পরবর্তী স্তর: {level.next} পয়েন্ট</span>
              <span>{user?.points}/{level.next}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <div className="h-2 bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Point balance guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">💡 পয়েন্ট ব্যালেন্সের নিয়ম</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { action: 'সমস্যা জানালে', pts: '+১০' },
            { action: 'সমস্যা সমাধান হলে', pts: '+৫০' },
            { action: 'কোর্সে ভর্তি হলে মূল্য কাটা হবে; সম্পন্ন হলে নির্ধারিত পুরস্কার ফেরত পাবেন', pts: 'কোর্সভেদে' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-2">
              <span className="text-green-600 font-bold text-sm">{item.pts}</span>
              <span className="text-gray-600 text-xs">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'জমা দিয়েছেন', value: stats.submitted, color: '#006A4E', bg: '#F0FDF4', icon: <AlertCircle size={18} /> },
          { label: 'সমাধান হয়েছে', value: stats.resolved, color: '#059669', bg: '#ECFDF5', icon: <CheckCircle size={18} /> },
          { label: 'অপেক্ষমান', value: stats.pending, color: '#D97706', bg: '#FFFBEB', icon: <Clock size={18} /> },
          { label: 'চলমান', value: stats.inProgress, color: '#2563EB', bg: '#EFF6FF', icon: <TrendingUp size={18} /> },
          { label: 'ভর্তি কোর্স', value: stats.courses, color: '#7C3AED', bg: '#F5F3FF', icon: <BookOpen size={18} /> },
          { label: 'সম্পন্ন কোর্স', value: stats.completed, color: '#DB2777', bg: '#FDF2F8', icon: <Star size={18} /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">দ্রুত কাজ করুন</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { to: '/submit', icon: '🛣️', label: 'সড়ক সমস্যা', cat: 'Road' },
            { to: '/submit', icon: '🗑️', label: 'বর্জ্য সমস্যা', cat: 'Garbage' },
            { to: '/submit', icon: '💧', label: 'পানি সংকট', cat: 'Water' },
            { to: '/submit', icon: '⚡', label: 'বিদ্যুৎ সমস্যা', cat: 'Electricity' },
            { to: '/submit', icon: '📋', label: 'অন্যান্য সমস্যা', cat: 'Other' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              state={{ preCategory: item.cat }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md hover:border-[#006A4E]/30 transition-all duration-200 group"
            >
              <span className="text-3xl mb-2">{item.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#006A4E]">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Problems */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">সাম্প্রতিক সমস্যাসমূহ</h3>
          <Link to="/problems" className="text-[#006A4E] text-sm font-medium flex items-center gap-1 hover:underline">
            সব দেখুন <ArrowRight size={14} />
          </Link>
        </div>
        {recentProblems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
            <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">এখনো কোনো সমস্যা জমা দেননি</p>
            <Link to="/submit" className="inline-flex items-center gap-2 bg-[#006A4E] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#005540] transition-colors">
              <PlusCircle size={16} />
              প্রথম সমস্যা জানান
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProblems.map(prob => {
              const cat = CATEGORY_CONFIG[prob.category];
              const status = STATUS_CONFIG[prob.status];
              return (
                <Link
                  key={prob.id}
                  to={`/problems/${prob.id}`}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md hover:border-[#006A4E]/20 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: cat?.bg }}>
                    {cat?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{prob.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-gray-500 text-xs truncate">{prob.location || 'অবস্থান অজানা'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1" style={{ color: status?.color, background: status?.bg }}>
                      {status?.icon}
                      {status?.label}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(prob.createdAt).toLocaleDateString('bn-BD')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
