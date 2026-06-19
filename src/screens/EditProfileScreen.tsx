import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/_atoms/Input';
import Button from '../components/_atoms/Button';
import BackButton from '../components/_atoms/BackButton';
import Avatar from '../components/_atoms/Avatar';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { updateProfile, uploadAvatar, fetchCountries } from '../api/endpoints';
import { useLocale } from '../hooks/useLocale';
import type { ApiProfile } from '../types';

type Gender = NonNullable<ApiProfile['gender']>;
type Lang = 'ka' | 'en' | 'ru';

const GENDERS: Gender[] = ['male', 'female', 'other', 'prefer_not'];
const GENDER_LABEL: Record<Gender, string> = {
  male: 'male',
  female: 'female',
  other: 'other',
  prefer_not: 'preferNot',
};
const LANGS: Lang[] = ['ka', 'en', 'ru'];
const LANG_LABEL: Record<Lang, string> = { ka: 'ქართული', en: 'English', ru: 'Русский' };

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { localize } = useLocale();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const profile = user?.profile;

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [dob, setDob] = useState(profile?.date_of_birth || '');
  const [countryId, setCountryId] = useState<number | null>(profile?.country?.id ?? null);
  const [prefLang, setPrefLang] = useState<Lang | null>(profile?.preferred_language ?? null);
  const [consent, setConsent] = useState(!!profile?.marketing_consent);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [countryModal, setCountryModal] = useState(false);

  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });
  const countries = countriesData?.data?.countries ?? [];
  const selectedCountry = countries.find((c) => c.id === countryId);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.error'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      const name = asset.fileName || `avatar.jpg`;
      const type = asset.mimeType || 'image/jpeg';
      form.append('avatar', { uri: asset.uri, name, type } as any);
      const { data } = await uploadAvatar(form);
      setAvatarUrl(data.avatar_url);
      await refreshUser();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: displayName || null,
        city: city || null,
        gender,
        date_of_birth: dob || null,
        // country sent as country_id — backend expects the id
        ...(countryId ? ({ country_id: countryId } as any) : {}),
        preferred_language: prefLang,
        marketing_consent: consent,
      });
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
          <Text style={styles.title}>{t('profile.editProfile')}</Text>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View>
              <Avatar uri={avatarUrl} name={displayName || firstName || user?.email || 'U'} size={88} />
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={Colors.cream[50]} />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickAvatar} disabled={uploading}>
              <Ionicons name="camera-outline" size={16} color={Colors.primary.ink} />
              <Text style={styles.changePhotoText}>{t('profile.changePhoto')}</Text>
            </TouchableOpacity>
          </View>

          <Input label={t('profile.firstName')} value={firstName} onChangeText={setFirstName} />
          <Input label={t('profile.lastName')} value={lastName} onChangeText={setLastName} />
          <Input label={t('profile.displayName')} value={displayName} onChangeText={setDisplayName} />

          {/* Gender */}
          <Text style={styles.fieldLabel}>{t('profile.gender')}</Text>
          <View style={styles.segmentRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.segment, gender === g && styles.segmentActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.segmentText, gender === g && styles.segmentTextActive]}>
                  {t(`profile.${GENDER_LABEL[g]}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DOB */}
          <Input
            label={t('profile.dateOfBirth')}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.hint}>{t('profile.dobHint')}</Text>

          {/* Country */}
          <Text style={styles.fieldLabel}>{t('profile.country')}</Text>
          <TouchableOpacity style={styles.selectField} onPress={() => setCountryModal(true)}>
            <Text style={[styles.selectText, !selectedCountry && styles.selectPlaceholder]}>
              {selectedCountry ? localize(selectedCountry.name) : t('profile.selectCountry')}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.ink.muted} />
          </TouchableOpacity>

          <Input label={t('profile.city')} value={city} onChangeText={setCity} />

          {/* Preferred language */}
          <Text style={styles.fieldLabel}>{t('profile.language')}</Text>
          <View style={styles.segmentRow}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.segment, prefLang === l && styles.segmentActive]}
                onPress={() => setPrefLang(l)}
              >
                <Text style={[styles.segmentText, prefLang === l && styles.segmentTextActive]}>
                  {LANG_LABEL[l]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Marketing consent */}
          <View style={styles.consentRow}>
            <Text style={styles.consentText}>{t('profile.marketingConsent')}</Text>
            <Switch
              value={consent}
              onValueChange={setConsent}
              trackColor={{ true: Colors.primary[400], false: Colors.ink[20] }}
              thumbColor={Colors.cream[50]}
            />
          </View>

          <Button
            title={t('common.save')}
            onPress={handleSave}
            loading={loading}
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

      {/* Country modal */}
      <Modal visible={countryModal} animationType="slide" transparent onRequestClose={() => setCountryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectCountry')}</Text>
              <TouchableOpacity onPress={() => setCountryModal(false)}>
                <Ionicons name="close" size={22} color={Colors.ink.soft} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    setCountryId(item.id);
                    setCountryModal(false);
                  }}
                >
                  <Text style={styles.countryName}>{localize(item.name)}</Text>
                  {countryId === item.id && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary.ink} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream.DEFAULT },
  flex: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.primary.ink,
    marginBottom: Spacing.xl,
    letterSpacing: -0.5,
  },
  avatarSection: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(15,48,44,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  changePhotoText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.primary.ink },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  segment: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  segmentActive: { backgroundColor: Colors.primary.ink, borderColor: Colors.primary.ink },
  segmentText: { fontSize: FontSize.sm, color: Colors.ink.soft },
  segmentTextActive: { color: Colors.cream[50], fontWeight: FontWeight.medium },
  hint: { fontSize: FontSize.xs, color: Colors.ink.muted, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cream[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  selectText: { fontSize: FontSize.base, color: Colors.ink.DEFAULT },
  selectPlaceholder: { color: Colors.ink.muted },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  consentText: { flex: 1, fontSize: FontSize.sm, color: Colors.ink.soft, lineHeight: 20 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,48,44,0.4)' },
  modalSheet: {
    maxHeight: '75%',
    backgroundColor: Colors.cream.DEFAULT,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.primary.ink },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryName: { fontSize: FontSize.base, color: Colors.ink.DEFAULT },
});
