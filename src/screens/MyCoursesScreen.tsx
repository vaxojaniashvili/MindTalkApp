import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/_atoms/Badge';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchMyEnrollments } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import { getDisplayName } from '../utils/helpers';
import { SkeletonCard } from '../components/customs/Skeleton';
import type { RootStackParamList, EnrollmentCard } from '../types';

const levelVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'terracotta'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'terracotta',
};

export default function MyCoursesScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: fetchMyEnrollments,
    enabled: isAuth,
  });

  const enrollments = data?.data?.enrollments ?? [];

  const renderItem = useCallback(
    ({ item }: { item: EnrollmentCard }) => {
      const title = localize(item.course.title);
      const psychName = item.psychologist ? getDisplayName(item.psychologist) : '';
      const isCompleted = !!item.completed_at;
      const progress = item.progress_percent;

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CoursePlayer', { slug: item.course.slug })}
        >
          <Card style={styles.card}>
            {/* Thumbnail */}
            {item.course.thumbnail_url ? (
              <Image
                source={{ uri: item.course.thumbnail_url }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="book-outline" size={36} color={Colors.sand[600]} />
              </View>
            )}

            <CardContent>
              {/* Level badge + completion */}
              <View style={styles.badgeRow}>
                <Badge
                  label={t(`courses.${item.course.level}`)}
                  variant={levelVariant[item.course.level] ?? 'neutral'}
                />
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={styles.completedText}>{t('courses.completed')}</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={styles.courseTitle} numberOfLines={2}>
                {title}
              </Text>

              {/* Psychologist */}
              {psychName ? (
                <Text style={styles.psychName} numberOfLines={1}>
                  {psychName}
                </Text>
              ) : null}

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>

              {/* Certificate serial */}
              {item.certificate_serial ? (
                <View style={styles.certRow}>
                  <Ionicons name="ribbon-outline" size={16} color={Colors.primary[500]} />
                  <Text style={styles.certText}>
                    {t('courses.certificate')}: {item.certificate_serial}
                  </Text>
                </View>
              ) : null}
            </CardContent>
          </Card>
        </TouchableOpacity>
      );
    },
    [localize, navigation, t],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dashboard.myCourses')}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ink.muted} />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} size="sm" variant="outline" />
        </View>
      ) : (
        <FlatList
          data={enrollments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={Colors.ink.muted} />
              <Text style={styles.emptyTitle}>{t('myCourses.empty')}</Text>
              <Button
                title={t('courses.browseCourses')}
                onPress={() => navigation.goBack()}
                size="sm"
                variant="outline"
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  list: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  completedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.success,
  },
  courseTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  psychName: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.cream[300],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[400],
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary.ink,
    minWidth: 36,
    textAlign: 'right',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  certText: {
    fontSize: FontSize.sm,
    color: Colors.primary[500],
    fontWeight: FontWeight.medium,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
  },
  emptyState: {
    minHeight: 260,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ink[20],
    backgroundColor: Colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(243,227,181,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
});
