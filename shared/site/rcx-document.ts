import type { MdInline } from './markdown'
import type { RcxLanguage } from './rcx'

export type RcxHeading = { id: string, aliases: string[], title: string, level: number }
export type RcxScreenshot = {
  type: 'screenshot', id: string, file: string, page: string, description: string,
  capture: string, width: number, height: number, caption: MdInline[], src?: string,
}
export type RcxBlock =
  | { type: 'heading', content: MdInline[] } & RcxHeading
  | { type: 'paragraph', content: MdInline[] }
  | { type: 'code', lang: string, text: string }
  | { type: 'rule' }
  | { type: 'list', ordered: boolean, start: number, items: Array<{ checked?: boolean, blocks: RcxBlock[] }> }
  | { type: 'quote', alert?: string, children: RcxBlock[] }
  | { type: 'table', head: MdInline[][], align: Array<'left' | 'center' | 'right' | null>, rows: MdInline[][][] }
  | { type: 'diagram', src: string, width: number, height: number, text: string, title: string }
  | RcxScreenshot
export type RcxDocument = { language: RcxLanguage, slug: string, title: string, headings: RcxHeading[], blocks: RcxBlock[] }
export type RcxSearchEntry = { title: string, heading: string, href: string, text: string }
