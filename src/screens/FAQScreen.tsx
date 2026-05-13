import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/_atoms/BackButton';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import type { RootStackParamList } from '../types';

const FAQ_COUNT = 7;

export default function FAQScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const items = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`faq.q${i + 1}`),
    answer: t(`faq.a${i + 1}`),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>{t('faq.title')}</Text>

        <View style={styles.list}>
          {items.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index}>
                <TouchableOpacity
                  style={styles.itemHeader}
                  onPress={() => toggle(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.question}>{item.question}</Text>
                  <View
                    style={[
                      styles.chevronContainer,
                      isExpanded && styles.chevronExpanded,
                    ]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={Colors.ink.muted}
                      style={{
                        transform: [
                          { rotate: isExpanded ? '180deg' : '0deg' },
                        ],
                      }}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answer}>{item.answer}</Text>
                  </View>
                )}

                {index < items.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
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
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  list: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  question: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
    lineHeight: 22,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronExpanded: {
    backgroundColor: Colors.primary[50],
  },
  answerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  answer: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
});
