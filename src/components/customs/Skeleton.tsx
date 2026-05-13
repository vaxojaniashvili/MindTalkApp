import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.cream[300],
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Pre-built skeleton layouts ───

export function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      <Skeleton height={140} borderRadius={BorderRadius.md} />
      <View style={skStyles.cardBody}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="90%" height={12} style={{ marginTop: Spacing.sm }} />
        <Skeleton width="40%" height={12} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={skStyles.listItem}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={skStyles.listItemText}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={12} style={{ marginTop: Spacing.xs }} />
      </View>
    </View>
  );
}

export function SkeletonBalanceCard() {
  return (
    <View style={skStyles.balanceCard}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="50%" height={28} style={{ marginTop: Spacing.sm }} />
    </View>
  );
}

export function SkeletonProfileHeader() {
  return (
    <View style={skStyles.profileHeader}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width="50%" height={18} style={{ marginTop: Spacing.md }} />
      <Skeleton width="30%" height={14} style={{ marginTop: Spacing.sm }} />
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cardBody: {
    padding: Spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemText: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
});
