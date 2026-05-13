import React, { useState, useEffect } from 'react';
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
import BackButton from '../components/_atoms/BackButton';
import Skeleton from '../components/customs/Skeleton';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { fetchMyPsychProfile, updateMyPsychProfile } from '../api/endpoints';
import type { RootStackParamList } from '../types';

export default function PsychologistEditorScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');
  const [city, setCity] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-psych-profile'],
    queryFn: fetchMyPsychProfile,
  });

  const psychologist = data?.data?.psychologist;

  useEffect(() => {
    if (psychologist) {
      setHeadline(psychologist.headline?.en || psychologist.headline?.ka || '');
      setBio(psychologist.bio?.en || psychologist.bio?.ka || '');
      setLanguages((psychologist.languages ?? []).join(', '));
      setYearsOfExperience(
        psychologist.years_of_experience != null
          ? String(psychologist.years_of_experience)
          : '',
      );
      setConsultationPrice(
        psychologist.consultation_base_price != null
          ? String(psychologist.consultation_base_price)
          : '',
      );
      setCity(psychologist.city || '');
    }
  }, [psychologist]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMyPsychProfile({
        headline: { en: headline, ka: headline },
        bio: { en: bio, ka: bio },
        languages: languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
        years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : null,
        consultation_base_price: consultationPrice ? Number(consultationPrice) : 0,
        city: city || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-psych-profile'] });
      Alert.alert(t('common.success'), t('psychEditor.savedSuccess'));
      navigation.goBack();
    },
    onError: () => {
      Alert.alert(t('common.error'), t('psychEditor.savedError'));
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackButton />
        <View style={styles.content}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={{ marginBottom: Spacing.xl }}>
              <Skeleton width="40%" height={14} style={{ marginBottom: Spacing.sm }} />
              <Skeleton height={44} />
            </View>
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
      <BackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('psychEditor.title')}</Text>

          <Input
            label={t('psychEditor.headline')}
            value={headline}
            onChangeText={setHeadline}
            placeholder={t('psychEditor.headlinePlaceholder')}
            multiline
            numberOfLines={2}
            style={styles.multilineInput}
          />

          <Input
            label={t('psychEditor.bio')}
            value={bio}
            onChangeText={setBio}
            placeholder={t('psychEditor.bioPlaceholder')}
            multiline
            numberOfLines={6}
            style={styles.bioInput}
          />

          <Input
            label={t('psychEditor.languages')}
            value={languages}
            onChangeText={setLanguages}
            placeholder={t('psychEditor.languagesPlaceholder')}
          />

          <Input
            label={t('psychEditor.yearsOfExperience')}
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            keyboardType="numeric"
            placeholder="0"
          />

          <Input
            label={t('psychEditor.consultationPrice')}
            value={consultationPrice}
            onChangeText={setConsultationPrice}
            keyboardType="numeric"
            placeholder="0"
          />

          <Input
            label={t('psychEditor.city')}
            value={city}
            onChangeText={setCity}
            placeholder={t('psychEditor.cityPlaceholder')}
          />

          <Button
            title={t('common.save')}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />

          <Button
            title={t('common.cancel')}
            onPress={() => navigation.goBack()}
            variant="ghost"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
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
  content: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    marginBottom: Spacing['2xl'],
    letterSpacing: -0.5,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
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
