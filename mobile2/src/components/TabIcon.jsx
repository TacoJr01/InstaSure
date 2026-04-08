import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import { colors } from '../theme';

const ACTIVE_COLORS = {
  home: colors.coral,
  shield: colors.blue,
  activity: colors.amber,
  wallet: colors.green,
  person: colors.purple,
};

export default function TabIcon({ name, focused }) {
  const color = focused ? ACTIVE_COLORS[name] : colors.faint;
  const size = 22;

  const icons = {
    home: (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <Rect x="8" y="13" width="6" height="7" rx="1"/>
      </Svg>
    ),
    shield: (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M11 2l7.5 3.5V11c0 4.5-3.5 7.5-7.5 8.5C3.5 18.5 3 15 3 11V5.5L11 2z"/>
      </Svg>
    ),
    activity: (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="4" y="13" width="3" height="6" rx="1"/>
        <Rect x="9.5" y="8" width="3" height="11" rx="1"/>
        <Rect x="15" y="4" width="3" height="15" rx="1"/>
      </Svg>
    ),
    wallet: (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="6" width="18" height="13" rx="2"/>
        <Path d="M2 10h18"/>
        <Circle cx="6" cy="14" r="1" fill={color}/>
        <Line x1="10" y1="14" x2="16" y2="14"/>
      </Svg>
    ),
    person: (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="11" cy="8" r="3.5"/>
        <Path d="M3 19c0-4 3.6-7 8-7s8 3 8 7"/>
      </Svg>
    ),
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {icons[name]}
    </View>
  );
}
