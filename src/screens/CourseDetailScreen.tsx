import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/_atoms/BackButton';
import StarRating from '../components/_atoms/StarRating';
import Badge from '../components/_atoms/Badge';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useQuery } from '@tanstack/react-query';
import { fetchCourseDetail } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import { getDisplayName } from '../utils/helpers';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetail'>;

const levelVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

export default function CourseDetailScreen({ route }: Props) {
  const { slug } = route.params;
  const { t } = useTranslation();
  const { localize } = useLocale();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => fetchCourseDetail(slug),
  });
  const course = data?.data?.course;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackButton />
        <ActivityIndicator color={Colors.primary.ink} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (isError || !course) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackButton />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ink.muted} />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const totalLessons = course.modules?.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Thumbnail */}
        {course.thumbnail_url ? (
          <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumb]}>
            <Ionicons name="book-outline" size={48} color={Colors.primary[200]} />
          </View>
        )}

        {/* Main info */}
        <View style={styles.mainInfo}>
          <View style={styles.badgeRow}>
            <Badge label={t(`courses.${course.level}`)} variant={levelVariant[course.level]} />
            <Badge label={course.language.toUpperCase()} variant="neutral" />
          </View>

          <Text style={styles.title}>{localize(course.title)}</Text>

          {course.tagline && (
            <Text style={styles.tagline}>{localize(course.tagline)}</Text>
          )}

          <View style={styles.metaRow}>
            <StarRating rating={course.rating_avg ?? 0} count={course.rating_count} />
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={Colors.ink.muted} />
              <Text style={styles.metaText}>{course.enrollments_count} {t('courses.enrolled')}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.ink.muted} />
              <Text style={styles.metaText}>
                {course.duration_minutes} {t('courses.minutes')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={14} color={Colors.ink.muted} />
              <Text style={styles.metaText}>
                {course.modules?.length ?? 0} {t('courses.sections')} / {totalLessons} {t('courses.lessons')}
              </Text>
            </View>
          </View>

          <Text style={styles.instructor}>{course.psychologist ? getDisplayName(course.psychologist) : ''}</Text>

          {/* Price & CTA */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {course.displayed_price} {course.currency}
            </Text>
            <Button title={t('courses.enroll')} onPress={() => {}} size="lg" />
          </View>
        </View>

        {/* Description */}
        {course.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('psychologists.about')}</Text>
            <Text style={styles.descText}>{localize(course.description)}</Text>
          </View>
        )}

        {/* Curriculum */}
        {course.modules && course.modules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('courses.sections')}</Text>
            {course.modules.map((mod, si) => (
              <Card key={mod.id} style={styles.sectionCard}>
                <CardContent>
                  <Text style={styles.sectionName}>
                    {si + 1}. {localize(mod.title)}
                  </Text>
                  {mod.lessons.map((lesson) => (
                    <View key={lesson.id} style={styles.lessonRow}>
                      <Ionicons
                        name={lesson.is_preview ? 'play-circle-outline' : 'lock-closed-outline'}
                        size={16}
                        color={lesson.is_preview ? Colors.primary.ink : Colors.ink.muted}
                      />
                      <Text style={styles.lessonTitle}>{localize(lesson.title)}</Text>
                      <Text style={styles.lessonDuration}>{Math.round(lesson.duration_sec / 60)}m</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
  },
  thumbnail: {
    width: '100%',
    height: 220,
  },
  placeholderThumb: {
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainInfo: {
    backgroundColor: Colors.cream[50],
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  instructor: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
    fontWeight: FontWeight.medium,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  price: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
  },
  section: {
    padding: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  descText: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    lineHeight: 24,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.md,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
  },
  lessonDuration: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
  },
});
