import { entryFor, formEntries, formSections, schemaPathOf } from './form.ts'
import { cloneValue, getAt, labelEntries, splitPath, type Manifest } from './document.ts'
import { kindOf, nodeAt } from './schema.ts'
import type { BilingualText } from '../../site/routes.ts'

export function createCard(type: string, id: string, language: 'ru' | 'en'): Record<string, unknown> {
  const text = (ru: string, en: string) => language === 'ru' ? ru : en
  const card: Record<string, unknown> = { type, id }
  if (type === 'banner') {
    card.title = text('Заголовок карточки', 'Card title')
    card.text = text('Краткое описание предложения.', 'A short description of the offer.')
  } else if (type === 'note') {
    card.text = text('Текст уведомления для пользователей.', 'A notice for your users.')
  } else if (type === 'actions') {
    card.items = [
      { icon: 'renew', label: text('Продлить', 'Renew'), url: 'https://example.com/renew' },
      { icon: 'support', label: text('Поддержка', 'Support'), url: 'https://t.me/example_support' },
    ]
  }
  return card
}

export type Starter = { key: string, title: BilingualText, summary: BilingualText, value: (language: 'ru' | 'en') => Manifest }
export const starters: Starter[] = [
  {
    key: 'provider', title: { ru: 'Сервис и поддержка', en: 'Service and support' },
    summary: { ru: 'Название сервиса и пример ссылок. Замените их своими.', en: 'A service name and example links. Replace them with yours.' },
    value: () => ({ provider: { name: 'Example VPN', 'support-url': 'https://t.me/example_support', 'web-url': 'https://example.com' } }),
  },
  {
    key: 'appearance', title: { ru: 'Оформление панели', en: 'Dashboard appearance' },
    summary: { ru: 'Цвет, стиль, кнопка питания и порядок виджетов.', en: 'Color, style, power button and widget order.' },
    value: () => ({ view: { app: { color: '#336699', style: 'soft' } }, 'power-button': { shape: 'circle', type: 'tonal' }, widgets: ['currentOutbound', 'health', 'networkSpeed', 'outboundMode', 'profiles', 'proxyGroups'] }),
  },
  {
    key: 'renewal', title: { ru: 'Продление и напоминания', en: 'Renewal and reminders' },
    summary: { ru: 'Примеры продления и докупки. Для напоминаний нужен Subscription-Userinfo.', en: 'Renewal and top-up examples. Reminders need Subscription-Userinfo.' },
    value: () => ({ provider: { renew: { url: 'https://example.com/renew', days: 3 }, 'top-up': { url: 'https://example.com/top-up', percent: 90 } }, reminders: { 'expire-days': [3, 2, 1], 'traffic-percent': [90] } }),
  },
  {
    key: 'cards', title: { ru: 'Карточки с действиями', en: 'Cards and actions' },
    summary: { ru: 'Баннер, заметка и две кнопки с примерными ссылками.', en: 'A banner, a note and two buttons with example links.' },
    value: language => ({ cards: ['banner', 'note', 'actions'].map(type => createCard(type, `${type}-1`, language)) }),
  },
]

export function mergeStarter(current: Manifest, sample: Manifest): { manifest: Manifest, added: string[] } {
  const manifest = cloneValue(current)
  const added: string[] = []
  const fill = (target: Manifest, source: Manifest, prefix: string) => {
    for (const [key, value] of Object.entries(source)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (!Object.hasOwn(target, key) || target[key] === undefined) {
        Object.defineProperty(target, key, { value: cloneValue(value), writable: true, enumerable: true, configurable: true })
        added.push(path)
      } else if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        fill(target[key] as Manifest, value as Manifest, path)
      }
    }
  }
  fill(manifest, sample, '')
  return { manifest, added }
}

export type FieldMatch = { path: string, target: string, label: string, section: string, configured: boolean }
const normalized = (text: string) => text.toLocaleLowerCase().replace(/ё/g, 'е').replace(/[-_.]/g, ' ')

function targetsOf(path: string, manifest: Manifest): string[] {
  const walk = (parts: string[], value: unknown, prefix: Array<string | number>): string[] => {
    const kind = kindOf(nodeAt(prefix, manifest))
    if (parts.length && (Array.isArray(value) || kind === 'object-list' || kind === 'labels')) {
      const list = kind === 'labels' ? labelEntries(value) : Array.isArray(value) ? value : []
      return list.length ? list.flatMap((item, index) => walk(parts, item, [...prefix, index])) : [prefix.join('.')]
    }
    if (!parts.length) return [prefix.join('.')]
    const [key, ...rest] = parts
    if (!nodeAt([...prefix, key!], manifest)) return []
    return walk(rest, value && typeof value === 'object' ? (value as Manifest)[key!] : undefined, [...prefix, key!])
  }
  return walk(path.split('.'), manifest, [])
}

export function searchFields(query: string, manifest: Manifest, language: 'ru' | 'en', limit = 12): FieldMatch[] {
  const text = normalized(query.trim())
  if (!text) return []
  const words = text.split(/\s+/)
  const matches = formEntries.filter(entry => entry.widget !== 'hidden').flatMap(entry => {
    const section = formSections.find(section => section.key === entry.path.split('.')[0])!
    const ancestors = entry.path.split('.').map((_, index, parts) => entryFor(parts.slice(0, index).join('.'))?.label)
    const haystack = normalized([entry.path, ...Object.values(entry.label), ...Object.values(entry.help ?? {}), ...Object.values(section.title), ...ancestors.flatMap(label => Object.values(label ?? {}))].join(' '))
    if (!words.every(word => haystack.includes(word))) return []
    const rank = normalized(entry.path) === text ? 0 : normalized(entry.path).startsWith(text) ? 1 : Object.values(entry.label).some(label => normalized(label).startsWith(text)) ? 2 : 3
    return targetsOf(entry.path, manifest).map(target => ({
      rank, path: schemaPathOf(target) === entry.path ? target : entry.path,
      target, label: entry.label[language], section: section.title[language],
      configured: schemaPathOf(target) === entry.path && getAt(manifest, splitPath(target)) !== undefined,
    }))
  })
  return matches.sort((a, b) => a.rank - b.rank).slice(0, limit).map(({ rank: _, ...match }) => match)
}
