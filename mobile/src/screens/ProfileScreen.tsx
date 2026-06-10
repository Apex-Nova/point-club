import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '../services/api';

interface Profile { id: string; username: string | null; email: string; xp: number; level: number; follower_count: number; total_drawings: number }

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
      setProfile(p as Profile);
    });
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <View style={s.header}>
          <View style={s.avatar}><Text style={s.avatarText}>{(profile?.username ?? 'U')[0].toUpperCase()}</Text></View>
          <Text style={s.name}>{profile?.username ?? 'Anonymous'}</Text>
          <Text style={s.email}>{profile?.email ?? ''}</Text>
          <View style={s.levelBadge}><Text style={s.levelText}>Level {profile?.level ?? 1}</Text></View>
        </View>

        <View style={s.stats}>
          {[
            { label: 'XP',        value: profile?.xp ?? 0 },
            { label: 'Drawings',  value: profile?.total_drawings ?? 0 },
            { label: 'Followers', value: profile?.follower_count ?? 0 },
          ].map(({ label, value }) => (
            <View key={label} style={s.stat}>
              <Text style={s.statValue}>{value.toLocaleString()}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.menu}>
          {[
            { label: 'My Drawings',   emoji: '✏️' },
            { label: 'Achievements',  emoji: '🏆' },
            { label: 'Subscription',  emoji: '👑' },
            { label: 'Settings',      emoji: '⚙️' },
          ].map(({ label, emoji }) => (
            <TouchableOpacity key={label} style={s.menuItem}>
              <Text style={s.menuEmoji}>{emoji}</Text>
              <Text style={s.menuLabel}>{label}</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#f5f0e8' },
  header:     { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e3f0' },
  avatar:     { width: 80, height: 80, borderRadius: 24, backgroundColor: '#e8e3f0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#7c5cbf' },
  name:       { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  email:      { fontSize: 13, color: '#999', marginTop: 2 },
  levelBadge: { marginTop: 10, backgroundColor: '#f0ecfa', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  levelText:  { fontSize: 12, fontWeight: '700', color: '#7c5cbf' },
  stats:      { flexDirection: 'row', backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e8e3f0', justifyContent: 'space-around' },
  stat:       { alignItems: 'center' },
  statValue:  { fontSize: 22, fontWeight: '900', color: '#1a1a2e' },
  statLabel:  { fontSize: 11, color: '#999', marginTop: 2 },
  menu:       { backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e8e3f0', overflow: 'hidden' },
  menuItem:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f0e8' },
  menuEmoji:  { fontSize: 18, marginRight: 12 },
  menuLabel:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  menuArrow:  { fontSize: 20, color: '#ccc' },
  signOutBtn: { margin: 16, marginTop: 24, padding: 14, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e8e3f0' },
  signOutText:{ fontSize: 14, fontWeight: '700', color: '#e63946' },
});
