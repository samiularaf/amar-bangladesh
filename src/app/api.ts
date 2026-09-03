import { supabase } from './supabase';

const fail = (error: { message?: string } | null) => { if (error) throw new Error(error.message); };
const ensureUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  fail(error);
  if (!data.user) throw new Error('অনুমোদন নেই — আবার লগইন করুন');
  return data.user;
};
const mapProfile = (profile: any) => ({ id: profile.id, name: profile.name, email: profile.email, role: profile.role, points: profile.current_points ?? profile.points, lifetimePoints: profile.lifetime_points ?? profile.points, division: profile.division, district: profile.district, phone: profile.phone, suspended: profile.suspended, createdAt: profile.created_at });

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  fail(error);
  if (!data.user) throw new Error('লগইন ব্যর্থ হয়েছে');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  fail(profileError);
  if (profile.suspended) { await supabase.auth.signOut(); throw new Error('এই অ্যাকাউন্টটি স্থগিত করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।'); }
  return { user: mapProfile(profile) };
};
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  fail(error);
};
export const register = async (input: { name: string; email: string; password: string; division?: string; district?: string; phone?: string }) => {
  const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { name: input.name, division: input.division || '', district: input.district || '', phone: input.phone || '' } } });
  fail(error); return { requiresEmailConfirmation: !data.session };
};
export const getMe = async () => {
  const user = await ensureUser();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  fail(error); if (data.suspended) throw new Error('এই অ্যাকাউন্টটি স্থগিত করা হয়েছে'); return mapProfile(data);
};
export const logout = async () => { const { error } = await supabase.auth.signOut(); fail(error); return { ok: true }; };

export const getProblems = async (params?: { category?: string; status?: string; myOnly?: boolean }) => {
  const user = await ensureUser(); const { data, error } = await supabase.rpc('problem_with_counts'); fail(error);
  return (data || []).filter((p: any) => (!params?.myOnly || p.user_id === user.id) && (!params?.category || p.category === params.category) && (!params?.status || p.status === params.status)).map((p: any) => ({ ...p, userId: p.user_id, userName: p.user_name, solveMethod: p.solve_method, organizationId: p.organization_id, adminNote: p.admin_note, imagePath: p.image_path, imageUrl: p.image_path ? supabase.storage.from('problem-images').getPublicUrl(p.image_path).data.publicUrl : null, createdAt: p.created_at, updatedAt: p.updated_at, upvotedBy: p.upvoted_by || [] })).sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt));
};
export const getProblem = async (id: string) => { const problem = (await getProblems()).find((item: any) => item.id === id); if (!problem) throw new Error('সমস্যা পাওয়া যায়নি'); return problem; };
export const submitProblem = async (input: { title: string; description: string; category: string; solveMethod: string; organizationId?: string; location?: string; division?: string; district?: string; imageFile?: File | null }) => {
  const user = await ensureUser();
  let imagePath: string | null = null;
  if (input.imageFile) {
    const extension = input.imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('problem-images').upload(imagePath, input.imageFile, { contentType: input.imageFile.type, upsert: false });
    fail(uploadError);
  }
  const { data, error } = await supabase.from('problems').insert({ user_id: user.id, title: input.title, description: input.description, category: input.category, solve_method: input.solveMethod, organization_id: input.organizationId || null, location: input.location || '', division: input.division || '', district: input.district || '', image_path: imagePath }).select().single(); fail(error); return { problem: data, pointsEarned: 10 };
};
export const updateProblem = async (id: string, input: Partial<{ status: string; adminNote: string; title: string; description: string }>) => {
  const changes: any = {}; if (input.status !== undefined) changes.status = input.status; if (input.adminNote !== undefined) changes.admin_note = input.adminNote; if (input.title !== undefined) changes.title = input.title; if (input.description !== undefined) changes.description = input.description;
  const { data, error } = await supabase.from('problems').update(changes).eq('id', id).select().single(); fail(error); return data;
};
export const upvoteProblem = async (id: string) => {
  const user = await ensureUser(); const { data: existing, error: findError } = await supabase.from('problem_upvotes').select('problem_id').eq('problem_id', id).eq('user_id', user.id).maybeSingle(); fail(findError);
  let upvoted = false;
  if (existing) { const { error } = await supabase.from('problem_upvotes').delete().eq('problem_id', id).eq('user_id', user.id); fail(error); }
  else { const { error } = await supabase.from('problem_upvotes').insert({ problem_id: id, user_id: user.id }); fail(error); upvoted = true; }
  const { data: all, error } = await supabase.from('problem_upvotes').select('user_id').eq('problem_id', id); fail(error); return { upvotes: all?.length || 0, upvoted };
};

