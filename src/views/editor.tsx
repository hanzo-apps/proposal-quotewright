import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@hanzo/base/react'
import { YStack, XStack, H3, Text, Label, Input, Button, Separator, Spinner } from '@hanzo/gui'
import { StatusBadge, AccentButton } from '../ui'
import {
  type Proposal,
  type LineItem,
  type Status,
  STATUSES,
  statusMeta,
  num,
  lineTotal,
  subtotal,
  taxOf,
  totalOf,
  money,
} from '../lib/proposal'

/** An editable line item — qty/price held as strings so typing stays natural. */
interface Row {
  id: string
  desc: string
  qty: string
  price: string
}

function toRow(item: LineItem): Row {
  return {
    id: item.id,
    desc: String(item.desc ?? ''),
    qty: String(num(item.qty)),
    price: String(num(item.price)),
  }
}

/**
 * The proposal editor: the header fields (client · title · status) and an
 * inline line-item table on the left, a live totals sidebar on the right.
 * Header text persists on blur; status persists on click; each line-item cell
 * persists on blur — every write carries the signed-in user's IAM token and is
 * org-scoped by Base.
 */
export function Editor({ id, onList, onPreview }: { id: string; onList: () => void; onPreview: (id: string) => void }) {
  const { data: propData, isLoading } = useQuery<Proposal>('proposals', {
    filter: `id = "${id}"`,
    realtime: false,
  })
  const { data: itemData, refetch } = useQuery<LineItem>('lineitems', {
    filter: `proposal = "${id}"`,
    sort: 'created',
    realtime: false,
  })
  const saveProposal = useMutation('proposals', 'update')
  const dropProposal = useMutation('proposals', 'delete')
  const createItem = useMutation('lineitems', 'create')
  const saveItem = useMutation('lineitems', 'update')
  const dropItem = useMutation('lineitems', 'delete')

  const proposal = propData[0]
  const [client, setClient] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<Status>('draft')
  const [rows, setRows] = useState<Row[]>([])

  // Hydrate the header once the proposal loads (keyed on identity, not every fetch).
  useEffect(() => {
    if (!proposal) return
    setClient(proposal.client ?? '')
    setTitle(proposal.title ?? '')
    setStatus((proposal.status as Status) ?? 'draft')
  }, [proposal?.id])

  // Resync rows only when the SET of items changes (add/remove) — preserves edits.
  const itemIds = itemData.map((i) => i.id).join(',')
  useEffect(() => {
    setRows(itemData.map(toRow))
  }, [itemIds])

  const priced = rows.map((r) => ({ qty: r.qty, price: r.price }))
  const sub = subtotal(priced)
  const tax = taxOf(sub)
  const total = totalOf(sub)
  const saving = saveProposal.isLoading || saveItem.isLoading

  function persistHeader(next?: Partial<{ client: string; title: string; status: Status }>) {
    saveProposal.mutate({
      id,
      client: next?.client ?? client,
      title: next?.title ?? title,
      status: next?.status ?? status,
    })
  }

  function changeStatus(next: Status) {
    setStatus(next)
    persistHeader({ status: next })
  }

  function editRow(index: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function persistRow(row: Row) {
    saveItem.mutate({ id: row.id, desc: row.desc, qty: num(row.qty), price: num(row.price) })
  }

  async function addRow() {
    if (createItem.isLoading) return
    await createItem.mutate({ proposal: id, desc: '', qty: 1, price: 0 })
    await refetch()
  }

  async function removeRow(rowId: string) {
    await dropItem.mutate({ id: rowId })
    await refetch()
  }

  async function deleteProposal() {
    if (typeof window !== 'undefined' && !window.confirm('Delete this proposal and its line items?')) return
    for (const r of rows) await dropItem.mutate({ id: r.id })
    await dropProposal.mutate({ id })
    onList()
  }

  if (isLoading || !proposal) {
    return (
      <YStack flex={1} minHeight="100vh" alignItems="center" justifyContent="center" backgroundColor="$background">
        <Spinner size="large" />
      </YStack>
    )
  }

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$background">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
        paddingHorizontal="$5"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <Button size="$3" chromeless onPress={() => { persistHeader(); onList() }}>
          ← All proposals
        </Button>
        <XStack alignItems="center" gap="$2">
          <YStack width={7} height={7} borderRadius={999} backgroundColor={saving ? '$yellow9' : '$green9'} />
          <Text fontSize="$2" color="$color10">
            {saving ? 'Saving…' : 'All changes saved'}
          </Text>
        </XStack>
      </XStack>

      <XStack flexWrap="wrap" gap="$6" padding="$6" maxWidth={1120} width="100%" alignSelf="center">
        <YStack flex={2} minWidth={360} gap="$5">
          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth={220} gap="$1.5">
              <Label htmlFor="client" fontSize="$2" color="$color11">Client</Label>
              <Input
                id="client"
                value={client}
                placeholder="Acme, Inc."
                onChangeText={setClient}
                onBlur={() => persistHeader()}
              />
            </YStack>
            <YStack flex={1} minWidth={220} gap="$1.5">
              <Label htmlFor="title" fontSize="$2" color="$color11">Proposal title</Label>
              <Input
                id="title"
                value={title}
                placeholder="Website redesign"
                onChangeText={setTitle}
                onBlur={() => persistHeader()}
              />
            </YStack>
          </XStack>

          <YStack gap="$2">
            <Text fontSize="$2" color="$color11">Status</Text>
            <XStack gap="$2" flexWrap="wrap">
              {STATUSES.map((s) => {
                const active = s === status
                return (
                  <Button
                    key={s}
                    size="$2"
                    backgroundColor={active ? '$purple9' : 'transparent'}
                    borderWidth={1}
                    borderColor={active ? '$purple9' : '$borderColor'}
                    hoverStyle={{ borderColor: '$purple8' }}
                    pressStyle={{ backgroundColor: active ? '$purple10' : '$color3' }}
                    onPress={() => changeStatus(s)}
                  >
                    <Button.Text color={active ? '#ffffff' : '$color11'} fontWeight={active ? '700' : '400'}>
                      {statusMeta(s).label}
                    </Button.Text>
                  </Button>
                )
              })}
            </XStack>
          </YStack>

          <Separator borderColor="$borderColor" />

          <YStack gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <H3 fontSize="$6">Line items</H3>
              <AccentButton size="$2" disabled={createItem.isLoading} onPress={addRow}>
                + Add item
              </AccentButton>
            </XStack>

            <XStack paddingHorizontal="$1" gap="$3">
              <Text flex={1} fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.6}>DESCRIPTION</Text>
              <Text width={72} fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.6}>QTY</Text>
              <Text width={112} fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.6}>PRICE</Text>
              <Text width={96} textAlign="right" fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.6}>AMOUNT</Text>
              <YStack width={32} />
            </XStack>

            {rows.length === 0 ? (
              <YStack padding="$5" borderWidth={1} borderColor="$borderColor" borderRadius="$4" alignItems="center">
                <Text color="$color10">No line items yet — add one to start pricing.</Text>
              </YStack>
            ) : (
              rows.map((row, i) => (
                <XStack key={row.id} gap="$3" alignItems="center">
                  <Input
                    flex={1}
                    size="$3"
                    value={row.desc}
                    placeholder="Discovery workshop"
                    onChangeText={(v: string) => editRow(i, { desc: v })}
                    onBlur={() => persistRow(rows[i])}
                  />
                  <Input
                    width={72}
                    size="$3"
                    textAlign="right"
                    value={row.qty}
                    onChangeText={(v: string) => editRow(i, { qty: v })}
                    onBlur={() => persistRow(rows[i])}
                  />
                  <Input
                    width={112}
                    size="$3"
                    textAlign="right"
                    value={row.price}
                    onChangeText={(v: string) => editRow(i, { price: v })}
                    onBlur={() => persistRow(rows[i])}
                  />
                  <Text width={96} textAlign="right" fontSize="$4" fontWeight="600" color="$color">
                    {money(lineTotal({ qty: row.qty, price: row.price }))}
                  </Text>
                  <Button size="$2" width={32} chromeless onPress={() => removeRow(row.id)}>
                    <Button.Text color="$red10">×</Button.Text>
                  </Button>
                </XStack>
              ))
            )}
            {createItem.error ? <Text color="$red10">{createItem.error.message}</Text> : null}
          </YStack>
        </YStack>

        <YStack flex={1} minWidth={280} gap="$4">
          <YStack
            gap="$3.5"
            padding="$5"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$6"
            backgroundColor="$color2"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$5" fontWeight="700" color="$color">Summary</Text>
              <StatusBadge status={status} />
            </XStack>
            <Separator borderColor="$borderColor" />
            <XStack justifyContent="space-between">
              <Text color="$color11">Subtotal</Text>
              <Text color="$color" fontWeight="600">{money(sub)}</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text color="$color11">Tax (8%)</Text>
              <Text color="$color" fontWeight="600">{money(tax)}</Text>
            </XStack>
            <Separator borderColor="$borderColor" />
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="800" color="$color">Total</Text>
              <Text fontSize="$8" fontWeight="800" color="$green10">{money(total)}</Text>
            </XStack>
            <Text fontSize="$2" color="$color10">
              {rows.length} {rows.length === 1 ? 'line item' : 'line items'}
            </Text>
            <AccentButton size="$4" onPress={() => { persistHeader(); onPreview(id) }}>
              Preview & share
            </AccentButton>
          </YStack>
          <Button size="$2" chromeless onPress={deleteProposal}>
            <Button.Text color="$red10">Delete proposal</Button.Text>
          </Button>
        </YStack>
      </XStack>
    </YStack>
  )
}
