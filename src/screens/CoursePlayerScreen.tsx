import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchEnrollmentPlayer, trackLessonProgress } from '../api/endpoints';
import Skeleton, { SkeletonListItem } from '../components/customs/Skeleton';
import { useLocale } from '../hooks/useLocale';
import type { RootStackParamList, PlayerLessonData, PlayerModuleData } from '../types';

type LessonIconName = 'play-circle' | 'document-text' | 'help-circle' | 'document';

const lessonTypeIcon: Record<string, LessonIconName> = {
  video: 'play-circle',
  text: 'document-text',
  quiz: 'help-circle',
  pdf: 'document',
};

export default function CoursePlayerScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CoursePlayer'>>();
  const { slug } = route.params;
  const queryClient = useQueryClient();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrollment-player', slug],
    queryFn: () => fetchEnrollmentPlayer(slug),
    enabled: isAuth,
  });

  const course = data?.data?.course;
  const enrollment = data?.data?.enrollment;
  const modules = course?.modules ?? [];

  // Flatten all lessons for navigation
  const allLessons = useMemo(() => {
    return modules.flatMap((m) => m.lessons);
  }, [modules]);

  // Set initial active lesson
  const activeLesson = useMemo(() => {
    if (activeLessonId) {
      return allLessons.find((l) => l.id === activeLessonId) ?? null;
    }
    // Default: first incomplete lesson, or first lesson
    const firstIncomplete = allLessons.find((l) => !l.completed);
    return firstIncomplete ?? allLessons[0] ?? null;
  }, [activeLessonId, allLessons]);

  const currentIndex = activeLesson ? allLessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;

  // Overall progress
  const completedCount = allLessons.filter((l) => l.completed).length;
  const totalCount = allLessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleMarkComplete = useCallback(async () => {
    if (!activeLesson) return;
    try {
      setMarkingComplete(true);
      await trackLessonProgress(slug, activeLesson.id, activeLesson.duration_sec);
      queryClient.invalidateQueries({ queryKey: ['enrollment-player', slug] });
    } catch {
      Alert.alert(t('common.error'), t('courses.markCompleteError'));
    } finally {
      setMarkingComplete(false);
    }
  }, [activeLesson, slug, queryClient, t]);

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      setActiveLessonId(allLessons[currentIndex - 1].id);
    }
  }, [hasPrevious, allLessons, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setActiveLessonId(allLessons[currentIndex + 1].id);
    }
  }, [hasNext, allLessons, currentIndex]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Skeleton width="40%" height={18} />
          <View style={styles.backBtn} />
        </View>
        <View style={{ paddingHorizontal: Spacing['2xl'] }}>
          <Skeleton height={6} borderRadius={3} style={{ marginBottom: Spacing.xl }} />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !course) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('courses.player')}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ink.muted} />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} size="sm" variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {localize(course.title)}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Overall progress bar */}
      <View style={styles.overallProgress}>
        <View style={styles.overallProgressBar}>
          <View style={[styles.overallProgressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.overallProgressText}>
          {completedCount}/{totalCount} ({progressPercent}%)
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Empty state */}
        {allLessons.length === 0 && (
          <View style={styles.centered}>
            <Ionicons name="school-outline" size={48} color={Colors.ink.muted} />
            <Text style={styles.errorText}>{t('courses.noLessons', 'No lessons available')}</Text>
          </View>
        )}

        {/* Active lesson content area */}
        {activeLesson && (
          <Card style={styles.contentCard}>
            <CardContent>
              <View style={styles.contentHeader}>
                <Ionicons
                  name={lessonTypeIcon[activeLesson.type] ?? 'document'}
                  size={24}
                  color={Colors.primary[500]}
                />
                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{localize(activeLesson.title)}</Text>
                  <Text style={styles.contentMeta}>
                    {t(`courses.lessonType.${activeLesson.type}`)} - {formatDuration(activeLesson.duration_sec)}
                  </Text>
                </View>
                {activeLesson.completed && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                )}
              </View>

              {/* Placeholder content area */}
              <View style={styles.contentPlaceholder}>
                <Ionicons
                  name={lessonTypeIcon[activeLesson.type] ?? 'document'}
                  size={48}
                  color={Colors.ink.muted}
                />
                <Text style={styles.placeholderText}>
                  {t('courses.contentPlaceholder')}
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Module / Lesson list */}
        {modules.map((module: PlayerModuleData, moduleIndex: number) => (
          <View key={module.id} style={styles.moduleSection}>
            <Text style={styles.moduleTitle}>
              {t('courses.module')} {moduleIndex + 1}: {localize(module.title)}
            </Text>
            {module.lessons.map((lesson: PlayerLessonData) => {
              const isActive = activeLesson?.id === lesson.id;
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[styles.lessonRow, isActive && styles.lessonRowActive]}
                  onPress={() => setActiveLessonId(lesson.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={lessonTypeIcon[lesson.type] ?? 'document'}
                    size={20}
                    color={isActive ? Colors.primary[500] : Colors.ink.muted}
                  />
                  <View style={styles.lessonInfo}>
                    <Text
                      style={[styles.lessonTitle, isActive && styles.lessonTitleActive]}
                      numberOfLines={1}
                    >
                      {localize(lesson.title)}
                    </Text>
                    <Text style={styles.lessonDuration}>
                      {formatDuration(lesson.duration_sec)}
                    </Text>
                  </View>
                  {lesson.completed && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>

      {/* Bottom actions */}
      {activeLesson && (
        <View style={styles.bottomBar}>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navBtn, !hasPrevious && styles.navBtnDisabled]}
              onPress={handlePrevious}
              disabled={!hasPrevious}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={hasPrevious ? Colors.ink.DEFAULT : Colors.ink.muted}
              />
              <Text style={[styles.navBtnText, !hasPrevious && styles.navBtnTextDisabled]}>
                {t('courses.previous')}
              </Text>
            </TouchableOpacity>

            {!activeLesson.completed && (
              <Button
                title={t('courses.markComplete')}
                onPress={handleMarkComplete}
                size="sm"
                loading={markingComplete}
                icon={<Ionicons name="checkmark" size={16} color={Colors.cream[50]} />}
              />
            )}

            <TouchableOpacity
              style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
              onPress={handleNext}
              disabled={!hasNext}
            >
              <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>
                {t('courses.next')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={hasNext ? Colors.ink.DEFAULT : Colors.ink.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
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
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  overallProgress: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  overallProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.cream[300],
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary[400],
    borderRadius: 3,
  },
  overallProgressText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    minWidth: 70,
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
  },
  contentCard: {
    marginBottom: Spacing.xl,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.3,
  },
  contentMeta: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginTop: 2,
  },
  contentPlaceholder: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream[100],
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  placeholderText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    textAlign: 'center',
  },
  moduleSection: {
    marginBottom: Spacing.xl,
  },
  moduleTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  lessonRowActive: {
    backgroundColor: Colors.primary[50],
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  lessonTitleActive: {
    color: Colors.primary[800],
    fontWeight: FontWeight.semibold,
  },
  lessonDuration: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    marginTop: 2,
  },
  bottomBar: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cream[50],
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  navBtnTextDisabled: {
    color: Colors.ink.muted,
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
});
