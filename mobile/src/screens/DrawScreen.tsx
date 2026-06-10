import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, PanResponder, type GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Stroke { d: string; color: string; width: number }
interface Point  { x: number; y: number }

function pointsToPath(points: Point[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i];
    const cx = (prev.x + curr.x) / 2, cy = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${cx} ${cy}`;
  }
  return d;
}

const COLORS = ['#1a1a1a', '#e63946', '#2a9d8f', '#457b9d', '#7b2d8b', '#f4a261', '#ffffff'];

export default function DrawScreen({ navigation }: { navigation: unknown }) {
  const [strokes,     setStrokes]     = useState<Stroke[]>([]);
  const [activePoints, setActivePoints] = useState<Point[]>([]);
  const [color,       setColor]       = useState('#1a1a1a');
  const [brushSize,   setBrushSize]   = useState(4);
  const isDrawing = useRef(false);
  const nav = navigation as { goBack?: () => void };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e: GestureResponderEvent) => {
      isDrawing.current = true;
      const { locationX: x, locationY: y } = e.nativeEvent;
      setActivePoints([{ x, y }]);
    },
    onPanResponderMove: (e: GestureResponderEvent) => {
      if (!isDrawing.current) return;
      const { locationX: x, locationY: y } = e.nativeEvent;
      setActivePoints(prev => [...prev, { x, y }]);
    },
    onPanResponderRelease: () => {
      isDrawing.current = false;
      setStrokes(prev => [...prev, {
        d: pointsToPath(activePoints), color, width: brushSize,
      }]);
      setActivePoints([]);
    },
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={s.header}>
        {nav.goBack && (
          <TouchableOpacity onPress={nav.goBack} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={s.title}>New Drawing</Text>
        <TouchableOpacity onPress={() => setStrokes([])} style={s.clearBtn}>
          <Text style={s.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={s.canvas} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {strokes.map((stroke, i) => (
            <Path key={i} d={stroke.d} stroke={stroke.color} strokeWidth={stroke.width}
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
          {activePoints.length > 0 && (
            <Path d={pointsToPath(activePoints)} stroke={color} strokeWidth={brushSize}
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
          )}
        </Svg>
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        <View style={s.colors}>
          {COLORS.map(c => (
            <TouchableOpacity key={c} onPress={() => setColor(c)}
              style={[s.colorBtn, { backgroundColor: c, borderColor: color === c ? '#7c5cbf' : '#e0e0e0', transform: [{ scale: color === c ? 1.2 : 1 }] }]} />
          ))}
        </View>
        <View style={s.sizes}>
          {[2, 4, 8, 14].map(sz => (
            <TouchableOpacity key={sz} onPress={() => setBrushSize(sz)} style={[s.sizeBtn, brushSize === sz && s.sizeBtnActive]}>
              <View style={[s.sizeDot, { width: sz * 1.5, height: sz * 1.5, backgroundColor: color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f5f0e8' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e3f0' },
  backBtn:     { padding: 6 },
  backText:    { fontSize: 18, color: '#888' },
  title:       { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  clearBtn:    { padding: 6 },
  clearText:   { fontSize: 13, color: '#e63946', fontWeight: '600' },
  canvas:      { flex: 1, backgroundColor: '#ffffff', margin: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e8e3f0' },
  toolbar:     { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e8e3f0', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  colors:      { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  colorBtn:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  sizes:       { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  sizeBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  sizeBtnActive: { backgroundColor: '#f0ecfa', borderColor: '#7c5cbf' },
  sizeDot:     { borderRadius: 999 },
});