export const getCourses = async () => {
  const user = await ensureUser(); const [{ data: courses, error: coursesError }, { data: enrollments, error: enrollmentError }] = await Promise.all([supabase.from('courses').select('*').order('created_at'), supabase.from('enrollments').select('*').eq('user_id', user.id)]); fail(coursesError); fail(enrollmentError);
  return (courses || []).map((course: any) => { const enrollment = (enrollments || []).find((item: any) => item.course_id === course.id); return { ...course, titleEn: course.title_en, enrollmentCost: course.enrollment_cost, completionReward: course.completion_reward || 0, durationMinutes: course.duration_minutes, durationHours: (course.duration_minutes || 120) / 60, enrolledCount: 0, enrolled: !!enrollment, completed: enrollment?.completed || false, progressSeconds: enrollment?.progress_seconds || 0 }; });
};
export const getCourse = async (id: string) => { const course = (await getCourses()).find((item: any) => item.id === id); if (!course) throw new Error('কোর্স পাওয়া যায়নি'); return course; };
export const enrollCourse = async (id: string) => { const { error } = await supabase.rpc('enroll_in_course', { course_uuid: id }); fail(error); return { ok: true }; };
export const saveCourseProgress = async (id: string, progressSeconds: number) => { const { data, error } = await supabase.rpc('record_course_progress', { course_uuid: id, seconds_watched: Math.floor(progressSeconds) }); fail(error); return data; };
export const completeCourse = async (id: string) => saveCourseProgress(id, Number.MAX_SAFE_INTEGER);
export const getMyEnrollments = async () => { const user = await ensureUser(); const { data, error } = await supabase.from('enrollments').select('*, courses(*)').eq('user_id', user.id); fail(error); return (data || []).map((item: any) => ({ ...item, course: item.courses })); };
export const getLeaderboard = async () => { const { data, error } = await supabase.from('profiles').select('*').neq('role', 'admin').order('lifetime_points', { ascending: false }).limit(20); fail(error); return (data || []).map(mapProfile); };

export const getAdminStats = async () => {
  const [problems, profiles, courses, enrollments] = await Promise.all([getProblems(), supabase.from('profiles').select('id, role'), supabase.from('courses').select('id'), supabase.from('enrollments').select('id')]); fail(profiles.error); fail(courses.error); fail(enrollments.error);
  const count = (status: string) => problems.filter((p: any) => p.status === status).length;
  return { totalProblems: problems.length, totalUsers: (profiles.data || []).filter((u: any) => u.role !== 'admin').length, totalCourses: (courses.data || []).length, totalEnrollments: (enrollments.data || []).length, problemsByStatus: { pending: count('pending'), in_progress: count('in_progress'), resolved: count('resolved'), rejected: count('rejected') }, categoryStats: problems.reduce((all: any, p: any) => ({ ...all, [p.category]: (all[p.category] || 0) + 1 }), {}) };
};
export const getAdminUsers = async () => { const [{ data: profiles, error: profilesError }, problems, { data: enrollments, error: enrollmentError }] = await Promise.all([supabase.from('profiles').select('*').neq('role', 'admin'), getProblems(), supabase.from('enrollments').select('user_id')]); fail(profilesError); fail(enrollmentError); return (profiles || []).map((profile: any) => ({ ...mapProfile(profile), problemCount: problems.filter((p: any) => p.userId === profile.id).length, enrollmentCount: (enrollments || []).filter((e: any) => e.user_id === profile.id).length })); };
const coursePayload = (input: any) => ({ title: input.title, title_en: input.titleEn || '', description: input.description, category: input.category, duration: `${input.durationHours || 2} ঘন্টা`, duration_minutes: Math.max(1, Number(input.durationHours || 2) * 60), enrollment_cost: Math.max(0, Number(input.enrollmentCost || 0)), completion_reward: Math.max(0, Number(input.completionReward || 0)), difficulty: input.difficulty, lessons: Number(input.lessons) || 1, instructor: input.instructor || '' });
export const createAdminCourse = async (input: any) => { const { data, error } = await supabase.from('courses').insert(coursePayload(input)).select().single(); fail(error); return data; };
export const updateAdminCourse = async (id: string, input: any) => { const { data, error } = await supabase.from('courses').update(coursePayload(input)).eq('id', id).select().single(); fail(error); return data; };
export const deleteCourse = async (id: string) => { const { error } = await supabase.from('courses').delete().eq('id', id); fail(error); return { ok: true }; };
export const suspendUser = async (id: string) => { const { error } = await supabase.from('profiles').update({ suspended: true }).eq('id', id); fail(error); return { ok: true }; };
export const reactivateUser = async (id: string) => { const { error } = await supabase.from('profiles').update({ suspended: false }).eq('id', id); fail(error); return { ok: true }; };
export const getOrganizations = async () => { const { data, error } = await supabase.from('organizations').select('*').order('name'); fail(error); return (data || []).map((item: any) => ({ ...item, shortName: item.short_name })); };
export const addOrganization = async (input: { id: string; name: string; shortName: string; categories: string[] }) => { const { data, error } = await supabase.from('organizations').insert({ id: input.id, name: input.name, short_name: input.shortName, categories: input.categories }).select().single(); fail(error); return data; };
export const deleteOrganization = async (id: string) => { const { error } = await supabase.from('organizations').delete().eq('id', id); fail(error); return { ok: true }; };
