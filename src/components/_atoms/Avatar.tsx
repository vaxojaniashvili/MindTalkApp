import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, FontWeight } from '../../constants/theme';

interface AvatarProps {
  uri: string | null;
  name: string;
  size?: number;
}

export default function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  // Matches website fallback: bg-primary-ink font-serif text-cream-50
  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.cream[300],
  },
  placeholder: {
    backgroundColor: Colors.primary.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.cream[50],
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.5,
  },
});
