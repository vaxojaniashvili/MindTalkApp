import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CourseCardItem from '../components/_molecules/CourseCardItem';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchCourses } from '../api/endpoints';
import type { CourseCard } from '../types';

const levels = ['beginner', 'intermediate', 'advanced'] as const;

export default function CoursesScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['courses', search, selectedLevel],
      queryFn: ({ pageParam = 1 }) =>
        fetchCourses({
          page: pageParam,
          search: search || undefined,
          level: selectedLevel || undefined,
          per_page: 10,
        }),
      getNextPageParam: (lastPage) => {
        const meta = lastPage.data.meta;
        return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
      },
      initialPageParam: 1,
    });

  const courses = data?.pages.flatMap((p) => p.data.data) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: CourseCard }) => <CourseCardItem item={item} />,
    [],
  );

  const ListHeader = (
    <View>
      {/* Hero */}
      <View style={styles.heroArea}>
        <Text style={styles.eyebrow}>{t('courses.title').toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{t('courses.title')}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.ink.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('courses.searchPlaceholder')}
          placeholderTextColor={Colors.ink.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.ink.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Level pills */}
      <View style={styles.levelRow}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.levelChip, selectedLevel === level && styles.levelChipActive]}
            onPress={() => setSelectedLevel((prev) => (prev === level ? null : level))}
          >
            <Text
              style={[
                styles.levelChipText,
                selectedLevel === level && styles.levelChipTextActive,
              ]}
            >
              {t(`courses.${level}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={courses}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={Colors.primary.ink} style={styles.loader} />
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={Colors.primary.ink} size="large" style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={28} color={Colors.sand[600]} />
              </View>
              <Text style={styles.emptyTitle}>{t('common.noResults')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  list: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  heroArea: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[50],
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  levelChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ink[15],
    backgroundColor: Colors.cream[50],
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  levelChipActive: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  levelChipText: {
    fontSize: 12.5,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  levelChipTextActive: {
    color: Colors.cream[50],
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
  loader: {
    paddingVertical: Spacing['3xl'],
  },
});
