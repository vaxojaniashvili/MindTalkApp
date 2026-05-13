import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from '../components/_atoms/Avatar';
import Button from '../components/_atoms/Button';
import Badge from '../components/_atoms/Badge';
import { Card, CardContent } from '../components/_atoms/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchConsultations, cancelConsultation } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import { getDisplayName } from '../utils/helpers';
import { SkeletonCard } from '../components/customs/Skeleton';
import type { RootStackParamList, ApiConsultation } from '../types';

type Tab = 'upcoming' | 'past';

const upcomingStatuses = ['scheduled', 'in_progress'] as const;
const pastStatuses = ['completed', 'cancelled', 'no_show_client', 'no_show_psych', 'tech_issue'] as const;

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'terracotta'> = {
  scheduled: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show_client: 'warning',
  no_show_psych: 'warning',
  tech_issue: 'terracotta',
};

export default function ConsultationsScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['consultations'],
    queryFn: fetchConsultations,
    enabled: isAuth,
  });

  const consultations = data?.data?.consultations ?? [];

  const filtered = consultations.filter((c) => {
    if (activeTab === 'upcoming') {
      return (upcomingStatuses as readonly string[]).includes(c.status);
    }
    return (pastStatuses as readonly string[]).includes(c.status);
  });

  const handleJoinCall = useCallback((jitsiRoom: string) => {
    Linking.openURL(jitsiRoom).catch(() => {
      Alert.alert(t('common.error'), t('consultation.cannotOpenLink'));
    });
  }, [t]);

  const handleCancel = useCallback(
    (consultation: ApiConsultation) => {
      Alert.alert(
        t('consultation.cancelTitle'),
        t('consultation.cancelMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                setCancellingId(consultation.id);
                await cancelConsultation(consultation.id);
                queryClient.invalidateQueries({ queryKey: ['consultations'] });
              } catch {
                Alert.alert(t('common.error'), t('consultation.cancelError'));
              } finally {
                setCancellingId(null);
              }
            },
          },
        ],
      );
    },
    [t, queryClient],
  );

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderItem = useCallback(
    ({ item }: { item: ApiConsultation }) => {
      const { date, time } = formatDateTime(item.scheduled_at);
      const psychName = item.psychologist ? getDisplayName(item.psychologist) : 'Unknown';
      const headline = item.psychologist?.headline ? localize(item.psychologist.headline) : '';
      const isScheduled = item.status === 'scheduled';
      const isCancelling = cancellingId === item.id;

      return (
        <Card style={styles.card}>
          <CardContent>
            {/* Psychologist info */}
            <View style={styles.psychRow}>
              <Avatar
                uri={item.psychologist?.avatar_url ?? null}
                name={psychName}
                size={48}
              />
              <View style={styles.psychInfo}>
                <Text style={styles.psychName}>{psychName}</Text>
                {headline ? (
                  <Text style={styles.psychHeadline} numberOfLines={1}>
                    {headline}
                  </Text>
                ) : null}
              </View>
              <Badge
                label={t(`consultation.${item.status}`)}
                variant={statusBadgeVariant[item.status] ?? 'neutral'}
              />
            </View>

            {/* Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={Colors.ink.muted} />
                <Text style={styles.detailText}>{date}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={Colors.ink.muted} />
                <Text style={styles.detailText}>{time}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="hourglass-outline" size={16} color={Colors.ink.muted} />
                <Text style={styles.detailText}>{item.duration_min} min</Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('consultation.totalPaid')}</Text>
              <Text style={styles.priceValue}>
                {item.total_paid} {item.currency}
              </Text>
            </View>

            {/* Actions */}
            {activeTab === 'upcoming' && (
              <View style={styles.actionsRow}>
                {isScheduled && item.jitsi_room ? (
                  <Button
                    title={t('consultation.joinCall')}
                    onPress={() => handleJoinCall(item.jitsi_room!)}
                    size="sm"
                    icon={<Ionicons name="videocam" size={16} color={Colors.cream[50]} />}
                    style={styles.actionBtn}
                  />
                ) : null}
                {isScheduled && (
                  <Button
                    title={t('consultation.cancel')}
                    onPress={() => handleCancel(item)}
                    variant="destructive"
                    size="sm"
                    loading={isCancelling}
                    style={styles.actionBtn}
                  />
                )}
              </View>
            )}
          </CardContent>
        </Card>
      );
    },
    [activeTab, cancellingId, handleCancel, handleJoinCall, localize, t],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('consultation.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('consultation.upcoming')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('consultation.past')}
          </Text>
        </TouchableOpacity>
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
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.ink.muted} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? t('consultations.empty')
                  : t('consultation.noPast')}
              </Text>
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
    backgroundColor: Colors.cream[200],
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary.ink,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  tabTextActive: {
    color: Colors.cream[50],
  },
  list: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  psychRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  psychInfo: {
    flex: 1,
  },
  psychName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  psychHeadline: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginTop: 2,
  },
  detailsRow: {
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  priceLabel: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  priceValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
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
