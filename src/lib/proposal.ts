import type { BaseRecord } from '@hanzo/base/react'

/**
 * The Quotewright domain, in ONE place: the two Base collections
 * (`proposals` + `lineitems`, see schema.sql), the proposal status vocabulary,
 * and the money math the invoice-like layout renders against. No fabricated
 * fields — every value here maps to a column the app reads or writes.
 */

/** A row of the `proposals` collection. */
export interface Proposal extends BaseRecord {
  client: string
  title: string
  status: string
}

/** A row of the `lineitems` collection (`proposal` = the parent's Base id). */
export interface LineItem extends BaseRecord {
  proposal: string
  desc: string
  qty: number
  price: number
}

/** The proposal lifecycle. `draft` is where every new proposal starts. */
export type Status = 'draft' | 'sent' | 'accepted' | 'declined'

export const STATUSES: Status[] = ['draft', 'sent', 'accepted', 'declined']

/** Presentation for a status — label + palette tokens that read on light AND dark. */
export interface StatusMeta {
  label: string
  color: string
  dot: string
}

const STATUS_META: Record<Status, StatusMeta> = {
  draft: { label: 'Draft', color: '$gray11', dot: '$gray9' },
  sent: { label: 'Sent', color: '$blue11', dot: '$blue9' },
  accepted: { label: 'Accepted', color: '$green11', dot: '$green9' },
  declined: { label: 'Declined', color: '$red11', dot: '$red9' },
}

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status as Status] ?? STATUS_META.draft
}

/** The presentation-layer tax convention shown on every proposal total. */
export const TAX_RATE = 0.08

/** Coerce anything Base hands back (number or numeric string) to a finite number. */
export function num(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : 0
}

interface Priced {
  qty: unknown
  price: unknown
}

export function lineTotal(item: Priced): number {
  return num(item.qty) * num(item.price)
}

export function subtotal(items: Priced[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0)
}

export function taxOf(sub: number): number {
  return sub * TAX_RATE
}

export function totalOf(sub: number): number {
  return sub + taxOf(sub)
}

/** Format a number as USD — the invoice-standard money string. */
export function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/**
 * The read-only share URL for a proposal — this origin's `/p/<id>`. The link is
 * org-scoped like every Base row: a teammate in your org opens it read-only;
 * other orgs cannot see it. Opening it while signed in lands on the preview.
 */
export function shareLink(id: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/p/${id}`
}
