import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

interface TrustBadgeProps {
  level: 'L0' | 'L1' | 'L2' | 'L3';
  compact?: boolean;
}

const badgeConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  L1: { icon: 'shield-checkmark', label: 'L1', color: Colors.primary[400] },
  L2: { icon: 'checkmark-circle', label: 'L2', color: Colors.primary.ink },
  L3: { icon: 'sparkles', label: 'L3', color: Colors.sand[500] },
};

export default function TrustBadge({ level, compact = false }: TrustBadgeProps) {
  if (!level || level === 'L0') return null;
  const config = badgeConfig[level];
  if (!config) return null;

  if (compact) {
    return <Ionicons name={config.icon} size={16} color={config.color} />;
  }

  return (
    <View style={[styles.badge, { backgroundColor: level === 'L3' ? Colors.sand[50] : Colors.primary[50] }]}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
