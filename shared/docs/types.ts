export type DocInline =
  | { type: 'text', text: string }
  | { type: 'code', text: string, href?: string }
  | { type: 'break' }
  | { type: 'strong' | 'em' | 'del', children: DocInline[] }
  | { type: 'link', href: string, external: boolean, children: DocInline[] }

export type DocCallout = 'note' | 'tip' | 'important' | 'warning' | 'caution'
export type DocHeading = { id: string, aliases: string[], title: string, level: number }
export type DocScreenshot = {
  type: 'screenshot', id: string, file: string, page: string, description: string,
  capture: string, width: number, height: number, caption: DocInline[], src?: string,
}
export type DocBlock =
  | { type: 'heading', content: DocInline[] } & DocHeading
  | { type: 'paragraph', content: DocInline[] }
  | { type: 'code', lang: string, title: string, text: string }
  | { type: 'rule' }
  | { type: 'list', ordered: boolean, start: number, items: Array<{ checked?: boolean, blocks: DocBlock[] }> }
  | { type: 'quote', children: DocBlock[] }
  | { type: 'callout', tone: DocCallout, children: DocBlock[] }
  | { type: 'table', head: DocInline[][], align: Array<'left' | 'center' | 'right' | null>, rows: DocInline[][][] }
  | { type: 'diagram', src: string, width: number, height: number, text: string, title: string }
  | DocScreenshot

export type DocDocument = { language: string, slug: string, title: string, lede: DocInline[], headings: DocHeading[], blocks: DocBlock[] }
export type DocSearchEntry = { section: string, page: string, heading: string, href: string, text: string }
