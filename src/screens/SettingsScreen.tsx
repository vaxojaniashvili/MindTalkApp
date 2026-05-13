import React from 'react';
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
import BackButton from '../components/_atoms/BackButton';
import Button from '../components/_atoms/Button';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../types';

type MenuItemDef = {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  screen: keyof RootStackParamList;
};

const MENU_ITEMS: MenuItemDef[] = [
  { icon: 'person-outline', labelKey: 'settings.editProfile', screen: 'EditProfile' },
  { icon: 'wallet-outline', labelKey: 'settings.wallet', screen: 'Wallet' },
  { icon: 'card-outline', labelKey: 'settings.subscriptions', screen: 'Subscriptions' },
  { icon: 'calendar-outline', labelKey: 'settings.consultations', screen: 'Consultations' },
  { icon: 'book-outline', labelKey: 'settings.myCourses', screen: 'MyCourses' },
  { icon: 'chatbubbles-outline', labelKey: 'settings.chatSessions', screen: 'ChatSessions' },
  { icon: 'notifications-outline', labelKey: 'settings.notifications', screen: 'Notifications' },
  { icon: 'information-circle-outline', labelKey: 'settings.about', screen: 'About' },
  { icon: 'help-circle-outline', labelKey: 'settings.faq', screen: 'FAQ' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAuthStore((s) => s.logout);

  const handleLanguageChange = () => {
    const langs = ['ka', 'en', 'ru'];
    const currentIdx = langs.indexOf(i18n.language);
    const next = langs[(currentIdx + 1) % langs.length];
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>{t('settings.title')}</Text>

        {/* Menu items */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => navigation.navigate(item.screen as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={Colors.primary.ink}
                  />
                </View>
                <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.ink.muted}
                />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Language switcher */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.langRow}
            onPress={handleLanguageChange}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="language-outline"
                size={20}
                color={Colors.primary.ink}
              />
            </View>
            <Text style={styles.menuLabel}>
              {t('settings.language')}
            </Text>
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>
                {i18n.language.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title={t('auth.logout')}
            onPress={handleLogout}
            variant="destructive"
            fullWidth
            icon={
              <Ionicons
                name="log-out-outline"
                size={18}
                color={Colors.cream[50]}
              />
            }
          />
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
  // Menu card
  menuCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.xl + 36 + Spacing.md,
  },
  // Section
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  // Language row
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  langBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
  },
  langBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
    letterSpacing: 1,
  },
});
