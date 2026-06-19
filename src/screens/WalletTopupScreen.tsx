import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';
import { topupWallet } from '../api/endpoints';
import type { RootStackParamList } from '../types';

const PRESET_AMOUNTS = [50, 100, 200, 500];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 5000;

export default function WalletTopupScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');

  const mutation = useMutation({
    mutationFn: (amt: number) => topupWallet(amt),
    onSuccess: async (res) => {
      const url = res.data.topup.redirect_url;
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch {
        Alert.alert(t('common.error'), t('wallet.cannotOpenPayment'));
      }
      // Payment processed on the provider side — refresh balance and return.
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      navigation.navigate('PaymentSuccess', {});
    },
    onError: () => {
      Alert.alert(t('common.error'), t('wallet.topupFailed'));
    },
  });

  const numericAmount = parseFloat(amount) || 0;
  const isValid = numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;

  const handleContinue = () => {
    if (!isValid) return;
    mutation.mutate(numericAmount);
  };

  const handlePreset = (value: number) => {
    setAmount(String(value));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wallet.topup')}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount input */}
          <Card>
            <CardContent style={styles.inputContent}>
              <Text style={styles.inputLabel}>{t('wallet.enterAmount')}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.ink.muted}
                  maxLength={7}
                  autoFocus
                />
                <Text style={styles.currencyLabel}>GEL</Text>
              </View>
              {amount.length > 0 && !isValid && (
                <Text style={styles.validationText}>
                  {t('wallet.amountRange', { min: MIN_AMOUNT, max: MAX_AMOUNT })}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Preset buttons */}
          <View style={styles.presetRow}>
            {PRESET_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.presetChip,
                  numericAmount === value && styles.presetChipActive,
                ]}
                onPress={() => handlePreset(value)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    numericAmount === value && styles.presetChipTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue button */}
          <View style={styles.continueSection}>
            <Button
              title={t('wallet.continue')}
              onPress={handleContinue}
              size="lg"
              fullWidth
              disabled={!isValid}
              loading={mutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
  },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },

  // Input card
  inputContent: {
    paddingTop: Spacing['2xl'],
    gap: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -1,
    padding: 0,
  },
  currencyLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
  },
  validationText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
  },

  // Presets
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  presetChip: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ink[15],
    backgroundColor: Colors.cream[50],
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  presetChipText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  presetChipTextActive: {
    color: Colors.cream[50],
  },

  // Continue
  continueSection: {
    marginTop: Spacing['3xl'],
  },
});
