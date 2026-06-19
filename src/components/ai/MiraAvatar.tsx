import React from 'react';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

type Props = {
  size?: number;
};

/** AI persona avatar — 1:1 port of the web MiraAvatar SVG. */
export default function MiraAvatar({ size = 48 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <RadialGradient id="mira-bg" cx="0.3" cy="0.3" r="0.9">
          <Stop offset="0%" stopColor="#FBE9D7" />
          <Stop offset="55%" stopColor="#F2C7A7" />
          <Stop offset="100%" stopColor="#E89B6F" />
        </RadialGradient>
        <LinearGradient id="mira-ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Circle cx="32" cy="32" r="30" fill="url(#mira-bg)" />
      <Circle cx="32" cy="32" r="29" fill="none" stroke="url(#mira-ring)" strokeWidth="1.5" />

      <Path d="M21 30 Q24 27.5 27 30" stroke="#3B2A20" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M37 30 Q40 27.5 43 30" stroke="#3B2A20" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M26 39 Q32 43 38 39" stroke="#3B2A20" strokeWidth="2" strokeLinecap="round" fill="none" />

      <Circle cx="50" cy="18" r="1.6" fill="#FFFFFF" opacity="0.9" />
      <Circle cx="46" cy="22" r="0.9" fill="#FFFFFF" opacity="0.7" />
    </Svg>
  );
}
