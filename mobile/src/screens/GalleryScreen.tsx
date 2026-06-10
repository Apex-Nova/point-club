import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { supabase } from '../services/api';

interface Drawing { id: string; title: string; like_count: number; author?: { username: string | null } }

export default function GalleryScreen() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading,  setLoading]  = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('drawings')
      .select('id, title, like_count, author:profiles!user_id(username)')
      .eq('is_public', true)
      .order('like_count', { ascending: false })
      .limit(30);
    setDrawings((data ?? []) as unknown as Drawing[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>🎨 Gallery</Text>
      </View>
      <FlatList
        data={drawings}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#7c5cbf" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}>
            <View style={s.thumb}><Text style={s.emoji}>🎨</Text></View>
            <View style={s.info}>
              <Text style={s.name} numberOfLines={1}>{item.title}</Text>
              <Text style={s.meta}>{item.author?.username ?? 'Artist'} · ♥ {item.like_count}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? <Text style={s.empty}>No public drawings yet</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f5f0e8' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e8e3f0' },
  title:  { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  grid:   { padding: 12, gap: 10 },
  row:    { gap: 10 },
  card:   { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e8e3f0' },
  thumb:  { height: 120, backgroundColor: '#f0ecfa', alignItems: 'center', justifyContent: 'center' },
  emoji:  { fontSize: 36 },
  info:   { padding: 10 },
  name:   { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  meta:   { fontSize: 11, color: '#999', marginTop: 2 },
  empty:  { textAlign: 'center', color: '#bbb', marginTop: 60, fontSize: 14 },
});
