import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import BackButton from '../components/_atoms/BackButton';
import { Card, CardContent } from '../components/_atoms/Card';
import { SkeletonListItem } from '../components/customs/Skeleton';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchMyAvailability, updateMyAvailability } from '../api/endpoints';
import type { RootStackParamList, AvailabilityRule } from '../types';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATION_OPTIONS = [30, 50, 60];

interface NewSlotForm {
  start_time: string;
  end_time: string;
  slot_duration_min: number;
}

const emptySlot: NewSlotForm = { start_time: '', end_time: '', slot_duration_min: 50 };

export default function AvailabilityEditorScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [addingForDay, setAddingForDay] = useState<number | null>(null);
  const [newSlot, setNewSlot] = useState<NewSlotForm>(emptySlot);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-availability'],
    queryFn: fetchMyAvailability,
  });

  useEffect(() => {
    if (data?.data?.rules) {
      setRules(data.data.rules);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateMyAvailability(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      Alert.alert(t('common.success'), t('availability.savedSuccess'));
      navigation.goBack();
    },
    onError: () => {
      Alert.alert(t('common.error'), t('availability.savedError'));
    },
  });

  const toggleDay = (dayIndex: number) => {
    setExpandedDay((prev) => (prev === dayIndex ? null : dayIndex));
    setAddingForDay(null);
    setNewSlot(emptySlot);
  };

  const slotsForDay = (dayIndex: number) =>
    rules.filter((r) => r.day_of_week === dayIndex);

  const handleAddSlot = (dayIndex: number) => {
    if (!newSlot.start_time || !newSlot.end_time) {
      Alert.alert(t('common.error'), t('availability.fillTimes'));
      return;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newSlot.start_time) || !timeRegex.test(newSlot.end_time)) {
      Alert.alert(t('common.error'), t('availability.invalidTimeFormat'));
      return;
    }
    setRules((prev) => [
      ...prev,
      {
        day_of_week: dayIndex,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        slot_duration_min: newSlot.slot_duration_min,
      },
    ]);
    setAddingForDay(null);
    setNewSlot(emptySlot);
  };

  const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
    const daySlots = slotsForDay(dayIndex);
    const ruleToRemove = daySlots[slotIndex];
    setRules((prev) =>
      prev.filter(
        (r) =>
          !(
            r.day_of_week === ruleToRemove.day_of_week &&
            r.start_time === ruleToRemove.start_time &&
            r.end_time === ruleToRemove.end_time
          ),
      ),
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackButton />
        <View style={styles.content}>
          {[...Array(7)].map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackButton />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.ink.muted} />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button title={t('common.retry')} onPress={() => refetch()} size="sm" variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('availability.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {rules.length === 0 && (
          <View style={styles.centered}>
            <Ionicons name="calendar-outline" size={48} color={Colors.ink.muted} />
            <Text style={styles.errorText}>{t('availability.emptyHint', 'Add your available time slots for each day to start receiving bookings.')}</Text>
          </View>
        )}

        {DAY_NAMES.map((dayName, index) => {
          const dayIndex = index + 1; // 1=Monday ... 7=Sunday
          const daySlots = slotsForDay(dayIndex);
          const isExpanded = expandedDay === dayIndex;

          return (
            <Card key={dayName} style={styles.dayCard}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => toggleDay(dayIndex)}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayName}>{t(`availability.days.${dayName.toLowerCase()}`)}</Text>
                  <Text style={styles.slotCount}>
                    {daySlots.length} {daySlots.length === 1 ? t('availability.slot') : t('availability.slots')}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.ink.muted}
                />
              </TouchableOpacity>

              {isExpanded && (
                <CardContent>
                  {daySlots.length === 0 ? (
                    <Text style={styles.noSlots}>{t('availability.noSlots')}</Text>
                  ) : (
                    daySlots.map((slot, slotIdx) => (
                      <View key={`${slot.start_time}-${slot.end_time}-${slotIdx}`} style={styles.slotRow}>
                        <View style={styles.slotInfo}>
                          <Ionicons name="time-outline" size={16} color={Colors.ink.muted} />
                          <Text style={styles.slotText}>
                            {slot.start_time} - {slot.end_time}
                          </Text>
                          <Text style={styles.slotDuration}>{slot.slot_duration_min} min</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveSlot(dayIndex, slotIdx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  {addingForDay === dayIndex ? (
                    <View style={styles.addForm}>
                      <View style={styles.timeRow}>
                        <View style={styles.timeField}>
                          <Input
                            label={t('availability.startTime')}
                            value={newSlot.start_time}
                            onChangeText={(v) => setNewSlot((s) => ({ ...s, start_time: v }))}
                            placeholder="HH:MM"
                            keyboardType="numbers-and-punctuation"
                          />
                        </View>
                        <View style={styles.timeField}>
                          <Input
                            label={t('availability.endTime')}
                            value={newSlot.end_time}
                            onChangeText={(v) => setNewSlot((s) => ({ ...s, end_time: v }))}
                            placeholder="HH:MM"
                            keyboardType="numbers-and-punctuation"
                          />
                        </View>
                      </View>

                      <Text style={styles.durationLabel}>{t('availability.duration')}</Text>
                      <View style={styles.durationRow}>
                        {DURATION_OPTIONS.map((dur) => (
                          <TouchableOpacity
                            key={dur}
                            style={[
                              styles.durationChip,
                              newSlot.slot_duration_min === dur && styles.durationChipActive,
                            ]}
                            onPress={() => setNewSlot((s) => ({ ...s, slot_duration_min: dur }))}
                          >
                            <Text
                              style={[
                                styles.durationChipText,
                                newSlot.slot_duration_min === dur && styles.durationChipTextActive,
                              ]}
                            >
                              {dur} min
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={styles.addFormActions}>
                        <Button
                          title={t('common.cancel')}
                          onPress={() => {
                            setAddingForDay(null);
                            setNewSlot(emptySlot);
                          }}
                          variant="ghost"
                          size="sm"
                          style={styles.addFormBtn}
                        />
                        <Button
                          title={t('availability.addSlot')}
                          onPress={() => handleAddSlot(dayIndex)}
                          size="sm"
                          style={styles.addFormBtn}
                        />
                      </View>
                    </View>
                  ) : (
                    <Button
                      title={t('availability.addSlot')}
                      onPress={() => {
                        setAddingForDay(dayIndex);
                        setNewSlot(emptySlot);
                      }}
                      variant="outline"
                      size="sm"
                      fullWidth
                      icon={<Ionicons name="add" size={16} color={Colors.ink.DEFAULT} />}
                      style={{ marginTop: Spacing.md }}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        <Button
          title={t('common.save')}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.xl, marginBottom: Spacing['4xl'] }}
        />
      </ScrollView>
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  dayCard: {
    marginBottom: Spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dayName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink.DEFAULT,
  },
  slotCount: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  noSlots: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  slotText: {
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    fontWeight: FontWeight.medium,
  },
  slotDuration: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    marginLeft: Spacing.sm,
  },
  addForm: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeField: {
    flex: 1,
  },
  durationLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
    marginBottom: Spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  durationChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream[50],
  },
  durationChipActive: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  durationChipText: {
    fontSize: FontSize.sm,
    color: Colors.ink.DEFAULT,
    fontWeight: FontWeight.medium,
  },
  durationChipTextActive: {
    color: Colors.cream[50],
  },
  addFormActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  addFormBtn: {
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
});
