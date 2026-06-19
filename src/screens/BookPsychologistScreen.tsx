import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../components/_atoms/Button';
import { Card, CardContent } from '../components/_atoms/Card';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import {
  fetchPsychologistDetail,
  fetchPsychologistSlots,
  createBooking,
} from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import Skeleton, { SkeletonListItem } from '../components/customs/Skeleton';
import { getDisplayName, formatMonthDay, formatLongDate, formatTime } from '../utils/helpers';
import type { RootStackParamList, BookingSlot } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookPsychologist'>;

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TOTAL_STEPS = 4;

function getWeekDays(weekOffset: number): Date[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + weekOffset * 7);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function groupSlotsByPeriod(slots: BookingSlot[]) {
  const morning: BookingSlot[] = [];
  const afternoon: BookingSlot[] = [];
  const evening: BookingSlot[] = [];

  slots.forEach((slot) => {
    const hour = new Date(slot.start_utc).getHours();
    if (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else evening.push(slot);
  });

  return { morning, afternoon, evening };
}

export default function BookPsychologistScreen({ route }: Props) {
  const { slug } = route.params;
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch psychologist detail
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['psychologist', slug],
    queryFn: () => fetchPsychologistDetail(slug),
  });
  const psych = detailData?.data?.psychologist;

  // Fetch available slots for selected date range
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const dateFrom = formatDate(weekDays[0]);
  const dateTo = formatDate(weekDays[6]);

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['psychologist-slots', slug, dateFrom, dateTo],
    queryFn: () =>
      fetchPsychologistSlots(slug, { date_from: dateFrom, date_to: dateTo }),
  });
  const allSlots = slotsData?.data?.slots ?? [];

  // Count slots per day
  const slotsByDate = useMemo(() => {
    const map: Record<string, BookingSlot[]> = {};
    allSlots.forEach((slot) => {
      const dateKey = slot.start_utc.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(slot);
    });
    return map;
  }, [allSlots]);

  // Slots for the selected date
  const slotsForDate = selectedDate ? slotsByDate[selectedDate] ?? [] : [];
  const grouped = useMemo(() => groupSlotsByPeriod(slotsForDate), [slotsForDate]);

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: () =>
      createBooking({
        psychologist_slug: slug,
        slot_start_utc: selectedSlot!.start_utc,
        notes: notes || undefined,
      }),
    onSuccess: async (response) => {
      const redirectUrl = response.data?.redirect_url;
      if (redirectUrl) {
        // Open the payment provider in an in-app browser (mirrors the web redirect).
        await WebBrowser.openBrowserAsync(redirectUrl).catch(() => {});
        // Refresh the data that a completed payment affects.
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['my-consultations'] });
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      }
      navigation.navigate('PaymentSuccess', {});
    },
    onError: () => {
      Alert.alert(t('common.error'), t('common.somethingWrong'));
    },
  });

  const handleBack = useCallback(() => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep((s) => s - 1);
    }
  }, [step, navigation]);

  const handleContinue = useCallback(() => {
    if (step === 4) {
      bookingMutation.mutate();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, bookingMutation]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return !!selectedDate;
      case 2:
        return !!selectedSlot;
      case 3:
        return true; // notes are optional
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, selectedDate, selectedSlot]);

  if (detailLoading || !psych) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Skeleton width="30%" height={18} />
          <View style={{ width: 40 }} />
        </View>
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
            <Skeleton width={80} height={80} borderRadius={BorderRadius.md} />
            <Skeleton width={80} height={80} borderRadius={BorderRadius.md} />
            <Skeleton width={80} height={80} borderRadius={BorderRadius.md} />
          </View>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      </SafeAreaView>
    );
  }

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[styles.stepDot, i + 1 === step && styles.stepDotActive]}
        />
      ))}
    </View>
  );

  // ─── Step 1: Day Picker ───
  const renderDayPicker = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('booking.selectDay')}</Text>

      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => setWeekOffset((w) => w - 1)}
          disabled={weekOffset <= 0}
          style={styles.weekArrow}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={weekOffset <= 0 ? Colors.ink.muted : Colors.ink.DEFAULT}
          />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          {formatMonthDay(weekDays[0])} - {formatMonthDay(weekDays[6])}
        </Text>
        <TouchableOpacity
          onPress={() => setWeekOffset((w) => w + 1)}
          style={styles.weekArrow}
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.ink.DEFAULT} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={weekDays}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => formatDate(item)}
        style={styles.dayFlatList}
        contentContainerStyle={styles.dayList}
        renderItem={({ item }) => {
          const dateKey = formatDate(item);
          const count = slotsByDate[dateKey]?.length ?? 0;
          const isSelected = selectedDate === dateKey;
          const isPast = item < new Date(new Date().toDateString());

          return (
            <TouchableOpacity
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
                isPast && styles.dayCardDisabled,
              ]}
              onPress={() => {
                if (!isPast) {
                  setSelectedDate(dateKey);
                  setSelectedSlot(null);
                }
              }}
              disabled={isPast}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayTextSelected,
                  isPast && styles.dayTextDisabled,
                ]}
              >
                {WEEK_DAYS[item.getDay()]}
              </Text>
              <Text
                style={[
                  styles.dayDate,
                  isSelected && styles.dayTextSelected,
                  isPast && styles.dayTextDisabled,
                ]}
              >
                {item.getDate()}
              </Text>
              <Text
                style={[
                  styles.daySlots,
                  isSelected && styles.dayTextSelected,
                  isPast && styles.dayTextDisabled,
                ]}
              >
                {slotsLoading ? '…' : `${count} ${t('booking.slots')}`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // ─── Step 2: Time Slot Picker ───
  const renderTimePicker = () => {
    const sections: { key: string; label: string; slots: BookingSlot[] }[] = [
      { key: 'morning', label: t('booking.morning'), slots: grouped.morning },
      {
        key: 'afternoon',
        label: t('booking.afternoon'),
        slots: grouped.afternoon,
      },
      { key: 'evening', label: t('booking.evening'), slots: grouped.evening },
    ].filter((s) => s.slots.length > 0);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t('booking.selectTime')}</Text>

        {sections.map((section) => (
          <View key={section.key} style={styles.periodSection}>
            <Text style={styles.periodLabel}>{section.label}</Text>
            <View style={styles.slotGrid}>
              {section.slots.map((slot) => {
                const time = formatTime(slot.start_utc);
                const isSelected = selectedSlot?.start_utc === slot.start_utc;
                return (
                  <TouchableOpacity
                    key={slot.start_utc}
                    style={[
                      styles.slotChip,
                      isSelected && styles.slotChipSelected,
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isSelected && styles.slotTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {sections.length === 0 && (
          <Text style={styles.emptyText}>{t('booking.noSlots')}</Text>
        )}
      </View>
    );
  };

  // ─── Step 3: Notes ───
  const renderNotes = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('booking.addNotes')}</Text>
      <Text style={styles.notesHint}>{t('booking.notesHint')}</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        placeholder={t('booking.notesPlaceholder')}
        placeholderTextColor={Colors.ink.muted}
        value={notes}
        onChangeText={setNotes}
      />
    </View>
  );

  // ─── Step 4: Confirmation ───
  const renderConfirmation = () => {
    const slotDate = selectedSlot ? formatLongDate(selectedSlot.start_utc) : '';
    const slotTime = selectedSlot ? formatTime(selectedSlot.start_utc) : '';

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>{t('booking.confirmation')}</Text>

        <Card style={styles.confirmCard}>
          <CardContent>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>
                {t('booking.psychologist')}
              </Text>
              <Text style={styles.confirmValue}>{getDisplayName(psych)}</Text>
            </View>
            <View style={styles.confirmDivider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{t('booking.date')}</Text>
              <Text style={styles.confirmValue}>{slotDate}</Text>
            </View>
            <View style={styles.confirmDivider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{t('booking.time')}</Text>
              <Text style={styles.confirmValue}>{slotTime}</Text>
            </View>
            <View style={styles.confirmDivider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{t('booking.duration')}</Text>
              <Text style={styles.confirmValue}>
                {selectedSlot?.duration_min} {t('common.min')}
              </Text>
            </View>
            <View style={styles.confirmDivider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{t('booking.basePrice')}</Text>
              <Text style={styles.confirmValue}>
                {psych.consultation_base_price} {psych.currency}
              </Text>
            </View>
            <View style={styles.confirmDivider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabelBold}>{t('booking.total')}</Text>
              <Text style={styles.confirmValueBold}>
                {psych.displayed_price} {psych.currency}
              </Text>
            </View>

            {notes.trim().length > 0 && (
              <>
                <View style={styles.confirmDivider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>{t('booking.notes')}</Text>
                  <Text
                    style={[styles.confirmValue, { flex: 1, textAlign: 'right' }]}
                    numberOfLines={3}
                  >
                    {notes}
                  </Text>
                </View>
              </>
            )}
          </CardContent>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.ink.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('booking.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      {/* Step content */}
      <View style={styles.content}>
        {step === 1 && renderDayPicker()}
        {step === 2 && renderTimePicker()}
        {step === 3 && renderNotes()}
        {step === 4 && renderConfirmation()}
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={
            step === 4 ? t('booking.confirmPay') : t('booking.continue')
          }
          onPress={handleContinue}
          disabled={!canContinue}
          loading={bookingMutation.isPending}
          fullWidth
          icon={
            step === 4 ? (
              <Ionicons name="card-outline" size={18} color={Colors.white} />
            ) : undefined
          }
        />
      </View>
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
  },
  // Step indicator
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ink[15],
  },
  stepDotActive: {
    backgroundColor: Colors.primary.ink,
    width: 24,
    borderRadius: 4,
  },
  // Content
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
  },
  // Week nav
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  weekArrow: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
  },
  // Day cards
  dayFlatList: {
    flexGrow: 0,
    alignSelf: 'stretch',
  },
  dayList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  dayCard: {
    width: 80,
    height: 96,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: Spacing.xs,
  },
  dayCardSelected: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  dayCardDisabled: {
    opacity: 0.4,
  },
  dayName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dayDate: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
  },
  daySlots: {
    fontSize: FontSize['2xs'],
    color: Colors.ink.muted,
  },
  dayTextSelected: {
    color: Colors.cream[50],
  },
  dayTextDisabled: {
    color: Colors.ink.muted,
  },
  // Time slots
  periodSection: {
    marginBottom: Spacing.xl,
  },
  periodLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  slotChipSelected: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  slotText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  slotTextSelected: {
    color: Colors.cream[50],
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
  },
  // Notes
  notesHint: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginBottom: Spacing.lg,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    minHeight: 140,
    lineHeight: 22,
  },
  // Confirmation
  confirmCard: {
    marginBottom: Spacing.xl,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  confirmLabel: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  confirmValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  confirmLabelBold: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
  },
  confirmValueBold: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cream.DEFAULT,
  },
});
