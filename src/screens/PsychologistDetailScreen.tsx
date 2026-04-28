import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Avatar from '../components/_atoms/Avatar';
import BackButton from '../components/_atoms/BackButton';
import StarRating from '../components/_atoms/StarRating';
import TrustBadge from '../components/_atoms/TrustBadge';
import Badge from '../components/_atoms/Badge';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useQuery } from '@tanstack/react-query';
import { fetchPsychologistDetail, fetchPsychologistReviews, fetchSubscriptionPlans } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import { getDisplayName } from '../utils/helpers';
import type { RootStackParamList, Review, SubscriptionPlan } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PsychologistDetail'>;

const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PsychologistDetailScreen({ route }: Props) {
  const { slug } = route.params;
  const { t } = useTranslation();
  const { localize } = useLocale();

  const { data: detailData, isLoading } = useQuery({
    queryKey: ['psychologist', slug],
    queryFn: () => fetchPsychologistDetail(slug),
  });
  const { data: reviewsData } = useQuery({
    queryKey: ['psychologist-reviews', slug],
    queryFn: () => fetchPsychologistReviews(slug),
  });
  const { data: plansData } = useQuery({
    queryKey: ['psychologist-plans', slug],
    queryFn: () => fetchSubscriptionPlans(slug),
  });
  const psych = detailData?.data?.psychologist;
  const reviews = reviewsData?.data?.data ?? [];
  const plans = plansData?.data?.plans ?? [];

  if (isLoading || !psych) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary.ink} size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Avatar uri={psych.avatar_url} name={getDisplayName(psych)} size={90} />
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{getDisplayName(psych)}</Text>
                <TrustBadge level={psych.verification_level} />
              </View>
              {psych.headline && (
                <Text style={styles.headline} numberOfLines={2}>
                  {localize(psych.headline)}
                </Text>
              )}
              <StarRating rating={psych.rating_avg ?? 0} count={psych.rating_count} />
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            {psych.years_of_experience && (
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{psych.years_of_experience}</Text>
                <Text style={styles.quickStatLabel}>{t('psychologists.experience')}</Text>
              </View>
            )}
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{psych.total_sessions}</Text>
              <Text style={styles.quickStatLabel}>{t('common.sessions')}</Text>
            </View>
            {psych.displayed_price && (
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>
                  {psych.displayed_price} {psych.currency}
                </Text>
                <Text style={styles.quickStatLabel}>{t('common.perSession')}</Text>
              </View>
            )}
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaRow}>
            <Button
              title={t('psychologists.bookConsultation')}
              onPress={() => {}}
              fullWidth
              icon={<Ionicons name="calendar-outline" size={18} color={Colors.white} />}
            />
            <Button
              title={t('psychologists.startChat')}
              onPress={() => {}}
              variant="outline"
              fullWidth
              icon={<Ionicons name="chatbubble-outline" size={18} color={Colors.primary.ink} />}
            />
          </View>
        </View>

        {/* About */}
        {psych.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('psychologists.about')}</Text>
            <Text style={styles.bioText}>{localize(psych.bio)}</Text>
          </View>
        )}

        {/* Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('psychologists.specialization')}</Text>
          <View style={styles.specRow}>
            {psych.specializations.map((s) => (
              <Badge key={s.slug} label={localize(s.name)} variant="primary" />
            ))}
          </View>
        </View>

        {/* Availability */}
        {psych.availability_rules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('psychologists.availability')}</Text>
            {psych.availability_rules.map((rule, i) => (
              <View key={i} style={styles.availRow}>
                <Text style={styles.availDay}>{dayNames[rule.day_of_week]}</Text>
                <Text style={styles.availTime}>
                  {rule.start_time} - {rule.end_time}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Subscription Plans */}
        {plans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('psychologists.subscriptionPlans')}</Text>
            <FlatList
              data={plans}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }: { item: SubscriptionPlan }) => {
                const monthly =
                  item.interval === 'quarter'
                    ? item.displayed_price / 3
                    : item.interval === 'year'
                    ? item.displayed_price / 12
                    : item.displayed_price;

                return (
                  <Card style={styles.planCard}>
                    <CardContent>
                      <Text style={styles.planInterval}>
                        {t(`subscriptions.${item.interval === 'quarter' ? 'quarterly' : item.interval === 'year' ? 'yearly' : 'monthly'}`)}
                      </Text>
                      <Text style={styles.planPrice}>
                        {item.displayed_price} {item.currency}
                      </Text>
                      {item.interval !== 'month' && (
                        <Text style={styles.planMonthly}>
                          ~{monthly.toFixed(0)} {item.currency}/{t('subscriptions.perMonth')}
                        </Text>
                      )}
                      <Button
                        title={t('subscriptions.subscribe')}
                        onPress={() => {}}
                        size="sm"
                        fullWidth
                        style={{ marginTop: Spacing.md }}
                      />
                    </CardContent>
                  </Card>
                );
              }}
            />
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('psychologists.reviews')} ({psych.rating_count})
            </Text>
            {reviews.map((review: Review) => (
              <Card key={review.id} style={styles.reviewCard}>
                <CardContent>
                  <View style={styles.reviewHeader}>
                    <Avatar
                      uri={review.author.avatar_url}
                      name={review.author.display_name}
                      size={36}
                    />
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewName}>{review.author.display_name}</Text>
                      <StarRating rating={review.rating} size={12} showCount={false} />
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewBody}>{review.body}</Text>
                  {review.psych_reply_body && (
                    <View style={styles.replyBox}>
                      <Text style={styles.replyLabel}>{getDisplayName(psych)}:</Text>
                      <Text style={styles.replyText}>{review.psych_reply_body}</Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}

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
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  // Hero
  hero: {
    backgroundColor: Colors.cream[50],
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  heroTop: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  heroInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    flexShrink: 1,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
    lineHeight: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  ctaRow: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  // Sections
  section: {
    padding: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  bioText: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
    lineHeight: 24,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  // Availability
  availRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  availDay: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
  },
  availTime: {
    fontSize: FontSize.base,
    color: Colors.ink.soft,
  },
  // Plans
  planCard: {
    width: 200,
    marginRight: Spacing.lg,
  },
  planInterval: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  planPrice: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
  },
  planMonthly: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    marginTop: 2,
  },
  // Reviews
  reviewCard: {
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reviewMeta: {
    flex: 1,
    gap: 2,
  },
  reviewName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
  },
  reviewBody: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
    lineHeight: 20,
  },
  replyBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  },
  replyLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    marginBottom: 4,
  },
  replyText: {
    fontSize: FontSize.sm,
    color: Colors.ink.soft,
  },
});
