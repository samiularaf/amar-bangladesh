import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে');
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
      setError(err.message || 'Google দিয়ে লগইন শুরু করা যায়নি');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #006A4E 0%, #004d38 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
            <circle cx="200" cy="200" r="180" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="200" r="140" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="200" r="60" fill="white" opacity="0.3" />
          </svg>
        </div>
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-full bg-[#F42A41] flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-white font-bold text-4xl">আ</span>
          </div>
          <h1 className="text-white text-4xl font-bold mb-3">আমার বাংলাদেশ</h1>
          <p className="text-white/80 text-xl mb-8">ছোট উদ্যোগে, বড় পরিবর্তন</p>
          <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
            {[
              { icon: '🛣️', text: 'সড়ক সমস্যা রিপোর্ট করুন' },
              { icon: '🗑️', text: 'বর্জ্য সমস্যা জানান' },
              { icon: '💧', text: 'পানি সংকট রিপোর্ট করুন' },
              { icon: '⚡', text: 'বিদ্যুৎ সমস্যা জানান' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm mt-8">একসাথে গড়ি সুন্দর বাংলাদেশ</p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#006A4E] flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-bold text-2xl">আ</span>
            </div>
            <h1 className="text-[#006A4E] text-2xl font-bold">আমার বাংলাদেশ</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">স্বাগতম!</h2>
            <p className="text-gray-500 mb-6">আপনার অ্যাকাউন্টে লগইন করুন</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
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
              অথবা ইমেইল দিয়ে লগইন করুন
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল লিখুন"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:border-transparent text-sm pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
                style={{ background: '#006A4E' }}
              >
                <LogIn size={18} />
                {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              অ্যাকাউন্ট নেই?{' '}
              <Link to="/register" className="text-[#006A4E] font-semibold hover:underline">নিবন্ধন করুন</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
