/* One-off: merge web (next-intl) namespaces into the app (i18next) locale files.
   Converts {x} -> {{x}} placeholders. Web keys win on conflicts; app-only keys kept. */
const fs = require('fs');
const path = require('path');

const WEB = '/Users/mac/Desktop/TalkRestWeb/messages';
const APP = path.join(__dirname, '..', 'src', 'i18n', 'locales');

const conv = (v) => {
  if (typeof v === 'string') return v.replace(/\{(\w+)\}/g, '{{$1}}');
  if (Array.isArray(v)) return v.map(conv);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = conv(v[k]);
    return o;
  }
  return v;
};

// deep-merge: base first, then override wins, but keep base-only keys
const merge = (base, over) => {
  const out = { ...(base || {}) };
  for (const k of Object.keys(over || {})) {
    if (
      over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) &&
      out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])
    ) {
      out[k] = merge(out[k], over[k]);
    } else {
      out[k] = over[k];
    }
  }
  return out;
};

const refund = {
  ka: {
    button: 'Refund მოთხოვნა', title: 'Refund-ის მოთხოვნა',
    reasonLabel: 'მიზეზი', reasonPlaceholder: 'აღწერე რატომ მოითხოვე თანხის დაბრუნება…',
    reasonRequired: 'გთხოვ, მიუთითე მიზეზი (მინიმუმ 10 სიმბოლო).',
    submit: 'მოთხოვნის გაგზავნა', submitting: 'გაგზავნა…', cancel: 'გაუქმება',
    checkFailed: 'შემოწმება ვერ მოხერხდა.', sendFailed: 'მოთხოვნის გაგზავნა ვერ მოხერხდა.',
    success: 'მოთხოვნა გაიგზავნა. ჩვენი გუნდი 5 სამუშაო დღეში განიხილავს და დაგიკავშირდება. დამტკიცების შემთხვევაში თანხა დაგერიცხება ბალანსზე.',
    eligible: 'დასაშვებია. ნანახი: {{watched}} წთ / {{max}} წთ ლიმიტი. დასაბრუნებელი თანხა: {{amount}} {{currency}} → ბალანსზე ერიცხება.',
    ineligible: 'კურსი უკვე {{watched}} წუთზე მეტია ნანახი — refund-ი აღარ შეიძლება. პოლიტიკის მიხედვით ლიმიტია {{max}} წუთი.',
  },
  en: {
    button: 'Request refund', title: 'Request a refund',
    reasonLabel: 'Reason', reasonPlaceholder: 'Describe why you requested a refund…',
    reasonRequired: 'Please provide a reason (at least 10 characters).',
    submit: 'Send request', submitting: 'Sending…', cancel: 'Cancel',
    checkFailed: 'Check failed.', sendFailed: 'Could not send the request.',
    success: 'Request sent. Our team will review it within 5 business days and get back to you. If approved, the amount is credited to your balance.',
    eligible: 'Eligible. Watched: {{watched}} min / {{max}} min limit. Refund amount: {{amount}} {{currency}} → credited to balance.',
    ineligible: 'You have already watched more than {{watched}} minutes — refund is no longer possible. The policy limit is {{max}} minutes.',
  },
  ru: {
    button: 'Запросить возврат', title: 'Запрос на возврат',
    reasonLabel: 'Причина', reasonPlaceholder: 'Опишите, почему вы запросили возврат…',
    reasonRequired: 'Укажите причину (минимум 10 символов).',
    submit: 'Отправить запрос', submitting: 'Отправка…', cancel: 'Отмена',
    checkFailed: 'Проверка не удалась.', sendFailed: 'Не удалось отправить запрос.',
    success: 'Запрос отправлен. Команда рассмотрит его в течение 5 рабочих дней. При одобрении сумма зачисляется на баланс.',
    eligible: 'Доступно. Просмотрено: {{watched}} мин / лимит {{max}} мин. Сумма к возврату: {{amount}} {{currency}} → на баланс.',
    ineligible: 'Просмотрено более {{watched}} минут — возврат больше невозможен. Лимит по политике — {{max}} минут.',
  },
};

for (const f of ['ka', 'en', 'ru']) {
  const web = JSON.parse(fs.readFileSync(path.join(WEB, `${f}.json`), 'utf8'));
  const appPath = path.join(APP, `${f}.json`);
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

  app.ai = merge(app.ai, conv(web.ai));
  app.reviews = merge(app.reviews, conv(web.reviews));
  app.availability = merge(conv(web.availability), app.availability);
  app.chat = merge(app.chat, conv(web.chat));
  app.refund = merge(app.refund, refund[f]);

  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n', 'utf8');
  console.log(`merged ${f}: ai/reviews/availability/chat/refund`);
}
