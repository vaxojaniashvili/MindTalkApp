import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/_atoms/Input';
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
import { sendOtp, registerApi, submitAiBio } from '../api/endpoints';
import type { RootStackParamList } from '../types';

type Role = 'client' | 'psychologist';

const TOTAL_STEPS = 5;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const MIN_PASSWORD_LENGTH = 8;
const MIN_BIO_LENGTH = 50;

interface FormData {
  role: Role;
  phone: string;
  otp: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio: string;
  devCode?: string;
}

const initialFormData: FormData = {
  role: 'client',
  phone: '',
  otp: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  bio: '',
};

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const register = useAuthStore((s) => s.register);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...initialFormData });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRef = useRef<TextInput>(null);

  // ─── Resend timer countdown ───
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ─── Auto-advance on OTP complete ───
  useEffect(() => {
    if (form.otp.length === OTP_LENGTH && currentStep === 2) {
      handleOtpVerified();
    }
  }, [form.otp]);

  const updateForm = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError('');
    },
    [],
  );

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 7)
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
  };

  // ─── Step 1: Send OTP ───
  const handleSendOtp = async () => {
    const cleaned = form.phone.replace(/\D/g, '');
    if (cleaned.length !== 9) {
      setError(t('auth.phoneInvalid', { defaultValue: 'Phone number must be 9 digits' }));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fullPhone = `+995${cleaned}`;
      const { data } = await sendOtp(fullPhone);
      if (data._dev_code) {
        updateForm('devCode', data._dev_code);
      }
      setResendTimer(RESEND_COOLDOWN);
      setCurrentStep(2);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        t('common.error', { defaultValue: 'Something went wrong' });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: OTP verified → go to step 3 ───
  const handleOtpVerified = () => {
    setCurrentStep(3);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    const cleaned = form.phone.replace(/\D/g, '');
    setLoading(true);
    try {
      const { data } = await sendOtp(`+995${cleaned}`);
      if (data._dev_code) {
        updateForm('devCode', data._dev_code);
      }
      setResendTimer(RESEND_COOLDOWN);
    } catch {
      setError(t('common.error', { defaultValue: 'Something went wrong' }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Register ───
  const handleRegister = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t('auth.nameRequired', { defaultValue: 'First and last name are required' }));
      return;
    }
    if (!form.email.trim()) {
      setError(t('auth.emailRequired', { defaultValue: 'Email is required' }));
      return;
    }
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(
        t('auth.passwordTooShort', {
          defaultValue: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        }),
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('auth.confirmPassword', { defaultValue: 'Passwords do not match' }));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cleaned = form.phone.replace(/\D/g, '');
      await register({
        phone: `+995${cleaned}`,
        otp_code: form.otp,
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.confirmPassword,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        role: form.role,
        locale: i18n.language,
      });
      setCurrentStep(4);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        t('common.error', { defaultValue: 'Something went wrong' });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: Submit bio (clients) ───
  const handleSubmitBio = async () => {
    if (form.bio.length < MIN_BIO_LENGTH) {
      setError(
        t('auth.bioTooShort', {
          defaultValue: `Bio must be at least ${MIN_BIO_LENGTH} characters`,
        }),
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitAiBio({ bio_text: form.bio.trim(), tags: [] });
      setCurrentStep(5);
    } catch {
      setError(t('common.error', { defaultValue: 'Something went wrong' }));
    } finally {
      setLoading(false);
    }
  };

  // ─── Navigation ───
  const handleBack = () => {
    setError('');
    if (currentStep === 1) {
      navigation.goBack();
    } else if (currentStep === 2) {
      setCurrentStep(1);
      updateForm('otp', '');
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGetStarted = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  // ─── Step Indicator ───
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <View
            key={step}
            style={[
              styles.stepDot,
              isActive && styles.stepDotActive,
              isCompleted && styles.stepDotCompleted,
              !isActive && !isCompleted && styles.stepDotPending,
            ]}
          />
        );
      })}
    </View>
  );

  // ─── Step 1: Phone & Role ───
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        {t('auth.createAccount', { defaultValue: 'Create your account' })}
      </Text>
      <Text style={styles.stepSubtitle}>
        {t('auth.selectRoleAndPhone', {
          defaultValue: 'Select your role and enter your phone number',
        })}
      </Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleCard, form.role === 'client' && styles.roleCardActive]}
          onPress={() => updateForm('role', 'client')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={form.role === 'client' ? Colors.cream[50] : Colors.ink.DEFAULT}
          />
          <Text
            style={[styles.roleCardText, form.role === 'client' && styles.roleCardTextActive]}
          >
            {t('auth.registerAsClient', { defaultValue: 'Client' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleCard, form.role === 'psychologist' && styles.roleCardActive]}
          onPress={() => updateForm('role', 'psychologist')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="medical-outline"
            size={24}
            color={form.role === 'psychologist' ? Colors.cream[50] : Colors.ink.DEFAULT}
          />
          <Text
            style={[
              styles.roleCardText,
              form.role === 'psychologist' && styles.roleCardTextActive,
            ]}
          >
            {t('auth.registerAsPsychologist', { defaultValue: 'Psychologist' })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phone input */}
      <Text style={styles.inputLabel}>
        {t('auth.phone', { defaultValue: 'Phone number' })}
      </Text>
      <View style={styles.phoneRow}>
        <View style={styles.phonePrefix}>
          <Text style={styles.phonePrefixText}>+995</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          value={formatPhone(form.phone)}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '').slice(0, 9);
            updateForm('phone', digits);
          }}
          keyboardType="phone-pad"
          placeholder="5XX XX XX XX"
          placeholderTextColor={Colors.ink.muted}
          maxLength={12}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={t('common.continue', { defaultValue: 'Continue' })}
        onPress={handleSendOtp}
        loading={loading}
        fullWidth
        size="lg"
        style={{ marginTop: Spacing.xl }}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {t('auth.hasAccount', { defaultValue: 'Already have an account?' })}
        </Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.switchLink}>
            {t('auth.login', { defaultValue: 'Log in' })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 2: OTP ───
  const renderStep2 = () => {
    const cleaned = form.phone.replace(/\D/g, '');
    const displayPhone = `+995 ${formatPhone(cleaned)}`;
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          {t('auth.verifyPhone', { defaultValue: 'Verify your phone' })}
        </Text>
        <Text style={styles.stepSubtitle}>
          {t('auth.otpSentTo', {
            defaultValue: `We sent a code to ${displayPhone}`,
            phone: displayPhone,
          })}
        </Text>

        {form.devCode ? (
          <View style={styles.devCodeBanner}>
            <Text style={styles.devCodeText}>Dev code: {form.devCode}</Text>
          </View>
        ) : null}

        {/* OTP Input */}
        <TextInput
          ref={otpInputRef}
          style={styles.otpInput}
          value={form.otp}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
            updateForm('otp', digits);
          }}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
          textContentType="oneTimeCode"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResendOtp}
          disabled={resendTimer > 0 || loading}
          style={styles.resendButton}
        >
          <Text
            style={[
              styles.resendText,
              resendTimer > 0 && styles.resendTextDisabled,
            ]}
          >
            {resendTimer > 0
              ? t('auth.resendIn', {
                  defaultValue: `Resend code in ${resendTimer}s`,
                  seconds: resendTimer,
                })
              : t('auth.resendCode', { defaultValue: 'Resend Code' })}
          </Text>
        </TouchableOpacity>

        {/* Change phone */}
        <TouchableOpacity
          onPress={() => {
            updateForm('otp', '');
            setCurrentStep(1);
          }}
          style={styles.changePhoneButton}
        >
          <Text style={styles.changePhoneText}>
            {t('auth.changePhone', { defaultValue: 'Change phone number' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Step 3: Details ───
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        {t('auth.yourDetails', { defaultValue: 'Your details' })}
      </Text>
      <Text style={styles.stepSubtitle}>
        {t('auth.fillInDetails', { defaultValue: 'Fill in your information to continue' })}
      </Text>

      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <Input
            label={t('auth.firstName', { defaultValue: 'First name' })}
            value={form.firstName}
            onChangeText={(v) => updateForm('firstName', v)}
            autoCapitalize="words"
            autoComplete="given-name"
          />
        </View>
        <View style={styles.nameField}>
          <Input
            label={t('auth.lastName', { defaultValue: 'Last name' })}
            value={form.lastName}
            onChangeText={(v) => updateForm('lastName', v)}
            autoCapitalize="words"
            autoComplete="family-name"
          />
        </View>
      </View>

      <Input
        label={t('auth.email', { defaultValue: 'Email' })}
        value={form.email}
        onChangeText={(v) => updateForm('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      {/* Password with eye toggle */}
      <Text style={styles.inputLabel}>
        {t('auth.password', { defaultValue: 'Password' })}
      </Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          value={form.password}
          onChangeText={(v) => updateForm('password', v)}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          placeholderTextColor={Colors.ink.muted}
          placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Min 8 characters' })}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          style={styles.eyeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.ink.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Confirm password */}
      <Text style={styles.inputLabel}>
        {t('auth.confirmPassword', { defaultValue: 'Confirm password' })}
      </Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          value={form.confirmPassword}
          onChangeText={(v) => updateForm('confirmPassword', v)}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          placeholderTextColor={Colors.ink.muted}
          placeholder={t('auth.confirmPasswordPlaceholder', {
            defaultValue: 'Re-enter password',
          })}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword((v) => !v)}
          style={styles.eyeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.ink.muted}
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={t('common.continue', { defaultValue: 'Continue' })}
        onPress={handleRegister}
        loading={loading}
        fullWidth
        size="lg"
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );

  // ─── Step 4: Bio (Client) / Documents (Psychologist) ───
  const renderStep4Client = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        {t('auth.tellUsAboutYou', { defaultValue: 'Tell us about yourself' })}
      </Text>
      <Text style={styles.stepSubtitle}>
        {t('auth.bioDescription', {
          defaultValue:
            'Write a short bio so we can match you with the right psychologist.',
        })}
      </Text>

      <TextInput
        style={styles.bioInput}
        value={form.bio}
        onChangeText={(v) => updateForm('bio', v)}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        placeholder={t('auth.bioPlaceholder', {
          defaultValue:
            'Describe what brings you here, what you hope to achieve, and any preferences you have...',
        })}
        placeholderTextColor={Colors.ink.muted}
      />
      <Text
        style={[
          styles.charCount,
          form.bio.length >= MIN_BIO_LENGTH && styles.charCountValid,
        ]}
      >
        {form.bio.length}/{MIN_BIO_LENGTH} {t('auth.minChars', { defaultValue: 'min characters' })}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={t('common.continue', { defaultValue: 'Continue' })}
        onPress={handleSubmitBio}
        loading={loading}
        fullWidth
        size="lg"
        style={{ marginTop: Spacing.lg }}
      />

      <TouchableOpacity
        onPress={() => setCurrentStep(5)}
        style={styles.skipButton}
      >
        <Text style={styles.skipText}>
          {t('common.skip', { defaultValue: 'Skip for now' })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4Psychologist = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        {t('auth.uploadDocuments', { defaultValue: 'Upload your documents' })}
      </Text>
      <Text style={styles.stepSubtitle}>
        {t('auth.documentsDescription', {
          defaultValue:
            'Upload your diploma and any certificates to verify your credentials.',
        })}
      </Text>

      {/* Diploma */}
      <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7}>
        <Ionicons name="document-text-outline" size={28} color={Colors.primary.ink} />
        <View style={styles.uploadCardContent}>
          <Text style={styles.uploadCardTitle}>
            {t('auth.uploadDiploma', { defaultValue: 'Upload Diploma' })}
          </Text>
          <Text style={styles.uploadCardSubtitle}>
            {t('auth.diplomaFormats', { defaultValue: 'PDF, JPG or PNG' })}
          </Text>
        </View>
        <Ionicons name="cloud-upload-outline" size={22} color={Colors.ink.muted} />
      </TouchableOpacity>

      {/* Certificates */}
      <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7}>
        <Ionicons name="ribbon-outline" size={28} color={Colors.primary.ink} />
        <View style={styles.uploadCardContent}>
          <Text style={styles.uploadCardTitle}>
            {t('auth.uploadCertificates', { defaultValue: 'Upload Certificates' })}
          </Text>
          <Text style={styles.uploadCardSubtitle}>
            {t('auth.certificatesFormats', {
              defaultValue: 'PDF, JPG or PNG (multiple allowed)',
            })}
          </Text>
        </View>
        <Ionicons name="cloud-upload-outline" size={22} color={Colors.ink.muted} />
      </TouchableOpacity>

      <View style={styles.infoRow}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.ink.muted} />
        <Text style={styles.infoText}>
          {t('auth.documentsInfo', {
            defaultValue:
              'Your documents will be reviewed by our team. Accepted formats: PDF, JPG, PNG. Max 10MB per file.',
          })}
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={t('common.continue', { defaultValue: 'Continue' })}
        onPress={() => setCurrentStep(5)}
        fullWidth
        size="lg"
        style={{ marginTop: Spacing.xl }}
      />

      <TouchableOpacity
        onPress={() => setCurrentStep(5)}
        style={styles.skipButton}
      >
        <Text style={styles.skipText}>
          {t('common.skip', { defaultValue: 'Skip for now' })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Step 5: Success ───
  const renderStep5 = () => (
    <View style={[styles.stepContainer, styles.centeredStep]}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={styles.successTitle}>
        {t('auth.registrationComplete', { defaultValue: 'Registration Complete!' })}
      </Text>
      <Text style={styles.successSubtitle}>
        {form.role === 'client'
          ? t('auth.clientWelcome', {
              defaultValue:
                'Your account is ready. Start exploring psychologists and courses tailored for you.',
            })
          : t('auth.psychologistWelcome', {
              defaultValue:
                'Your account is ready. We will review your documents and notify you once verified.',
            })}
      </Text>
      <Button
        title={t('auth.getStarted', { defaultValue: 'Get Started' })}
        onPress={handleGetStarted}
        fullWidth
        size="lg"
        style={{ marginTop: Spacing['3xl'] }}
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return form.role === 'client' ? renderStep4Client() : renderStep4Psychologist();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.ink.DEFAULT} />
          </TouchableOpacity>
          {renderStepIndicator()}
          {/* Spacer for alignment */}
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },

  // ─── Step Indicator ───
  stepIndicatorRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepDot: {
    borderRadius: BorderRadius.full,
  },
  stepDotActive: {
    width: 10,
    height: 10,
    backgroundColor: Colors.primary.ink,
  },
  stepDotCompleted: {
    width: 8,
    height: 8,
    backgroundColor: Colors.primary[400],
  },
  stepDotPending: {
    width: 8,
    height: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.cream[300],
  },

  // ─── Step Container ───
  stepContainer: {
    paddingTop: Spacing['2xl'],
  },
  centeredStep: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },

  // ─── Role Cards ───
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  roleCard: {
    flex: 1,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cream[100],
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleCardActive: {
    backgroundColor: Colors.primary.ink,
    borderColor: Colors.primary.ink,
  },
  roleCardText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  roleCardTextActive: {
    color: Colors.cream[50],
  },

  // ─── Phone Input ───
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink.soft,
    marginBottom: Spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  phonePrefix: {
    backgroundColor: Colors.cream[200],
    borderWidth: 1,
    borderColor: Colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phonePrefixText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    backgroundColor: Colors.cream[50],
  },

  // ─── OTP ───
  otpInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    backgroundColor: Colors.cream[50],
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: Spacing.xl,
  },
  devCodeBanner: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  devCodeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  resendText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.ink,
  },
  resendTextDisabled: {
    color: Colors.ink.muted,
    fontWeight: FontWeight.normal,
  },
  changePhoneButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  changePhoneText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
    textDecorationLine: 'underline',
  },

  // ─── Name Row ───
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameField: {
    flex: 1,
  },

  // ─── Password ───
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cream[50],
    marginBottom: Spacing.lg,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
  },
  eyeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  // ─── Bio ───
  bioInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.ink.DEFAULT,
    backgroundColor: Colors.cream[50],
    minHeight: 150,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    textAlign: 'right',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  charCountValid: {
    color: Colors.success,
  },

  // ─── Upload Cards ───
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream[50],
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  uploadCardContent: {
    flex: 1,
  },
  uploadCardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink.DEFAULT,
  },
  uploadCardSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.cream[100],
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.ink.muted,
    lineHeight: 17,
  },

  // ─── Success ───
  successTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink.DEFAULT,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // ─── Shared ───
  error: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing['2xl'],
  },
  switchText: {
    fontSize: FontSize.sm,
    color: Colors.ink.muted,
  },
  switchLink: {
    fontSize: FontSize.sm,
    color: Colors.primary.ink,
    fontWeight: FontWeight.semibold,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  skipText: {
    fontSize: FontSize.base,
    color: Colors.ink.muted,
    textDecorationLine: 'underline',
  },
});
