import type { BilingualText } from './routes'
export type GalleryItem = {
  cat: 'client' | 'routing' | 'themes', type: BilingualText, title: BilingualText,
  wide?: boolean, src?: string, video?: string,
}
export const galleryItems: readonly GalleryItem[] = [
  { cat: 'client', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Главный экран — подключение и трафик', en: 'Main screen: connection and traffic' }, wide: true },
  { cat: 'client', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Переключение узла на лету', en: 'Switching nodes on the fly' } },
  { cat: 'client', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Список прокси и тест задержки', en: 'Proxy list and latency test' } },
  { cat: 'client', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Правила маршрутизации', en: 'Routing rules' } },
  { cat: 'routing', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Маршрутизация RCX: выбор и причины', en: 'RCX routing: selection and reasons' }, wide: true },
  { cat: 'themes', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Тема и акцент под провайдера', en: 'Provider theme and accent' } },
  { cat: 'themes', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Заголовки от провайдера', en: 'Provider headers' } },
  { cat: 'client', type: { ru: 'Обзор', en: 'Overview' }, title: { ru: 'Экран подписки и остатка', en: 'Subscription and remaining traffic' } },
]
