import React, { useEffect, useState } from 'react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Clock, Users, CheckCircle, Star, Play, Award, Plus, Save, X, Trash2 } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  'Civic Awareness': { color: '#7C3AED', bg: '#F5F3FF', label: 'নাগরিক সচেতনতা', emoji: '🏛️' },
  'Environment': { color: '#059669', bg: '#ECFDF5', label: 'পরিবেশ', emoji: '🌿' },
  'Technology': { color: '#2563EB', bg: '#EFF6FF', label: 'প্রযুক্তি', emoji: '💻' },
  'Infrastructure': { color: '#D97706', bg: '#FFFBEB', label: 'অবকাঠামো', emoji: '🏗️' },
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  'Beginner': { label: 'সহজ', color: '#059669' },
  'Intermediate': { label: 'মাঝারি', color: '#D97706' },
  'Advanced': { label: 'উন্নত', color: '#DC2626' },
};

const BLANK_COURSE = { title: '', titleEn: '', description: '', category: 'Civic Awareness', duration: '', difficulty: 'Beginner', lessons: '', instructor: '' };

export default function Courses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState(BLANK_COURSE);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Load courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await api.enrollCourse(courseId);
      showToast('✅ কোর্সে ভর্তি হয়েছেন! +৫ পয়েন্ট পেয়েছেন');
      loadCourses();
    } catch (err: any) {
      showToast(err.message || 'ভর্তি ব্যর্থ হয়েছে', 'error');
    } finally {
      setEnrolling(null);
    }
  };

  const handleComplete = async (courseId: string) => {
    setCompleting(courseId);
    try {
      await api.completeCourse(courseId);
      showToast('🎉 কোর্স সম্পন্ন! +২০ পয়েন্ট পেয়েছেন');
      loadCourses();
    } catch (err: any) {
      showToast(err.message || 'সম্পন্ন করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.createAdminCourse({ ...newCourse, lessons: parseInt(newCourse.lessons) || 10, enrolledCount: 0 });
      showToast('✅ কোর্স যোগ হয়েছে!');
      setNewCourse(BLANK_COURSE);
      setShowAddForm(false);
      loadCourses();
    } catch (err: any) {
      showToast(err.message || 'কোর্স যোগ ব্যর্থ', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('এই কোর্সটি মুছে ফেলতে চান?')) return;
    setDeletingId(courseId);
    try {
      await api.deleteCourse(courseId);
      showToast('✅ কোর্স মুছে ফেলা হয়েছে');
      loadCourses();
    } catch {
      showToast('মুছতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = ['', ...Object.keys(CATEGORY_CONFIG)];
  const filtered = activeCategory ? courses.filter(c => c.category === activeCategory) : courses;

  const enrolledCount = courses.filter(c => c.enrolled).length;
  const completedCount = courses.filter(c => c.completed).length;

  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">কোর্সসমূহ</h1>
          <p className="text-gray-500 text-sm">
            {isAdmin ? 'সকল কোর্সের সারসংক্ষেপ ও ব্যবস্থাপনা' : 'নাগরিক সচেতনতা বৃদ্ধির জন্য কোর্স করুন ও পয়েন্ট পান'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors"
            style={{ background: showAddForm ? '#DC2626' : '#006A4E' }}
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'বাতিল' : 'কোর্স যোগ করুন'}
          </button>
        )}
      </div>

      {/* Admin Add Course Form */}
      {isAdmin && showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#006A4E]/20 p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-[#006A4E]" />
            নতুন কোর্স যোগ করুন
          </h3>
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">কোর্সের নাম (বাংলা) <span className="text-red-500">*</span></label>
                <input type="text" value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} placeholder="বাংলায় কোর্সের নাম" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ <span className="text-red-500">*</span></label>
                <textarea value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} placeholder="কোর্সের বিস্তারিত বিবরণ" rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm resize-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিভাগ</label>
                <select value={newCourse.category} onChange={e => setNewCourse(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm bg-white">
                  <option value="Civic Awareness">নাগরিক সচেতনতা</option>
                  <option value="Environment">পরিবেশ</option>
                  <option value="Technology">প্রযুক্তি</option>
                  <option value="Infrastructure">অবকাঠামো</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">কঠিনতা</label>
                <select value={newCourse.difficulty} onChange={e => setNewCourse(p => ({ ...p, difficulty: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm bg-white">
                  <option value="Beginner">সহজ</option>
                  <option value="Intermediate">মাঝারি</option>
                  <option value="Advanced">উন্নত</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সময়কাল</label>
                <input type="text" value={newCourse.duration} onChange={e => setNewCourse(p => ({ ...p, duration: e.target.value }))} placeholder="যেমন: ৪ ঘন্টা" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পাঠ সংখ্যা</label>
                <input type="number" value={newCourse.lessons} onChange={e => setNewCourse(p => ({ ...p, lessons: e.target.value }))} placeholder="পাঠের সংখ্যা" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm" min="1" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষকের নাম</label>
                <input type="text" value={newCourse.instructor} onChange={e => setNewCourse(p => ({ ...p, instructor: e.target.value }))} placeholder="শিক্ষকের পূর্ণ নাম ও পদবি" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm" />
              </div>
            </div>
            <button type="submit" disabled={adding} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium disabled:opacity-60" style={{ background: '#006A4E' }}>
              <Save size={16} />
              {adding ? 'যোগ হচ্ছে...' : 'কোর্স সংরক্ষণ করুন'}
            </button>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-[#006A4E]">{courses.length}</p>
          <p className="text-xs text-gray-500 mt-1">মোট কোর্স</p>
        </div>
        {isAdmin ? (
          <>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-blue-600">{courses.reduce((s, c) => s + (c.enrolledCount || 0), 0)}</p>
              <p className="text-xs text-gray-500 mt-1">মোট ভর্তি</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-purple-600">{Object.keys(CATEGORY_CONFIG).length}</p>
              <p className="text-xs text-gray-500 mt-1">বিভাগ</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-blue-600">{enrolledCount}</p>
              <p className="text-xs text-gray-500 mt-1">ভর্তি হয়েছেন</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-purple-600">{completedCount}</p>
              <p className="text-xs text-gray-500 mt-1">সম্পন্ন করেছেন</p>
            </div>
          </>
        )}
      </div>

      {/* Points Guide — users only */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-[#006A4E] to-[#004d38] rounded-2xl p-4 mb-6 text-white">
          <div className="flex items-center gap-3 flex-wrap">
            <Star size={20} className="text-yellow-300" />
            <p className="font-semibold">পয়েন্ট সিস্টেম:</p>
            <span className="bg-white/20 rounded-full px-3 py-1 text-xs">ভর্তি = +৫ পয়েন্ট</span>
            <span className="bg-white/20 rounded-full px-3 py-1 text-xs">সম্পন্ন = +২০ পয়েন্ট</span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map(cat => {
          const config = cat ? CATEGORY_CONFIG[cat] : null;
          return (
            <button
              key={cat || 'all'}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === cat ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              style={activeCategory === cat ? { background: config?.color || '#006A4E' } : {}}
            >
              {config?.emoji} {config?.label || 'সকল'}
            </button>
          );
        })}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-4"></div>
              <div className="h-9 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">কোনো কোর্স পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(course => {
            const cat = CATEGORY_CONFIG[course.category];
            const diff = DIFFICULTY_LABELS[course.difficulty];
            const isEnrolled = course.enrolled;
            const isCompleted = course.completed;

            return (
              <div
                key={course.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isAdmin ? 'border-gray-100' :
                  isCompleted ? 'border-green-200' : isEnrolled ? 'border-blue-200' : 'border-gray-100 hover:border-[#006A4E]/30'
                }`}
              >
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat?.emoji}</span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: cat?.color, background: cat?.bg }}>
                        {cat?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isAdmin && isCompleted && (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Award size={12} />
                          <span className="text-xs font-medium">সম্পন্ন</span>
                        </div>
                      )}
                      {!isAdmin && isEnrolled && !isCompleted && (
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <Play size={12} />
                          <span className="text-xs font-medium">চলমান</span>
                        </div>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={deletingId === course.id}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="কোর্স মুছুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-2">{course.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{course.description}</p>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <BookOpen size={11} />
                      {course.lessons}টি পাঠ
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={11} />
                      {(course.enrolledCount || 0).toLocaleString()}জন ভর্তি
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: diff?.color, background: diff?.color + '20' }}>
                      {diff?.label}
                    </span>
                  </div>
                  {course.instructor && <p className="text-xs text-gray-400 mt-2">শিক্ষক: {course.instructor}</p>}
                </div>

                {/* Progress Bar (enrolled users only) */}
                {!isAdmin && isEnrolled && (
                  <div className="px-5 pb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>অগ্রগতি</span>
                      <span>{isCompleted ? '100%' : '0%'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-green-500 rounded-full transition-all" style={{ width: isCompleted ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                )}

                {/* Action Button — users only */}
                {!isAdmin && (
                  <div className="px-5 pb-5">
                    {isCompleted ? (
                      <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium text-green-700 bg-green-50 border border-green-200 flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        কোর্স সম্পন্ন ✓
                      </div>
                    ) : isEnrolled ? (
                      <button
                        onClick={() => handleComplete(course.id)}
                        disabled={completing === course.id}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: '#2563EB' }}
                      >
                        <CheckCircle size={16} />
                        {completing === course.id ? 'সম্পন্ন হচ্ছে...' : 'কোর্স সম্পন্ন করুন (+২০ পয়েন্ট)'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: '#006A4E' }}
                      >
                        <Play size={16} />
                        {enrolling === course.id ? 'ভর্তি হচ্ছে...' : 'ভর্তি হন (+৫ পয়েন্ট)'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
