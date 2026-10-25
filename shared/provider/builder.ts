import { normHex } from './theme.ts'
import { headerValue } from './mocks'
import { subscriptionTypes, subscriptionTypeText } from './standard'
import type { BilingualText } from '../site/routes'

export type FieldKey = 'subscriptionType' | 'name' | 'announce' | 'hex' | 'buy' | 'support' | 'used' | 'total'
export type BuilderState = Record<FieldKey, string | number>
export type BuilderField = {
  key: FieldKey, header?: string, label: BilingualText, type: 'text' | 'textarea' | 'color' | 'url' | 'number' | 'select',
  options?: Array<{ value: string, label: BilingualText }>,
  max?: number, min?: number, value?: string | number, row?: string, hint?: BilingualText,
  placeholder?: string, validate?: (value: string) => BilingualText | null,
}
const https = (value: string): BilingualText | null => {
  try { return new URL(value).protocol === 'https:' ? null : { ru: 'Нужна ссылка с https://', en: 'Use an https:// link' } }
  catch { return { ru: 'Это не похоже на ссылку', en: 'This does not look like a link' } }
}
export const builderSchema: Array<{ id: string, title: BilingualText, open?: boolean, note?: BilingualText, fields: BuilderField[] }> = [
  { id: 'service', title: { ru: 'Сервис', en: 'Service' }, open: true, fields: [
    { key: 'name', header: 'ReClash-ServiceName', label: { ru: 'Имя сервиса', en: 'Service name' }, type: 'text', max: 160, value: 'ReClash' },
    { key: 'subscriptionType', header: 'ReClash-SubscriptionType', label: { ru: 'Тип подписки', en: 'Subscription type' }, type: 'select',
      options: [{ value: '', label: { ru: 'Обычная — без бейджа', en: 'Regular — no badge' } }, ...Object.entries(subscriptionTypes).map(([value, label]) => ({ value, label }))],
      hint: { ru: 'Бейдж показывается при импорте и на сохранённом профиле. Тип не меняет доступ и настройки.', en: 'The badge appears during import and on the saved profile. The type does not change access or settings.' },
      validate: value => !value || subscriptionTypeText(value) ? null : { ru: 'Выберите поддерживаемый тип подписки', en: 'Choose a supported subscription type' } },
    { key: 'announce', header: 'ReClash-Announce', label: { ru: 'Объявление', en: 'Announcement' }, type: 'textarea', max: 1024,
      hint: { ru: 'До 1024 символов; не-ASCII и переносы кодируются в base64:.', en: 'Up to 1024 characters; non-ASCII text and line breaks are encoded as base64:.' } },
  ] },
  { id: 'theme', title: { ru: 'Тема', en: 'Theme' }, fields: [
    { key: 'hex', header: 'ReClash-View', label: { ru: 'Цвет', en: 'Color' }, type: 'color', value: '7C5CFF',
      hint: { ru: 'Цвет передаётся через ReClash-View: app.color:RRGGBB. Превью — схема данных, не скриншот.', en: 'The color is sent as ReClash-View: app.color:RRGGBB. The preview illustrates data; it is not a screenshot.' },
      validate: value => !value || normHex(value) ? null : { ru: 'Нужно 6 или 8 шестнадцатеричных символов', en: 'Use 6 or 8 hexadecimal characters' } },
  ] },
  { id: 'links', title: { ru: 'Ссылки', en: 'Links' }, fields: [
    { key: 'buy', header: 'ReClash-BuyPlan', label: { ru: 'Продление тарифа', en: 'Plan renewal' }, type: 'url', placeholder: 'https://', validate: https,
      hint: { ru: 'Даёт кнопку «Продлить» на карточке подписки.', en: 'Adds a Renew button to the subscription card.' } },
    { key: 'support', header: 'ReClash-SupportURL', label: { ru: 'Поддержка', en: 'Support' }, type: 'url', placeholder: 'https://', validate: https },
  ] },
  { id: 'sub', title: { ru: 'Трафик для превью', en: 'Preview traffic' },
    note: { ru: 'subscription-userinfo панель отдаёт сама — здесь цифры только для превью.', en: 'The panel supplies subscription-userinfo itself. These figures are only for the preview.' },
    fields: [
      { key: 'used', label: { ru: 'Израсходовано, ГБ', en: 'Used, GB' }, type: 'number', value: 62, min: 0, row: 'traffic' },
      { key: 'total', label: { ru: 'Лимит, ГБ', en: 'Limit, GB' }, type: 'number', value: 200, min: 0, row: 'traffic', hint: { ru: '0 — без ограничений', en: '0 means unlimited' } },
    ] },
]
export const builderFields = builderSchema.flatMap(section => section.fields)
export const builderDefaults = () => Object.fromEntries(builderFields.map(field => [field.key, field.value ?? ''])) as BuilderState
export function headerPairs(state: BuilderState): Array<[string, string]> {
  const out: Array<[string, string]> = []
  if (state.used || state.total) out.push(['subscription-userinfo', `upload=0; download=${Math.round(Number(state.used) * 1024 ** 3)}; total=${Math.round(Number(state.total) * 1024 ** 3)}`])
  for (const field of builderFields) {
    const value = String(state[field.key] ?? '').trim()
    if (field.header && value && !field.validate?.(value)) out.push([field.header, field.type === 'color' ? `app.color:${normHex(value)!}` : headerValue(value)])
  }
  return out
}
export const builderEmitters = {
  headers: { label: { ru: 'Заголовки', en: 'Headers' }, line: (key: string, value: string) => ({ before: '', key: `${key}:`, after: ` ${value}` }) },
  nginx: { label: { ru: 'nginx', en: 'nginx' }, line: (key: string, value: string) => ({ before: 'add_header ', key, after: ` "${value.replace(/"/g, '\\"')}" always;` }) },
}
