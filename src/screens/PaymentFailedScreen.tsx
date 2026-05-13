import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../components/_atoms/Button';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';
import type { RootStackParamList } from '../types';

export default function PaymentFailedScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons
            name="close-circle"
            size={80}
            color={Colors.danger}
          />
        </View>

        <Text style={styles.title}>{t('payment.failedTitle')}</Text>
        <Text style={styles.subtitle}>{t('payment.failedSubtitle')}</Text>

        <View style={styles.buttons}>
          <Button
            title={t('payment.tryAgain')}
            onPress={() => navigation.goBack()}
            fullWidth
            icon={
              <Ionicons
                name="refresh-outline"
                size={18}
                color={Colors.white}
              />
            }
          />
          <Button
            title={t('payment.goHome')}
            onPress={() => navigation.navigate('Main')}
            variant="outline"
            fullWidth
            icon={
              <Ionicons
                name="home-outline"
                size={18}
                color={Colors.ink.DEFAULT}
              />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(176,74,62,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['3xl'],
  },
  buttons: {
    width: '100%',
    gap: Spacing.md,
  },
});
