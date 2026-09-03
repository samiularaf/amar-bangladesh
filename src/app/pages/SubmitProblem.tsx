import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { CheckCircle, ArrowLeft, ArrowRight, Send, Star, AlertCircle, Camera, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'Road', icon: '🛣️', label: 'সড়ক', desc: 'রাস্তার গর্ত, ভাঙা সড়ক, যানজট', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { id: 'Garbage', icon: '🗑️', label: 'বর্জ্য', desc: 'অবৈধ ডাম্পিং, অপরিষ্কার এলাকা', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'Water', icon: '💧', label: 'পানি', desc: 'পানি সংকট, পানির লাইন সমস্যা', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'Electricity', icon: '⚡', label: 'বিদ্যুৎ', desc: 'লোডশেডিং, বিদ্যুৎ লাইন সমস্যা', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'Other', icon: '📋', label: 'অন্যান্য', desc: 'অন্য যেকোনো ধরনের সমস্যা', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
];

const ORGANIZATIONS: Record<string, { id: string; name: string }[]> = {
  Road: [
    { id: 'DNCC', name: 'ঢাকা উত্তর সিটি কর্পোরেশন (DNCC)' },
    { id: 'DSCC', name: 'ঢাকা দক্ষিণ সিটি কর্পোরেশন (DSCC)' },
    { id: 'RHD', name: 'সড়ক ও জনপথ অধিদফতর (RHD)' },
    { id: 'BRTA', name: 'বাংলাদেশ রোড ট্রান্সপোর্ট অথরিটি (BRTA)' },
  ],
  Garbage: [
    { id: 'DNCC', name: 'ঢাকা উত্তর সিটি কর্পোরেশন (DNCC)' },
    { id: 'DSCC', name: 'ঢাকা দক্ষিণ সিটি কর্পোরেশন (DSCC)' },
    { id: 'DoE', name: 'পরিবেশ অধিদফতর (DoE)' },
  ],
  Water: [
    { id: 'WASA', name: 'ঢাকা ওয়াসা (DWASA)' },
    { id: 'DPHE', name: 'জনস্বাস্থ্য প্রকৌশল অধিদফতর (DPHE)' },
  ],
  Electricity: [
    { id: 'DESCO', name: 'ঢাকা ইলেকট্রিক সাপ্লাই কোম্পানি (DESCO)' },
    { id: 'DPDC', name: 'ঢাকা পাওয়ার ডিস্ট্রিবিউশন (DPDC)' },
    { id: 'BREB', name: 'বাংলাদেশ রুরাল ইলেকট্রিফিকেশন (BREB)' },
  ],
  Other: [
    { id: 'DNCC', name: 'ঢাকা উত্তর সিটি কর্পোরেশন (DNCC)' },
    { id: 'DSCC', name: 'ঢাকা দক্ষিণ সিটি কর্পোরেশন (DSCC)' },
    { id: 'LGRD', name: 'স্থানীয় সরকার পল্লী উন্নয়ন (LGRD)' },
    { id: 'DC', name: 'জেলা প্রশাসক অফিস (DC Office)' },
  ],
};

const DIVISIONS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];
const DIV_LABELS: Record<string, string> = { Dhaka: 'ঢাকা', Chattogram: 'চট্টগ্রাম', Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Barishal: 'বরিশাল', Sylhet: 'সিলেট', Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ' };

const STEPS = ['বিভাগ নির্বাচন', 'সমস্যার বিবরণ', 'সমাধান পদ্ধতি', 'নিশ্চিত করুন'];

export default function SubmitProblem() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preCategory = (location.state as any)?.preCategory;

  const [step, setStep] = useState(preCategory ? 1 : 0);
  const [form, setForm] = useState({
    category: preCategory || '',
    title: '',
    description: '',
    location: '',
    division: user?.division || '',
    district: user?.district || '',
    solveMethod: 'organization' as 'own' | 'organization',
    organizationId: '',
  });
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ছবির সাইজ ৫MB এর কম হতে হবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
  };

  const canNext = () => {
    if (step === 0) return !!form.category;
    if (step === 1) return form.title.trim().length >= 5 && form.description.trim().length >= 20;
    if (step === 2) return form.solveMethod === 'own' || !!form.organizationId;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.submitProblem(form);
      setSuccess(result);
      // Update user points in context
      if (user) setUser({ ...user, points: user.points + 10 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">সমস্যা জমা হয়েছে!</h2>
          <p className="text-gray-500 mb-4">আপনার সমস্যাটি সফলভাবে রেকর্ড করা হয়েছে।</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Star size={20} className="text-yellow-500" />
              <span className="text-yellow-800 font-bold text-lg">+{success.pointsEarned} পয়েন্ট অর্জিত!</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">আপনার মোট পয়েন্ট: {(user?.points || 0)}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/problems', { state: { myOnly: true } })} className="flex-1 border border-[#006A4E] text-[#006A4E] py-3 rounded-xl font-medium hover:bg-[#006A4E]/5 transition-colors">
              আমার সমস্যা দেখুন
            </button>
            <button onClick={() => { setSuccess(null); setStep(0); setForm({ category: '', title: '', description: '', location: '', division: user?.division || '', district: user?.district || '', solveMethod: 'organization', organizationId: '' }); setImageFile(null); }} className="flex-1 text-white py-3 rounded-xl font-medium transition-colors" style={{ background: '#006A4E' }}>
              নতুন সমস্যা জানান
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">সমস্যা জানান</h1>
        <p className="text-gray-500 text-sm mt-1">আপনার এলাকার সমস্যা রিপোর্ট করুন</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i < step ? 'bg-[#006A4E] text-white' : i === step ? 'bg-[#006A4E] text-white ring-4 ring-[#006A4E]/20' : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium hidden sm:block ${i === step ? 'text-[#006A4E]' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${i < step ? 'bg-[#006A4E]' : 'bg-gray-200'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">সমস্যার বিভাগ নির্বাচন করুন</h2>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => update('category', cat.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    form.category === cat.id ? 'shadow-md scale-[1.02]' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={form.category === cat.id ? { borderColor: cat.color, background: cat.bg } : {}}
                >
                  <span className="text-4xl mb-3 block">{cat.icon}</span>
                  <p className="font-bold text-gray-800">{cat.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">সমস্যার বিবরণ দিন</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">সমস্যার শিরোনাম <span className="text-red-500">*</span></label>
              <input
                type="text" value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="সংক্ষেপে সমস্যার নাম লিখুন (কমপক্ষে ৫ অক্ষর)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/100 অক্ষর</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত বিবরণ <span className="text-red-500">*</span></label>
              <textarea
                value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="সমস্যাটি বিস্তারিত বর্ণনা করুন (কমপক্ষে ২০ অক্ষর)"
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{form.description.length} অক্ষর (কমপক্ষে ২০)</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">সমস্যার ছবি <span className="text-gray-400">(ঐচ্ছিক)</span></label>
              {!imageFile ? (
                <label className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#006A4E] hover:bg-[#006A4E]/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                  <Camera size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-600">ছবি যোগ করতে ক্লিক করুন</span>
                  <span className="text-xs text-gray-400">সর্বোচ্চ ৫MB (JPG, PNG, WEBP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img src={imageFile} alt="সমস্যার ছবি" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                  <button
                    onClick={removeImage}
                    type="button"
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">সঠিক অবস্থান</label>
              <input
                type="text" value={form.location} onChange={e => update('location', e.target.value)}
                placeholder="রাস্তার নাম, এলাকা, মাইলস্টোন ইত্যাদি"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিভাগ</label>
                <select value={form.division} onChange={e => update('division', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm bg-white">
                  <option value="">নির্বাচন করুন</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{DIV_LABELS[d]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">জেলা</label>
                <input type="text" value={form.district} onChange={e => update('district', e.target.value)} placeholder="জেলার নাম" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E] text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Solve Method */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">সমাধানের পদ্ধতি নির্বাচন করুন</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => { update('solveMethod', 'own'); update('organizationId', ''); }}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${form.solveMethod === 'own' ? 'border-[#006A4E] bg-[#006A4E]/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-3xl block mb-3">🙋</span>
                <p className="font-bold text-gray-800">নিজে সমাধান করব</p>
                <p className="text-xs text-gray-500 mt-1">আপনি নিজে বা স্বেচ্ছাসেবীদের সাথে মিলে সমাধান করবেন</p>
                <div className="mt-3 text-xs text-green-600 font-medium">✓ বেশি পয়েন্ট পাওয়ার সুযোগ</div>
              </button>
              <button
                onClick={() => update('solveMethod', 'organization')}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${form.solveMethod === 'organization' ? 'border-[#006A4E] bg-[#006A4E]/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-3xl block mb-3">🏛️</span>
                <p className="font-bold text-gray-800">সংস্থার মাধ্যমে সমাধান</p>
                <p className="text-xs text-gray-500 mt-1">সরকারি সংস্থা বা প্রতিষ্ঠান সমাধান করবে</p>
                <div className="mt-3 text-xs text-blue-600 font-medium">✓ দ্রুত সমাধানের সম্ভাবনা</div>
              </button>
            </div>

            {form.solveMethod === 'organization' && form.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">সংস্থা নির্বাচন করুন <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {ORGANIZATIONS[form.category]?.map(org => (
                    <button
                      key={org.id}
                      onClick={() => update('organizationId', org.id)}
                      className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-all duration-200 ${
                        form.organizationId === org.id ? 'border-[#006A4E] bg-[#006A4E]/5 text-[#006A4E] font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {form.organizationId === org.id ? '✓ ' : '○ '}{org.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">সমস্যার বিবরণ নিশ্চিত করুন</h2>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div className="space-y-3">
              {[
                { label: 'বিভাগ', value: `${CATEGORIES.find(c => c.id === form.category)?.icon} ${CATEGORIES.find(c => c.id === form.category)?.label}` },
                { label: 'শিরোনাম', value: form.title },
                { label: 'বিবরণ', value: form.description },
                { label: 'অবস্থান', value: form.location || 'উল্লেখ নেই' },
                { label: 'বিভাগ/জেলা', value: `${DIV_LABELS[form.division] || form.division || 'উল্লেখ নেই'} / ${form.district || 'উল্লেখ নেই'}` },
                { label: 'সমাধান পদ্ধতি', value: form.solveMethod === 'own' ? '🙋 নিজে সমাধান করব' : `🏛️ ${ORGANIZATIONS[form.category]?.find(o => o.id === form.organizationId)?.name || 'সংস্থার মাধ্যমে'}` },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500 text-sm w-32 flex-shrink-0">{item.label}:</span>
                  <span className="text-gray-800 text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {imageFile && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">সংযুক্ত ছবি:</p>
                <img src={imageFile} alt="সমস্যার ছবি" className="w-full max-h-64 object-contain rounded-xl border border-gray-200" />
              </div>
            )}

            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-yellow-500" />
                <span className="text-green-800 font-medium text-sm">জমা দিলে +১০ পয়েন্ট পাবেন!</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={16} />
              পূর্ববর্তী
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#006A4E' }}
            >
              পরবর্তী
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-60"
              style={{ background: '#006A4E' }}
            >
              <Send size={16} />
              {loading ? 'জমা হচ্ছে...' : 'সমস্যা জমা দিন'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
