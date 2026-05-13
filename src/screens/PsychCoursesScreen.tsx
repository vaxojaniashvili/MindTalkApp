import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/_atoms/Badge';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import Skeleton, { SkeletonCard } from '../components/customs/Skeleton';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useLocale } from '../hooks/useLocale';
import { fetchMyPsychCourses } from '../api/endpoints';
import type { RootStackParamList, CourseCard } from '../types';

type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'terracotta'> = {
  draft: 'neutral',
  pending_review: 'warning',
  published: 'success',
  archived: 'neutral',
};

export default function PsychCoursesScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-psych-courses'],
    queryFn: () => fetchMyPsychCourses(),
    enabled: isAuth,
  });

  const courses = data?.data?.data ?? [];

  const stats = useMemo(() => {
    let draft = 0;
    let inReview = 0;
    let published = 0;
    for (const c of courses) {
      const status = (c as CourseCard & { status?: CourseStatus }).status;
      if (status === 'draft') draft++;
      else if (status === 'pending_review') inReview++;
      else if (status === 'published') published++;
    }
    return { draft, inReview, published };
  }, [courses]);

  const renderStatCard = (label: string, count: number, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderCourse = ({ item }: { item: any }) => {
    const status: CourseStatus = item.status || 'draft';
    const variant = statusBadgeVariant[status] ?? 'neutral';

    return (
      <Card style={styles.courseCard}>
        <CardContent>
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {localize(item.title)}
            </Text>
            <Badge
              label={t(`psychCourses.status.${status}`)}
              variant={variant}
            />
          </View>

          <View style={styles.courseDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={Colors.ink.muted} />
              <Text style={styles.detailText}>
                {item.enrollments_count ?? 0} {t('psychCourses.enrollments')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={16} color={Colors.ink.muted} />
              <Text style={styles.detailText}>
                {item.displayed_price ?? item.base_price} {item.currency}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('psychCourses.title')}</Text>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: Spacing.xl }}>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
            <Skeleton height={20} style={{ flex: 1 }} />
            <Skeleton height={20} style={{ flex: 1 }} />
            <Skeleton height={20} style={{ flex: 1 }} />
          </View>
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
          data={courses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              {renderStatCard(t('psychCourses.draft'), stats.draft, 'document-outline', Colors.ink.muted)}
              {renderStatCard(t('psychCourses.inReview'), stats.inReview, 'hourglass-outline', Colors.warning)}
              {renderStatCard(t('psychCourses.published'), stats.published, 'checkmark-circle-outline', Colors.success)}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={48} color={Colors.ink.muted} />
              <Text style={styles.emptyTitle}>{t('psychologist.noCourses', 'No courses yet')}</Text>
              <Text style={styles.emptySubtitle}>{t('psychCourses.emptySubtitle')}</Text>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statCount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
  },
  statLabel: {
    fontSize: FontSize['2xs'],
    color: Colors.ink.muted,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  courseCard: {
    marginBottom: Spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  courseTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.2,
  },
  courseDetails: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
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
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
});
