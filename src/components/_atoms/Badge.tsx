import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'terracotta';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

// Website uses rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700
const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primary[50], text: Colors.primary[700] },
  success: { bg: 'rgba(59,128,77,0.1)', text: Colors.success },
  warning: { bg: 'rgba(143,107,37,0.1)', text: Colors.warning },
  danger: { bg: 'rgba(176,74,62,0.1)', text: Colors.danger },
  neutral: { bg: Colors.ink[5], text: Colors.ink.soft },
  terracotta: { bg: Colors.terracotta[50], text: Colors.terracotta[700] },
};

export default function Badge({ label, variant = 'primary' }: BadgeProps) {
  const v = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
});
