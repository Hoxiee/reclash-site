import { normHex } from './theme.ts'
import type { BilingualText } from '../site/routes'

export type FieldKey = 'name' | 'announce' | 'hex' | 'buy' | 'support' | 'used' | 'total'
export type BuilderState = Record<FieldKey, string | number>
export type BuilderField = {
  key: FieldKey, header?: string, label: BilingualText, type: 'text' | 'textarea' | 'color' | 'url' | 'number',
  max?: number, min?: number, value?: string | number, row?: string, hint?: BilingualText,
  placeholder?: string, validate?: (value: string) => BilingualText | null,
}
const https = (value: string): BilingualText | null => {
  try { return new URL(value).protocol === 'https:' ? null : { ru: 'Нужна ссылка с https://', en: 'Use an https:// link' } }
  catch { return { ru: 'Это не похоже на ссылку', en: 'This does not look like a link' } }
}
// The archive's draft schema is shared by the form, validation, output and preview.
export const builderSchema: Array<{ id: string, title: BilingualText, open?: boolean, note?: BilingualText, fields: BuilderField[] }> = [
  { id: 'service', title: { ru: 'Сервис', en: 'Service' }, open: true, fields: [
    { key: 'name', header: 'ReClash-ServiceName', label: { ru: 'Имя сервиса', en: 'Service name' }, type: 'text', max: 32, value: 'ReClash' },
    { key: 'announce', header: 'ReClash-Announce', label: { ru: 'Объявление', en: 'Announcement' }, type: 'textarea', max: 180,
      hint: { ru: 'Одна строка, до 180 символов, без разметки.', en: 'One line, up to 180 characters, without markup.' },
      validate: value => /\n/.test(value) ? { ru: 'Объявление должно быть одной строкой', en: 'The announcement must be one line' } : null },
  ] },
  { id: 'theme', title: { ru: 'Тема', en: 'Theme' }, fields: [
    { key: 'hex', header: 'ReClash-Hex', label: { ru: 'Цвет', en: 'Color' }, type: 'color', value: '7C5CFF',
      hint: { ru: 'RRGGBB или AARRGGBB. Превью карточки перекрашивается сразу.', en: 'RRGGBB or AARRGGBB. The card preview updates as you type.' },
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
    if (field.header && value && !field.validate?.(value)) out.push([field.header, field.type === 'color' ? normHex(value)! : value])
  }
  return out
}
export const builderEmitters = {
  headers: { label: { ru: 'Заголовки', en: 'Headers' }, line: (key: string, value: string) => ({ before: '', key: `${key}:`, after: ` ${value}` }) },
  nginx: { label: { ru: 'nginx', en: 'nginx' }, line: (key: string, value: string) => ({ before: 'add_header ', key, after: ` "${value.replace(/"/g, '\\"')}" always;` }) },
}
