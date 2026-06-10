import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { supabase } from '../services/api';

interface Notification { id: string; type: string; title: string; message: string | null; is_read: boolean; created_at: string }

const TYPE_EMOJI: Record<string, string> = {
  friend_request: '🤝', friend_accepted: '✅', room_invite: '🚪',
  mention: '@', follow: '⭐', achievement: '🏆', tip: '💜', default: '🔔',
};

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: n } = await supabase.from('notifications')
        .select('*').eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false }).limit(30);
      setNotifs((n ?? []) as Notification[]);
    });
  }, []);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>🔔 Notifications</Text></View>
      <FlatList
        data={notifs}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.item, !item.is_read && s.unread]} onPress={() => markRead(item.id)}>
            <View style={s.icon}><Text>{TYPE_EMOJI[item.type] ?? TYPE_EMOJI.default}</Text></View>
            <View style={s.info}>
              <Text style={s.itemTitle}>{item.title}</Text>
              {item.message && <Text style={s.itemMsg} numberOfLines={2}>{item.message}</Text>}
            </View>
            {!item.is_read && <View style={s.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>No notifications yet</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#f5f0e8' },
  header:    { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e8e3f0' },
  title:     { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  list:      { padding: 12, gap: 8 },
  item:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e8e3f0' },
  unread:    { backgroundColor: '#f8f5ff', borderColor: '#c9baec' },
  icon:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0ecfa', alignItems: 'center', justifyContent: 'center' },
  info:      { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  itemMsg:   { fontSize: 12, color: '#888', marginTop: 2 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7c5cbf', marginTop: 4 },
  empty:     { textAlign: 'center', color: '#bbb', marginTop: 60, fontSize: 14 },
});
