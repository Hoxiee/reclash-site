import type { Fragment } from './document.ts'

export const historyLimit = 50
export const historyBudget = 8 * 1024 * 1024
export const historyGroupWindow = 700

export class DraftHistory {
  private entries: string[]
  private cursor = 0
  private group = ''
  private at = 0
  private detached = false

  constructor(initial: Fragment) { this.entries = [JSON.stringify(initial)] }
  get canUndo(): boolean { return this.detached || this.cursor > 0 }
  get canRedo(): boolean { return !this.detached && this.cursor < this.entries.length - 1 }
  get length(): number { return this.entries.length }

  record(state: Fragment, group = '', at = Date.now()): void {
    const text = JSON.stringify(state)
    if (text === this.entries[this.cursor]) { this.detached = false; return }
    const coalesce = !this.detached && group && group === this.group && at - this.at <= historyGroupWindow && !this.canRedo && this.canUndo
    this.entries.length = this.cursor + 1
    if (text.length * 2 > historyBudget) { this.detached = true; this.group = ''; return }
    this.detached = false
    if (coalesce) this.entries[this.cursor] = text
    else { this.entries.push(text); this.cursor++ }
    if (this.canUndo && this.entries[this.cursor] === this.entries[this.cursor - 1]) { this.entries.pop(); this.cursor-- }
    this.group = group
    this.at = at
    let bytes = this.entries.reduce((sum, entry) => sum + entry.length * 2, 0)
    while (this.entries.length > 1 && (this.entries.length > historyLimit || bytes > historyBudget)) {
      bytes -= this.entries.shift()!.length * 2
      this.cursor--
    }
  }

  undo(): Fragment | undefined {
    this.group = ''
    if (this.detached) { this.detached = false; return JSON.parse(this.entries[this.cursor]!) as Fragment }
    return this.canUndo ? JSON.parse(this.entries[--this.cursor]!) as Fragment : undefined
  }

  redo(): Fragment | undefined {
    this.group = ''
    return this.canRedo ? JSON.parse(this.entries[++this.cursor]!) as Fragment : undefined
  }
}
