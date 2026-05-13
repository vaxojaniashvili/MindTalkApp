import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Input from '../components/_atoms/Input';
import Button from '../components/_atoms/Button';
import Badge from '../components/_atoms/Badge';
import BackButton from '../components/_atoms/BackButton';
import { Card, CardContent } from '../components/_atoms/Card';
import { SkeletonBalanceCard, SkeletonListItem } from '../components/customs/Skeleton';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchWallet, fetchWithdrawals, requestWithdrawal } from '../api/endpoints';
import type { RootStackParamList, WithdrawalData } from '../types';

const statusBadgeVariant: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'terracotta'> = {
  requested: 'warning',
  approved: 'primary',
  paid: 'success',
  rejected: 'danger',
};

export default function WithdrawalsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');

  const {
    data: walletData,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    enabled: isAuth,
  });

  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    isError: withdrawalsError,
    refetch,
  } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: fetchWithdrawals,
    enabled: isAuth,
  });

  const wallet = walletData?.data?.wallet;
  const withdrawals = withdrawalsData?.data?.withdrawals ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      requestWithdrawal({
        amount: Number(amount),
        iban: iban.trim(),
        account_holder: accountHolder.trim(),
        bank: bankName.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert(t('common.success'), t('withdrawals.requestSuccess'));
      setAmount('');
      setIban('');
      setAccountHolder('');
      setBankName('');
    },
    onError: () => {
      Alert.alert(t('common.error'), t('withdrawals.requestError'));
    },
  });

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('common.error'), t('withdrawals.invalidAmount'));
      return;
    }
    if (wallet && numAmount > wallet.available) {
      Alert.alert(t('common.error'), t('withdrawals.insufficientBalance'));
      return;
    }
    if (!iban.trim()) {
      Alert.alert(t('common.error'), t('withdrawals.ibanRequired'));
      return;
    }
    if (!accountHolder.trim()) {
      Alert.alert(t('common.error'), t('withdrawals.holderRequired'));
      return;
    }
    if (!bankName.trim()) {
      Alert.alert(t('common.error'), t('withdrawals.bankRequired'));
      return;
    }
    mutation.mutate();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const isLoading = walletLoading || withdrawalsLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.backBtn}>
          <BackButton />
        </View>
        <Text style={styles.headerTitle}>{t('withdrawals.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: Spacing.xl }}>
          <SkeletonBalanceCard />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      ) : withdrawalsError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ink.muted} />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} size="sm" variant="outline" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Balance Card */}
            {wallet && (
              <Card style={styles.balanceCard}>
                <CardContent>
                  <View style={styles.balanceContent}>
                    <View style={styles.balanceIconWrap}>
                      <Ionicons name="wallet-outline" size={24} color={Colors.primary[700]} />
                    </View>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.balanceLabel}>{t('withdrawals.availableBalance')}</Text>
                      <Text style={styles.balanceAmount}>
                        {wallet.available} {wallet.currency}
                      </Text>
                    </View>
                  </View>
                  {wallet.held_for_withdrawal > 0 && (
                    <View style={styles.heldRow}>
                      <Ionicons name="lock-closed-outline" size={14} color={Colors.ink.muted} />
                      <Text style={styles.heldText}>
                        {t('withdrawals.held')}: {wallet.held_for_withdrawal} {wallet.currency}
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Request Form */}
            <Text style={styles.sectionTitle}>{t('withdrawals.requestTitle')}</Text>

            <Input
              label={t('withdrawals.amount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />

            <Input
              label={t('withdrawals.iban')}
              value={iban}
              onChangeText={setIban}
              placeholder="GE00XX0000000000000000"
              autoCapitalize="characters"
            />

            <Input
              label={t('withdrawals.accountHolder')}
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder={t('withdrawals.accountHolderPlaceholder')}
            />

            <Input
              label={t('withdrawals.bankName')}
              value={bankName}
              onChangeText={setBankName}
              placeholder={t('withdrawals.bankNamePlaceholder')}
            />

            <Button
              title={t('withdrawals.requestButton')}
              onPress={handleSubmit}
              loading={mutation.isPending}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: Spacing['3xl'] }]}>
                  {t('withdrawals.history')}
                </Text>

                {withdrawals.map((w: WithdrawalData) => (
                  <Card key={w.id} style={styles.historyCard}>
                    <CardContent>
                      <View style={styles.historyRow}>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyAmount}>
                            {w.amount} {w.currency}
                          </Text>
                          <View style={styles.historyDateRow}>
                            <Ionicons name="calendar-outline" size={14} color={Colors.ink.muted} />
                            <Text style={styles.historyDate}>{formatDate(w.created_at)}</Text>
                          </View>
                        </View>
                        <Badge
                          label={t(`withdrawals.status.${w.status}`)}
                          variant={statusBadgeVariant[w.status] ?? 'neutral'}
                        />
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {withdrawals.length === 0 && (
              <View style={styles.emptyHistory}>
                <Ionicons name="cash-outline" size={48} color={Colors.ink.muted} />
                <Text style={styles.emptyHistoryText}>{t('psychologist.noWithdrawals', 'No withdrawals yet')}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  flex: {
    flex: 1,
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  balanceCard: {
    marginBottom: Spacing.xl,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  balanceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
  },
  heldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  heldText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  historyCard: {
    marginBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
  },
  historyInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  historyAmount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  historyDate: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing['3xl'],
    paddingVertical: Spacing['3xl'],
  },
  emptyHistoryText: {
    fontSize: FontSize.sm,
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
