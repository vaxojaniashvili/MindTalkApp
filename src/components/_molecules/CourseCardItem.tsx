import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import StarRating from '../_atoms/StarRating';
import Badge from '../_atoms/Badge';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme';
import { useLocale } from '../../hooks/useLocale';
import { getDisplayName } from '../../utils/helpers';
import type { CourseCard, RootStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';

interface Props {
  item: CourseCard;
}

const levelVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

export default function CourseCardItem({ item }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { localize } = useLocale();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CourseDetail', { slug: item.slug })}
    >
      {/* Thumbnail */}
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumb]}>
          <Ionicons name="book-outline" size={36} color={Colors.primary[200]} />
        </View>
      )}

      <View style={styles.body}>
        {/* Level & Language */}
        <View style={styles.badgeRow}>
          <Badge label={t(`courses.${item.level}`)} variant={levelVariant[item.level]} />
          <Badge label={item.language.toUpperCase()} variant="neutral" />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {localize(item.title)}
        </Text>

        {item.tagline && (
          <Text style={styles.tagline} numberOfLines={1}>
            {localize(item.tagline)}
          </Text>
        )}

        <StarRating rating={item.rating_avg ?? 0} count={item.rating_count} size={12} />

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={Colors.ink.muted} />
            <Text style={styles.metaText}>{item.enrollments_count}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.ink.muted} />
            <Text style={styles.metaText}>{item.duration_minutes} {t('courses.minutes')}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.instructor}>{item.psychologist ? getDisplayName(item.psychologist) : ''}</Text>
          <View style={styles.footerRight}>
            <Text style={styles.price}>
              {item.displayed_price}{' '}
              <Text style={styles.currency}>{item.currency}</Text>
            </Text>
            <View style={styles.arrowBtn}>
              <Ionicons name="arrow-forward" size={14} color={Colors.ink.soft} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  placeholderThumb: {
    backgroundColor: Colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    color: Colors.ink.soft,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.ink.muted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
    marginTop: Spacing.xs,
  },
  instructor: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
  currency: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ink[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
