import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, Upload, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileById, updateProfile, uploadAvatar, type FullProfile } from '@/lib/services/profile.service';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

const INTERESTS = ['Abstract', 'Portraits', 'Landscapes', 'Anime', 'Comics', 'Illustration', 'UI/UX', 'Architecture', 'Fantasy', 'Sci-Fi'];

export default function EditProfilePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { toasts, addToast, removeToast } = useToasts();

  const [profile,  setProfile]  = useState<FullProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const [username,   setUsername]   = useState('');
  const [bio,        setBio]        = useState('');
  const [interests,  setInterests]  = useState<string[]>([]);
  const [twitter,    setTwitter]    = useState('');
  const [instagram,  setInstagram]  = useState('');
  const [website,    setWebsite]    = useState('');

  useEffect(() => {
    if (!user) return;
    getProfileById(user.id).then(p => {
      if (p) {
        setProfile(p);
        setUsername(p.username ?? '');
        setBio(p.bio ?? '');
        setInterests(p.drawing_interests ?? []);
        setTwitter((p.social_links?.twitter as string) ?? '');
        setInstagram((p.social_links?.instagram as string) ?? '');
        setWebsite((p.social_links?.website as string) ?? '');
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        username:          username.trim() || null,
        bio:               bio.trim() || null,
        drawing_interests: interests,
        social_links: {
          twitter:   twitter.trim() || null,
          instagram: instagram.trim() || null,
          website:   website.trim() || null,
        },
      });
      addToast('Profile saved!', 'success');
      if (username.trim()) navigate(`/profile/${username.trim()}`);
    } catch {
      addToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await updateProfile({ avatar_url: url });
      setProfile(p => p ? { ...p, avatar_url: url } : p);
      addToast('Avatar updated!', 'success');
    } catch {
      addToast('Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-lavender border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-16">
      {/* Header */}
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20 px-6 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
            <Pencil size={13} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Edit Profile</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Profile Picture</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl border-2 border-cream-dark overflow-hidden bg-lavender-light flex items-center justify-center shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-lavender-dark">{(username || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-cream-dark text-sm font-semibold text-gray-600 hover:border-lavender transition-colors">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading…' : 'Upload Photo'}
              </motion.div>
            </label>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Basic Info</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700 placeholder-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell the community about yourself…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700 placeholder-gray-400 transition-colors resize-none" />
          </div>
        </div>

        {/* Drawing interests */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Drawing Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(i => (
              <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => toggleInterest(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  interests.includes(i)
                    ? 'bg-lavender text-white'
                    : 'bg-cream border border-cream-dark text-gray-500 hover:border-lavender/50'
                }`}>
                {i}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Social Links</h2>
          {[
            { label: 'Twitter / X', placeholder: '@username', value: twitter, setter: setTwitter },
            { label: 'Instagram',   placeholder: '@username', value: instagram, setter: setInstagram },
            { label: 'Website',     placeholder: 'https://…',  value: website, setter: setWebsite },
          ].map(({ label, placeholder, value, setter }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
              <input value={value} onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700 placeholder-gray-400 transition-colors" />
            </div>
          ))}
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Privacy Settings</h2>
          <p className="text-xs text-gray-400">Advanced privacy controls coming in Phase 6.</p>
        </div>

        {/* Save */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-lavender text-white font-semibold flex items-center justify-center gap-2 hover:bg-lavender-dark transition-colors disabled:opacity-60 shadow-md"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </motion.button>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
