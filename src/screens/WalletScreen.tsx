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
import AppRefreshControl from '../components/customs/AppRefreshControl';
import { formatDate as formatDateSafe } from '../utils/helpers';
import { Card, CardContent } from '../components/_atoms/Card';
import Button from '../components/_atoms/Button';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchWallet } from '../api/endpoints';
import type { RootStackParamList } from '../types';
import { SkeletonBalanceCard, SkeletonListItem } from '../components/customs/Skeleton';
import type { WalletTransaction } from '../types';

const KIND_LABELS: Record<WalletTransaction['kind'], string> = {
  topup: 'wallet.kindTopup',
  course_purchase: 'wallet.kindCoursePurchase',
  refund_credit: 'wallet.kindRefund',
  withdrawal_hold: 'wallet.kindWithdrawalHold',
  withdrawal_paid: 'wallet.kindWithdrawalPaid',
  withdrawal_reversed: 'wallet.kindWithdrawalReversed',
  manual_adjust: 'wallet.kindManualAdjust',
};

const CREDIT_KINDS: WalletTransaction['kind'][] = [
  'topup',
  'refund_credit',
  'withdrawal_reversed',
  'manual_adjust',
];

function formatCurrency(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

function formatDate(iso: string): string {
  return formatDateSafe(iso);
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const isPsychologist = user?.roles.includes('psychologist') ?? false;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => fetchWallet(),
    select: (res) => res.data.wallet,
  });

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isCredit = CREDIT_KINDS.includes(item.kind) && item.amount > 0;
    const iconName = isCredit ? 'arrow-down' : 'arrow-up';
    const iconColor = isCredit ? Colors.success : Colors.danger;
    const amountPrefix = isCredit ? '+' : '';

    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: isCredit ? 'rgba(59,128,77,0.1)' : 'rgba(176,74,62,0.1)' }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txKind}>{t(KIND_LABELS[item.kind])}</Text>
          <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.txAmounts}>
          <Text style={[styles.txAmount, { color: iconColor }]}>
            {amountPrefix}{formatCurrency(item.amount, item.currency)}
          </Text>
          <Text style={styles.txBalance}>
            {formatCurrency(item.balance_after, item.currency)}
          </Text>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <View>
      {/* Hero */}
      <View style={styles.heroArea}>
        <Text style={styles.eyebrow}>{t('wallet.title').toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{t('wallet.title')}</Text>
      </View>

      {/* Balance card */}
      <Card style={styles.balanceCard}>
        <CardContent style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>{t('wallet.balance')}</Text>
          {isLoading ? (
            <SkeletonBalanceCard />
          ) : (
            <Text style={styles.balanceAmount}>
              {data ? formatCurrency(data.balance, data.currency) : '—'}
            </Text>
          )}
        </CardContent>
      </Card>

      {/* Psychologist-specific cards */}
      {isPsychologist && data && (
        <View style={styles.psychCards}>
          <Card style={styles.halfCard}>
            <CardContent style={styles.halfCardContent}>
              <Ionicons name="time-outline" size={20} color={Colors.warning} />
              <Text style={styles.halfCardLabel}>{t('wallet.heldForWithdrawal')}</Text>
              <Text style={styles.halfCardAmount}>
                {formatCurrency(data.held_for_withdrawal, data.currency)}
              </Text>
            </CardContent>
          </Card>
          <Card style={styles.halfCard}>
            <CardContent style={styles.halfCardContent}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
              <Text style={styles.halfCardLabel}>{t('wallet.available')}</Text>
              <Text style={styles.halfCardAmount}>
                {formatCurrency(data.available, data.currency)}
              </Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* Top up button */}
      <View style={styles.topupSection}>
        <Button
          title={t('wallet.topup')}
          onPress={() => navigation.navigate('WalletTopup')}
          size="lg"
          fullWidth
          icon={<Ionicons name="add-circle-outline" size={20} color={Colors.cream[50]} />}
        />
      </View>

      {/* Section heading */}
      <Text style={styles.sectionTitle}>{t('wallet.recentTransactions')}</Text>
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
        data={data?.recent_transactions ?? []}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        refreshControl={<AppRefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View>
              <SkeletonBalanceCard />
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.ink.muted} />
              <Text style={styles.emptyTitle}>{t('wallet.noTransactions')}</Text>
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

  // Balance card
  balanceCard: {
    marginBottom: Spacing.lg,
  },
  balanceContent: {
    paddingTop: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -1,
  },

  // Psychologist cards
  psychCards: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfCard: {
    flex: 1,
  },
  halfCardContent: {
    paddingTop: Spacing.xl,
    gap: Spacing.xs,
  },
  halfCardLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
  },
  halfCardAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
  },

  // Top up
  topupSection: {
    marginBottom: Spacing['2xl'],
  },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },

  // Transaction row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txKind: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  txDate: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
  },
  txAmounts: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  txBalance: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
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
