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
import { Card, CardContent } from '../components/_atoms/Card';
import Button from '../components/_atoms/Button';
import Avatar from '../components/_atoms/Avatar';
import Badge from '../components/_atoms/Badge';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';
import { useLocale } from '../hooks/useLocale';
import { fetchSubscriptions } from '../api/endpoints';
import { SkeletonListItem } from '../components/customs/Skeleton';
import type { RootStackParamList, SubscriptionData } from '../types';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_BADGE: Record<
  SubscriptionData['status'],
  { variant: BadgeVariant; labelKey: string }
> = {
  trialing: { variant: 'warning', labelKey: 'subscriptions.trialing' },
  active: { variant: 'success', labelKey: 'subscriptions.active' },
  past_due: { variant: 'warning', labelKey: 'subscriptions.pastDue' },
  paused: { variant: 'danger', labelKey: 'subscriptions.paused' },
  cancelled: { variant: 'neutral', labelKey: 'subscriptions.cancelled' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => fetchSubscriptions(),
    select: (res) => res.data.subscriptions,
  });

  const renderItem = ({ item }: { item: SubscriptionData }) => {
    const psychName = [item.psychologist.first_name, item.psychologist.last_name]
      .filter(Boolean)
      .join(' ') || '—';
    const badge = STATUS_BADGE[item.status];
    const intervalKey = `subscriptions.interval_${item.plan.interval}`;

    return (
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          {/* Psychologist row */}
          <View style={styles.psychRow}>
            <Avatar
              uri={item.psychologist.avatar_url}
              name={psychName}
              size={44}
            />
            <View style={styles.psychInfo}>
              <Text style={styles.psychName} numberOfLines={1}>
                {psychName}
              </Text>
              <Text style={styles.planName} numberOfLines={1}>
                {localize(item.plan.name)}
              </Text>
            </View>
            <Badge label={t(badge.labelKey)} variant={badge.variant} />
          </View>

          {/* Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('subscriptions.price')}</Text>
              <Text style={styles.detailValue}>
                {formatPrice(item.plan.base_price, item.plan.currency)} / {t(intervalKey)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('subscriptions.nextBilling')}</Text>
              <Text style={styles.detailValue}>
                {item.cancel_at_period_end
                  ? t('subscriptions.cancelsAt', { date: formatDate(item.current_period_end) })
                  : formatDate(item.current_period_end)}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  const ListHeader = (
    <View style={styles.heroArea}>
      <Text style={styles.eyebrow}>{t('subscriptions.title').toUpperCase()}</Text>
      <Text style={styles.heroTitle}>{t('subscriptions.title')}</Text>
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
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color={Colors.ink.muted} />
              <Text style={styles.emptyTitle}>{t('subscriptions.empty')}</Text>
              <Button
                title={t('subscriptions.browsePsychologists')}
                onPress={() =>
                  navigation.navigate('Main', { screen: 'Psychologists' } as never)
                }
                variant="outline"
                size="sm"
              />
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

  // Card
  card: {
    marginBottom: Spacing.lg,
  },
  cardContent: {
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },

  // Psychologist row
  psychRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  psychInfo: {
    flex: 1,
    gap: 2,
  },
  psychName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
  },
  planName: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },

  // Details
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  detailItem: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },

  // Empty state
  emptyState: {
    minHeight: 300,
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
