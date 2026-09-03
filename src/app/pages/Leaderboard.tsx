import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { Trophy, Star, Medal, TrendingUp, CheckCircle } from 'lucide-react';

const DIVISION_LABELS: Record<string, string> = { Dhaka: 'ঢাকা', Chattogram: 'চট্টগ্রাম', Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Barishal: 'বরিশাল', Sylhet: 'সিলেট', Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ' };

const LEVEL_CONFIG = (pts: number) => {
  if (pts < 50) return { name: 'নতুন নাগরিক', icon: '🌱', color: '#6B7280' };
  if (pts < 150) return { name: 'সক্রিয় নাগরিক', icon: '⭐', color: '#D97706' };
  if (pts < 300) return { name: 'দায়িত্বশীল নাগরিক', icon: '🌟', color: '#7C3AED' };
  if (pts < 500) return { name: 'আদর্শ নাগরিক', icon: '🏆', color: '#2563EB' };
  return { name: 'বীর নাগরিক', icon: '👑', color: '#D97706' };
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then(data => setLeaders(data))
      .catch(err => console.error('Leaderboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  const myRank = leaders.findIndex(l => l.id === user?.id) + 1;

  const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center shadow-md"><span className="text-lg">🥇</span></div>;
    if (rank === 2) return <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center shadow-md"><span className="text-lg">🥈</span></div>;
    if (rank === 3) return <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center shadow-md"><span className="text-lg">🥉</span></div>;
    return <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-sm font-bold text-gray-500">#{rank}</span></div>;
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">লিডারবোর্ড</h1>
        <p className="text-gray-500 text-sm">সেরা নাগরিকদের তালিকা দেখুন</p>
      </div>

      {/* Top 3 Podium */}
      {!loading && leaders.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {/* 2nd */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-14 h-14 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 mb-2">
              {leaders[1]?.name?.charAt(0)}
            </div>
            <span className="text-2xl mb-1">🥈</span>
            <p className="text-sm font-semibold text-gray-700 text-center truncate w-full px-1">{leaders[1]?.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="text-yellow-400" />
              <span className="text-sm font-bold text-gray-600">{leaders[1]?.lifetimePoints}</span>
            </div>
            <div className="h-16 w-full bg-gray-200 rounded-t-xl mt-2"></div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-600 mb-2 shadow-md">
              {leaders[0]?.name?.charAt(0)}
            </div>
            <span className="text-3xl mb-1">🥇</span>
            <p className="text-sm font-bold text-gray-800 text-center truncate w-full px-1">{leaders[0]?.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={13} className="text-yellow-400" />
              <span className="text-sm font-bold" style={{ color: '#006A4E' }}>{leaders[0]?.lifetimePoints}</span>
            </div>
            <div className="h-24 w-full rounded-t-xl mt-2" style={{ background: '#006A4E' }}></div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-14 h-14 rounded-full bg-amber-50 border-4 border-amber-600 flex items-center justify-center text-xl font-bold text-amber-700 mb-2">
              {leaders[2]?.name?.charAt(0)}
            </div>
            <span className="text-2xl mb-1">🥉</span>
            <p className="text-sm font-semibold text-gray-700 text-center truncate w-full px-1">{leaders[2]?.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="text-yellow-400" />
              <span className="text-sm font-bold text-gray-600">{leaders[2]?.lifetimePoints}</span>
            </div>
            <div className="h-10 w-full bg-amber-200 rounded-t-xl mt-2"></div>
          </div>
        </div>
      )}

      {/* My Rank Banner */}
      {myRank > 0 && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #006A4E, #004d38)' }}>
          <Trophy size={24} className="text-yellow-400" />
          <div>
            <p className="text-white/70 text-xs">আপনার অবস্থান</p>
            <p className="text-white font-bold">#{myRank} স্থানে আছেন</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/70 text-xs">আপনার পয়েন্ট</p>
            <p className="text-yellow-300 font-bold">{user?.lifetimePoints}</p>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 text-xs font-semibold text-gray-400 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="col-span-1">#</div>
          <div className="col-span-5">নাম</div>
          <div className="col-span-2 text-center">পয়েন্ট</div>
          <div className="col-span-2 text-center hidden sm:block">জমা</div>
          <div className="col-span-2 text-center hidden sm:block">সমাধান</div>
        </div>

        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-50 animate-pulse">
                <div className="col-span-1"><div className="w-8 h-8 bg-gray-100 rounded-full"></div></div>
                <div className="col-span-5"><div className="h-4 bg-gray-100 rounded w-24 mb-1"></div><div className="h-3 bg-gray-50 rounded w-16"></div></div>
                <div className="col-span-2"><div className="h-4 bg-gray-100 rounded w-12 mx-auto"></div></div>
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12">
            <Trophy size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">এখনো কোনো নাগরিক নেই</p>
          </div>
        ) : (
          <div>
            {leaders.map((leader, index) => {
              const rank = index + 1;
              const isMe = leader.id === user?.id;
              const level = LEVEL_CONFIG(leader.lifetimePoints);
              return (
                <div
                  key={leader.id}
                  className={`grid grid-cols-12 items-center px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${isMe ? 'bg-[#006A4E]/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="col-span-1">
                    <RankBadge rank={rank} />
                  </div>
                  <div className="col-span-5 pl-3">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${isMe ? 'text-[#006A4E]' : 'text-gray-800'}`}>
                        {leader.name}
                        {isMe && <span className="ml-1 text-xs text-[#006A4E] font-normal">(আপনি)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs">{level.icon}</span>
                      <span className="text-xs text-gray-400">{level.name}</span>
                      {leader.division && <span className="text-xs text-gray-400 hidden sm:inline">• {DIVISION_LABELS[leader.division] || leader.division}</span>}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={13} className="text-yellow-400" />
                      <span className="font-bold text-sm" style={{ color: isMe ? '#006A4E' : '#1F2937' }}>{leader.lifetimePoints}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center hidden sm:block">
                    <span className="text-sm text-gray-600 font-medium">{leader.submitted}</span>
                  </div>
                  <div className="col-span-2 text-center hidden sm:block">
                    <span className="text-sm text-green-600 font-medium">{leader.resolved}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Levels Guide */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4">স্তরের তালিকা</h3>
        <div className="space-y-2">
          {[
            { icon: '🌱', name: 'নতুন নাগরিক', range: '০ - ৪৯ পয়েন্ট' },
            { icon: '⭐', name: 'সক্রিয় নাগরিক', range: '৫০ - ১৪৯ পয়েন্ট' },
            { icon: '🌟', name: 'দায়িত্বশীল নাগরিক', range: '১৫০ - ২৯৯ পয়েন্ট' },
            { icon: '🏆', name: 'আদর্শ নাগরিক', range: '৩০০ - ৪৯৯ পয়েন্ট' },
            { icon: '👑', name: 'বীর নাগরিক', range: '৫০০+ পয়েন্ট' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-xl">{l.icon}</span>
              <p className="text-sm font-medium text-gray-700">{l.name}</p>
              <span className="ml-auto text-xs text-gray-400">{l.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
