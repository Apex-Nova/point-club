import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, BookOpen, Award, Zap, Loader2, CheckCircle, Star } from 'lucide-react';
import { getCourses, getCertifications, enrollCourse, type Course, type Certification } from '@/lib/services/learn.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

const CATEGORIES = ['all','drawing','color','design','concept_art','collaboration','ai'];
const LEVELS     = ['all','beginner','intermediate','advanced','expert'];

const LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-mint/30 text-emerald-600',
  intermediate: 'bg-sky/20 text-sky-600',
  advanced:     'bg-peach/30 text-orange-500',
  expert:       'bg-coral/20 text-coral-dark',
};

const TYPE_EMOJI: Record<string, string> = {
  course: '📚', workshop: '🛠️', tutorial: '📖', challenge: '⚡',
};

function CourseCard({ course, enrolled, onEnroll, index }: {
  course: Course; enrolled: boolean; onEnroll: () => void; index: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -3 }}
      className="bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-32 bg-gradient-to-br from-lavender/20 to-coral/10 flex items-center justify-center relative">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-4xl">{TYPE_EMOJI[course.type] ?? '📚'}</span>
        }
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full capitalize">
          {course.type}
        </span>
        {enrolled && (
          <span className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-mint/80">
            <CheckCircle size={13} className="text-emerald-700" />
          </span>
        )}
      </div>
      <div className="p-4">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize mb-2 inline-block ${LEVEL_COLOR[course.level]}`}>
          {course.level}
        </span>
        <h3 className="text-sm font-bold text-gray-800 mb-1 leading-snug">{course.title}</h3>
        {course.description && (
          <p className="text-[11px] text-gray-400 mb-3 line-clamp-2 leading-snug">{course.description}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
          <span className="flex items-center gap-0.5"><Clock size={9} /> {course.duration_min}m</span>
          <span className="flex items-center gap-0.5"><BookOpen size={9} /> {course.lesson_count} lessons</span>
          <span className="flex items-center gap-0.5"><Star size={9} className="fill-orange-400 text-orange-400" /> +{course.xp_reward} XP</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">
            {course.price_cents === 0 ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}
          </span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onEnroll}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              enrolled
                ? 'bg-mint/30 text-emerald-700 hover:bg-mint/50'
                : 'bg-lavender text-white hover:bg-lavender-dark'
            }`}>
            {enrolled ? 'Continue' : 'Enroll'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function CertCard({ cert }: { cert: Certification }) {
  const earned = Boolean(cert.earned_at);
  return (
    <motion.div whileHover={{ y: -2 }}
      className={`bg-white rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${earned ? 'border-lavender' : 'border-cream-dark opacity-60 grayscale'}`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: cert.badge_color + '20' }}>
        {cert.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-700">{cert.title}</p>
        {cert.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{cert.description}</p>}
        {earned && <p className="text-[10px] text-lavender-dark mt-1 font-semibold">✓ Earned</p>}
      </div>
    </motion.div>
  );
}

export default function LearnPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [courses,  setCourses]  = useState<Course[]>([]);
  const [certs,    setCerts]    = useState<Certification[]>([]);
  const [category, setCategory] = useState('all');
  const [level,    setLevel]    = useState('all');
  const [tab,      setTab]      = useState<'courses' | 'certifications'>('courses');
  const [loading,  setLoading]  = useState(true);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCourses({ category: category === 'all' ? undefined : category, level: level === 'all' ? undefined : level }),
      user ? getCertifications(user.id) : getCertifications(),
    ]).then(([c, ce]) => {
      setCourses(c);
      setCerts(ce);
      setLoading(false);
    });
  }, [category, level, user]);

  const handleEnroll = async (courseId: string) => {
    if (!user) { addToast('Sign in to enroll', 'info'); return; }
    try {
      await enrollCourse(courseId);
      setEnrolled(prev => new Set([...prev, courseId]));
      addToast('Enrolled! Good luck on your learning journey 🎓', 'success');
    } catch {
      addToast('Already enrolled or error', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lavender to-coral flex items-center justify-center">
                <GraduationCap size={13} className="text-white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Learning Hub</span>
            </div>
          </div>
          {user && (
            <Link to="/analytics" className="flex items-center gap-1.5 text-sm text-lavender-dark font-semibold hover:underline">
              <Award size={13} /> My Progress
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-lavender-dark to-coral rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/10 translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-white mb-2">
              Grow as a Creator
            </h2>
            <p className="text-white/80 mb-4">Free courses, workshops, and AI-assisted learning paths.</p>
            <div className="flex items-center gap-4 text-[13px] text-white/70">
              <span className="flex items-center gap-1.5"><BookOpen size={13} /> {courses.length} courses</span>
              <span className="flex items-center gap-1.5"><Zap size={13} /> Earn XP & certificates</span>
              <span className="flex items-center gap-1.5"><GraduationCap size={13} /> AI-assisted learning</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-cream-dark mb-6 w-fit">
          {(['courses', 'certifications'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'bg-lavender text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'courses' ? `📚 Courses` : `🎓 Certifications`}
            </button>
          ))}
        </div>

        {tab === 'courses' && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                      category === c ? 'bg-lavender text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-lavender/50'
                    }`}>{c.replace(/_/g,' ')}</button>
                ))}
              </div>
              <div className="flex gap-1">
                {LEVELS.map(l => (
                  <button key={l} onClick={() => setLevel(l)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                      level === l ? 'bg-coral text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-coral/50'
                    }`}>{l}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-lavender-dark animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {courses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i}
                    enrolled={enrolled.has(course.id)}
                    onEnroll={() => void handleEnroll(course.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'certifications' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.map(cert => <CertCard key={cert.id} cert={cert} />)}
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
