import React from 'react';
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
import Button from '../components/_atoms/Button';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';
import { fetchNotifications } from '../api/endpoints';
import { SkeletonListItem } from '../components/customs/Skeleton';
import type { RootStackParamList, AppNotification } from '../types';

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo`;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
    select: (res) => res.data.notifications,
  });

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.read_at;

    return (
      <View style={styles.notifRow}>
        {/* Unread dot */}
        <View style={styles.dotColumn}>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text
              style={[styles.notifTitle, isUnread && styles.notifTitleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.notifTime}>{relativeTime(item.created_at)}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <View style={styles.heroArea}>
      <Text style={styles.eyebrow}>{t('notifications.title').toUpperCase()}</Text>
      <Text style={styles.heroTitle}>{t('notifications.title')}</Text>
    </View>
  );

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ink.muted} />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.ink.muted} />
              <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
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

  // Notification row
  notifRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  dotColumn: {
    width: 12,
    paddingTop: 6,
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notifTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.normal,
    color: Colors.ink.DEFAULT,
  },
  notifTitleUnread: {
    fontWeight: FontWeight.semibold,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
  },
  notifBody: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
    lineHeight: 18,
  },

  // Empty state
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
    padding: Spacing['2xl'],
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
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    textAlign: 'center',
  },
  loader: {
    paddingVertical: Spacing['3xl'],
  },

  // Error
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing['2xl'],
  },
  errorText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    textAlign: 'center',
  },
});
