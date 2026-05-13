import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/_atoms/BackButton';
import { Card, CardContent } from '../components/_atoms/Card';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import type { RootStackParamList } from '../types';

const VALUES = [
  {
    icon: 'shield-checkmark' as const,
    titleKey: 'about.safety',
    descKey: 'about.safetyDesc',
    color: Colors.primary[200],
  },
  {
    icon: 'lock-closed' as const,
    titleKey: 'about.privacy',
    descKey: 'about.privacyDesc',
    color: Colors.sand[200],
  },
  {
    icon: 'pricetag' as const,
    titleKey: 'about.fair',
    descKey: 'about.fairDesc',
    color: Colors.terracotta[200],
  },
  {
    icon: 'location' as const,
    titleKey: 'about.georgian',
    descKey: 'about.georgianDesc',
    color: Colors.primary[100],
  },
];

export default function AboutScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('about.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('about.subtitle')}</Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Card style={styles.missionCard}>
            <CardContent>
              <View style={styles.missionIcon}>
                <Ionicons
                  name="heart"
                  size={24}
                  color={Colors.primary.ink}
                />
              </View>
              <Text style={styles.missionText}>{t('about.mission')}</Text>
            </CardContent>
          </Card>
        </View>

        {/* Values Grid */}
        <View style={styles.section}>
          <View style={styles.valuesGrid}>
            {VALUES.map((item) => (
              <Card key={item.titleKey} style={styles.valueCard}>
                <CardContent style={styles.valueContent}>
                  <View
                    style={[
                      styles.valueIconCircle,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={Colors.primary.ink}
                    />
                  </View>
                  <Text style={styles.valueTitle}>{t(item.titleKey)}</Text>
                  <Text style={styles.valueDesc}>{t(item.descKey)}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream.DEFAULT,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  // Hero
  hero: {
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    backgroundColor: Colors.cream[50],
    ...Shadow.sm,
  },
  heroTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  // Section
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  // Mission
  missionCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.ink,
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  missionText: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    lineHeight: 24,
    fontWeight: FontWeight.medium,
  },
  // Values grid
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  valueCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
  },
  valueContent: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  valueIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  valueTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  valueDesc: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
