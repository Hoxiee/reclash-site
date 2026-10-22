import type { BilingualText } from './routes'
export type GalleryItem = {
  cat: 'client' | 'dpi' | 'themes', type: BilingualText, title: BilingualText,
  wide?: boolean, src?: string, video?: string,
}
export const galleryItems: readonly GalleryItem[] = [
  { cat: 'client', type: { ru: 'Скрин', en: 'Screenshot' }, title: { ru: 'Главный экран — подключение и трафик', en: 'Main screen: connection and traffic' }, wide: true },
  { cat: 'client', type: { ru: 'Видео', en: 'Video' }, title: { ru: 'Переключение узла на лету', en: 'Switching nodes on the fly' } },
  { cat: 'client', type: { ru: 'Скрин', en: 'Screenshot' }, title: { ru: 'Список прокси и тест задержки', en: 'Proxy list and latency test' } },
  { cat: 'client', type: { ru: 'Скрин', en: 'Screenshot' }, title: { ru: 'Правила маршрутизации', en: 'Routing rules' } },
  { cat: 'dpi', type: { ru: 'Видео', en: 'Video' }, title: { ru: 'Обход DPI в действии', en: 'DPI bypass in action' }, wide: true },
  { cat: 'themes', type: { ru: 'Скрин', en: 'Screenshot' }, title: { ru: 'Тема и акцент под провайдера', en: 'Provider theme and accent' } },
  { cat: 'themes', type: { ru: 'Скрин', en: 'Screenshot' }, title: { ru: 'Заголовки от провайдера', en: 'Provider headers' } },
  { cat: 'client', type: { ru: 'Скрин', en: 'Screenshot' }, title: { ru: 'Экран подписки и остатка', en: 'Subscription and remaining traffic' } },
]
