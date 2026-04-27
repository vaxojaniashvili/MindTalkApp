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
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import PsychCardItem from '../components/_molecules/PsychCardItem';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { fetchPsychologists, fetchSpecializations } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import type { PsychCard, Specialization } from '../types';

export default function PsychologistsScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const { data: specData } = useQuery({
    queryKey: ['specializations'],
    queryFn: fetchSpecializations,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['psychologists', search, selectedSpec],
    queryFn: ({ pageParam = 1 }) =>
      fetchPsychologists({
        page: pageParam,
        search: search || undefined,
        specialization: selectedSpec || undefined,
        per_page: 10,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.data.meta;
      return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const specializations = specData?.data?.data ?? [];
  const psychologists = data?.pages.flatMap((p) => p.data.data) ?? [];

  const handleSpecPress = (slug: string) => {
    setSelectedSpec((prev) => (prev === slug ? null : slug));
  };

  const renderItem = useCallback(
    ({ item, index }: { item: PsychCard; index: number }) => (
      <PsychCardItem item={item} index={index} />
    ),
    [],
  );

  const ListHeader = (
    <View>
      {/* Hero area — matches website: overflow-hidden, bg-cream-100 */}
      <View style={styles.heroArea}>
        <View style={styles.blobLeft} />
        <View style={styles.blobRight} />
        <Text style={styles.eyebrow}>
          {t('psychologists.title').toUpperCase()}
        </Text>
        <Text style={styles.heroTitle}>{t('psychologists.title')}</Text>
      </View>

      {/* Search — matches website: h-14 rounded-full border-ink/10 bg-cream-50 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.ink.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('psychologists.searchPlaceholder')}
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

      {/* Spec pills — website: rounded-full border px-3.5 py-1.5 text-[12.5px] */}
      {specializations.length > 0 && (
        <FlatList
          data={specializations.slice(0, 10)}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specList}
          renderItem={({ item }: { item: Specialization }) => (
            <TouchableOpacity
              style={[
                styles.specChip,
                selectedSpec === item.slug && styles.specChipActive,
              ]}
              onPress={() => handleSpecPress(item.slug)}
            >
              <Text
                style={[
                  styles.specChipText,
                  selectedSpec === item.slug && styles.specChipTextActive,
                ]}
              >
                {localize(item.name)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Result count */}
      <Text style={styles.resultCount}>
        {psychologists.length} {t('psychologists.title').toLowerCase()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={psychologists}
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
            <ActivityIndicator color={Colors.primary.ink} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={28} color={Colors.sand[600]} />
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
  // Hero
  heroArea: {
    position: 'relative',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
  },
  blobLeft: {
    position: 'absolute',
    left: -80,
    top: 0,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(243,227,181,0.3)',
  },
  blobRight: {
    position: 'absolute',
    right: -80,
    bottom: 0,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(150,211,201,0.25)',
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
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[50],
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
  },
  // Spec chips
  specList: {
    marginBottom: Spacing.xl,
    gap: 8,
  },
  specChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ink[15],
    backgroundColor: Colors.cream[50],
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  specChipActive: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  specChipText: {
    fontSize: 12.5,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  specChipTextActive: {
    color: Colors.cream[50],
  },
  // Results
  resultCount: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginBottom: Spacing.lg,
  },
  // Empty state — website: min-h-[320px] rounded-[24px] border-dashed
  emptyState: {
    minHeight: 260,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ink[20],
    backgroundColor: Colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
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
