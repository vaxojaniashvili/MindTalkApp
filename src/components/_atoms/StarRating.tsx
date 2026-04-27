import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight } from '../../constants/theme';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

// Website: fill-sand-500 text-sand-500 for filled, text-ink-muted for count
export default function StarRating({ rating, count, size = 14, showCount = true }: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Ionicons key={i} name="star" size={size} color={Colors.sand[500]} />);
    } else if (i - 0.5 <= rating) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color={Colors.sand[500]} />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color={Colors.cream[300]} />);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.stars}>{stars}</View>
      {showCount && count !== undefined && (
        <Text style={[styles.count, { fontSize: size - 2 }]}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  count: {
    marginLeft: 4,
    fontSize: 12,
    color: Colors.ink.muted,
  },
});
