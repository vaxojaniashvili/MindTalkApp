import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'terracotta' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

// Matches website button.tsx CVA variants exactly
const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary.ink, text: Colors.cream[50] },
  secondary: { bg: Colors.sand.DEFAULT, text: Colors.ink.DEFAULT },
  ghost: { bg: 'transparent', text: Colors.ink.DEFAULT },
  outline: { bg: 'transparent', text: Colors.ink.DEFAULT, border: Colors.ink[15] },
  terracotta: { bg: Colors.terracotta[600], text: Colors.cream[50] },
  destructive: { bg: Colors.danger, text: Colors.cream[50] },
};

// Matches website h-10/h-12/h-14 + px sizes
const sizeStyles: Record<Size, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 40, paddingH: 16, fontSize: FontSize.sm },
  md: { height: 48, paddingH: 24, fontSize: FontSize.base },
  lg: { height: 56, paddingH: 32, fontSize: FontSize.base },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.paddingH,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: v.text, fontSize: s.fontSize },
              icon ? { marginLeft: Spacing.sm } : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: FontWeight.medium,
    letterSpacing: -0.15,
  },
});
