import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const DIVISIONS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];

const DIVISION_LABELS: Record<string, string> = {
  Dhaka: 'ঢাকা', Chattogram: 'চট্টগ্রাম', Rajshahi: 'রাজশাহী',
  Khulna: 'খুলনা', Barishal: 'বরিশাল', Sylhet: 'সিলেট',
  Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ'
};

export default function Register() {
  const { register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', division: '', district: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('পাসওয়ার্ড মিলছে না'); return; }
    if (form.password.length < 6) { setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'); return; }
    setLoading(true);
    try {
      const result = await register({ name: form.name, email: form.email, password: form.password, division: form.division, district: form.district, phone: form.phone });
      if (result.requiresEmailConfirmation) setConfirmationSent(true);
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google দিয়ে নিবন্ধন শুরু করা যায়নি');
      setLoading(false);
    }
  };

  const requirements = [
    { label: 'কমপক্ষে ৬ অক্ষর', met: form.password.length >= 6 },
    { label: 'পাসওয়ার্ড মিলছে', met: form.password === form.confirmPassword && form.confirmPassword.length > 0 },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center p-12" style={{ background: 'linear-gradient(135deg, #006A4E 0%, #004d38 100%)' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#F42A41] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-white font-bold text-3xl">আ</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-3">আমার বাংলাদেশ</h1>
          <p className="text-white/80 text-lg mb-8">নাগরিক সমস্যা সমাধানের প্ল্যাটফর্ম</p>
          <div className="space-y-4 text-left max-w-xs">
            {[
              { icon: '🏆', title: 'পয়েন্ট অর্জন করুন', desc: 'সমস্যা রিপোর্ট করে পয়েন্ট পান' },
              { icon: '📚', title: 'কোর্স করুন', desc: 'নাগরিক সচেতনতা বৃদ্ধি করুন' },
              { icon: '🤝', title: 'একসাথে সমাধান', desc: 'পরিবর্তন আনুন আপনার এলাকায়' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-white/70 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#006A4E] flex items-center justify-center mx-auto mb-2 shadow-lg">
              <span className="text-white font-bold text-2xl">আ</span>
            </div>
            <h1 className="text-[#006A4E] text-xl font-bold">আমার বাংলাদেশ</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">নতুন অ্যাকাউন্ট</h2>
            <p className="text-gray-500 text-sm mb-6">আজই যোগ দিন এবং পরিবর্তন আনুন</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {confirmationSent && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
                নিবন্ধন সফল হয়েছে। আপনার ইমেইলে পাঠানো ভেরিফিকেশন লিংকে ক্লিক করে তারপর লগইন করুন।
              </div>
            )}

            <button
              type="button" onClick={handleGoogleSignIn} disabled={loading}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-medium flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-60 mb-5"
            >
              <span className="font-bold text-lg" style={{ color: '#4285F4' }}>G</span>
              Google দিয়ে চালিয়ে যান
            </button>

            <div className="flex items-center gap-3 mb-5 text-xs text-gray-400">
              <div className="h-px bg-gray-200 flex-1" />
              অথবা ইমেইল দিয়ে নিবন্ধন করুন
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">পূর্ণ নাম <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={form.name} onChange={e => update('name', e.target.value)}
                    placeholder="আপনার পূর্ণ নাম"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল <span className="text-red-500">*</span></label>
                  <input
                    type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                      placeholder="পাসওয়ার্ড"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span></label>
                  <input
                    type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                    placeholder="পুনরায় পাসওয়ার্ড"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm"
                    required
                  />
                </div>
                {form.password && (
                  <div className="sm:col-span-2 flex gap-4">
                    {requirements.map((r, i) => (
                      <div key={i} className={`flex items-center gap-1 text-xs ${r.met ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle size={12} className={r.met ? 'text-green-500' : 'text-gray-300'} />
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিভাগ</label>
                  <select
                    value={form.division} onChange={e => update('division', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm bg-white"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{DIVISION_LABELS[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জেলা</label>
                  <input
                    type="text" value={form.district} onChange={e => update('district', e.target.value)}
                    placeholder="জেলার নাম"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                    placeholder="০১XXXXXXXXX"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 mt-2"
                style={{ background: '#006A4E' }}
              >
                <UserPlus size={18} />
                {loading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link to="/login" className="text-[#006A4E] font-semibold hover:underline">লগইন করুন</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
