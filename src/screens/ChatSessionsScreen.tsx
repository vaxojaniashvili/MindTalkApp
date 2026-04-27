import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Avatar from '../components/_atoms/Avatar';
import Badge from '../components/_atoms/Badge';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchChatSessions } from '../api/endpoints';
import { getDisplayName } from '../utils/helpers';
import type { ChatSessionData } from '../types';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  active: 'success',
  expired: 'neutral' as any,
  refunded: 'danger',
};

const typeLabels: Record<string, string> = {
  live_30: 'chat.live30',
  live_60: 'chat.live60',
  async_7d: 'chat.async7d',
};

export default function ChatSessionsScreen() {
  const { t } = useTranslation();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: fetchChatSessions,
    enabled: isAuth,
  });
  const sessions = data?.data?.data ?? [];

  const renderItem = ({ item }: { item: ChatSessionData }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <Avatar
          uri={item.counterpart.avatar_url}
          name={getDisplayName(item.counterpart)}
          size={44}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{getDisplayName(item.counterpart)}</Text>
          <Text style={styles.cardType}>{t(typeLabels[item.type] || item.type)}</Text>
        </View>
        <Badge label={t(`chat.${item.status}`)} variant={statusVariant[item.status] ?? 'neutral'} />
      </View>

      <View style={styles.cardBottom}>
        {item.ends_at && (
          <Text style={styles.expires}>
            <Ionicons name="time-outline" size={12} color={Colors.ink.muted} />{' '}
            {new Date(item.ends_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('chat.title')}</Text>

      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={Colors.primary.ink} style={styles.loader} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.cream[300]} />
              <Text style={styles.emptyText}>{t('chat.noSessions')}</Text>
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
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    padding: Spacing.lg,
    letterSpacing: -0.5,
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  card: {
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
  },
  cardType: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  preview: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  expires: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
  },
  unreadBadge: {
    backgroundColor: Colors.terracotta[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  loader: {
    paddingVertical: Spacing['4xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['6xl'],
    gap: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
  },
});
