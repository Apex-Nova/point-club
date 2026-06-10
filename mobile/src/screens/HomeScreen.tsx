import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { supabase } from '../services/api';

interface Drawing { id: string; title: string; like_count: number }

export default function HomeScreen({ navigation }: { navigation: unknown }) {
  const [user,     setUser]     = useState<{ email?: string } | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [refresh,  setRefresh]  = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    const { data } = await supabase.from('drawings')
      .select('id, title, like_count').eq('is_public', true)
      .order('like_count', { ascending: false }).limit(20);
    setDrawings((data ?? []) as Drawing[]);
  };

  const onRefresh = async () => { setRefresh(true); await loadDrawings(); setRefresh(false); };

  const nav = navigation as { navigate: (s: string) => void };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor="#7c5cbf" />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>✏️ Point Club</Text>
          <TouchableOpacity onPress={() => nav.navigate('Profile')} style={s.avatarBtn}>
            <View style={s.avatar}><Text style={s.avatarText}>
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Text></View>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={s.quickActions}>
          {[
            { label: 'New Drawing', emoji: '✏️', screen: 'Draw',    bg: '#7c5cbf' },
            { label: 'Gallery',     emoji: '🎨', screen: 'Gallery', bg: '#e63946' },
            { label: 'Challenges',  emoji: '⚡', screen: 'Draw',    bg: '#f4a261' },
          ].map(({ label, emoji, screen, bg }) => (
            <TouchableOpacity key={label} style={[s.quickBtn, { backgroundColor: bg }]}
              onPress={() => nav.navigate(screen)}>
              <Text style={s.quickEmoji}>{emoji}</Text>
              <Text style={s.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent public drawings */}
        <Text style={s.sectionTitle}>Trending Drawings</Text>
        {drawings.map(d => (
          <TouchableOpacity key={d.id} style={s.drawingRow}>
            <View style={s.drawingThumb}><Text style={s.drawingEmoji}>🎨</Text></View>
            <View style={s.drawingInfo}>
              <Text style={s.drawingTitle} numberOfLines={1}>{d.title}</Text>
              <Text style={s.drawingMeta}>♥ {d.like_count}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {drawings.length === 0 && <Text style={s.empty}>No public drawings yet</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f5f0e8' },
  scroll:       { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e8e3f0' },
  logo:         { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  avatarBtn:    {},
  avatar:       { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e8e3f0', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 14, fontWeight: '700', color: '#7c5cbf' },
  quickActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  quickBtn:     { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 4 },
  quickEmoji:   { fontSize: 20 },
  quickLabel:   { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 8, marginBottom: 8 },
  drawingRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#ffffff', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: '#e8e3f0' },
  drawingThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f0ecfa', alignItems: 'center', justifyContent: 'center' },
  drawingEmoji: { fontSize: 22 },
  drawingInfo:  { flex: 1 },
  drawingTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  drawingMeta:  { fontSize: 11, color: '#999', marginTop: 2 },
  empty:        { textAlign: 'center', color: '#bbb', marginTop: 32, fontSize: 14 },
});
