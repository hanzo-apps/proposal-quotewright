import { useIam } from '@hanzo/iam/react'
import { useQuery, useMutation, type BaseRecord } from '@hanzo/base/react'
import { YStack, XStack, H1, Text, Paragraph, Button, Spinner } from '@hanzo/gui'
import { Mark, StatusBadge, AccentButton } from '../ui'
import { type Proposal, type LineItem, lineTotal, totalOf, money } from '../lib/proposal'

/**
 * The proposals list — the app's home base. Header carries the brand + who you
 * are; the body is a card per proposal with its client, status, item count, and
 * grand total (computed from the `lineitems` collection). "New proposal" mints a
 * draft in Base and jumps straight into the editor.
 */
export function List({ onOpen }: { onOpen: (id: string) => void }) {
  const { user, logout } = useIam()
  const { data: proposals, isLoading, error, refetch } = useQuery<Proposal>('proposals', {
    sort: '-created',
    realtime: false,
  })
  const { data: items } = useQuery<LineItem>('lineitems', { realtime: false })
  const create = useMutation('proposals', 'create')

  const who = user?.displayName || user?.name || user?.email || 'you'

  const rollup = new Map<string, { count: number; total: number }>()
  for (const it of items) {
    const key = String(it.proposal)
    const cur = rollup.get(key) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += lineTotal(it)
    rollup.set(key, cur)
  }

  async function newProposal() {
    if (create.isLoading) return
    const rec = await create.mutate({ client: '', title: 'Untitled proposal', status: 'draft' })
    await refetch()
    if (rec && typeof rec === 'object' && 'id' in rec) onOpen(String((rec as BaseRecord).id))
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
        <XStack alignItems="center" gap="$2.5">
          <Mark size={28} />
          <Text fontSize="$6" fontWeight="800" color="$color">Quotewright</Text>
        </XStack>
        <XStack alignItems="center" gap="$3">
          <Text fontSize="$2" color="$color10">{who}</Text>
          <Button size="$2" chromeless onPress={() => logout()}>Sign out</Button>
        </XStack>
      </XStack>

      <YStack padding="$6" gap="$5" maxWidth={960} width="100%" alignSelf="center">
        <XStack alignItems="flex-end" justifyContent="space-between" gap="$3" flexWrap="wrap">
          <YStack gap="$1">
            <H1 fontSize="$10">Proposals</H1>
            <Paragraph color="$color10">
              {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'} · build, price, and share.
            </Paragraph>
          </YStack>
          <AccentButton size="$4" disabled={create.isLoading} onPress={newProposal}>
            + New proposal
          </AccentButton>
        </XStack>

        {isLoading ? (
          <XStack gap="$2" alignItems="center" opacity={0.6}>
            <Spinner /> <Text>Loading…</Text>
          </XStack>
        ) : error ? (
          <Paragraph color="$red10">
            Couldn’t reach Base ({error.message}). Confirm VITE_HANZO_BASE_URL and that you’re signed in.
          </Paragraph>
        ) : proposals.length === 0 ? (
          <YStack
            padding="$8"
            gap="$4"
            alignItems="center"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$6"
            backgroundColor="$color1"
          >
            <Text fontSize="$7" fontWeight="700" color="$color">No proposals yet</Text>
            <Paragraph color="$color10" textAlign="center" maxWidth={420}>
              Create your first proposal, add line items, and share a clean read-only link with your client.
            </Paragraph>
            <AccentButton size="$4" onPress={newProposal}>
              Create a proposal
            </AccentButton>
          </YStack>
        ) : (
          <YStack gap="$3">
            {proposals.map((p) => {
              const roll = rollup.get(p.id) ?? { count: 0, total: 0 }
              return (
                <XStack
                  key={p.id}
                  onPress={() => onOpen(p.id)}
                  cursor="pointer"
                  alignItems="center"
                  gap="$4"
                  padding="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$5"
                  backgroundColor="$color1"
                  hoverStyle={{ borderColor: '$purple8', backgroundColor: '$color2' }}
                  pressStyle={{ backgroundColor: '$color3' }}
                >
                  <YStack flex={1} minWidth={0} gap="$1">
                    <Text fontSize="$2" fontWeight="700" color="$purple10">
                      {p.client || 'No client yet'}
                    </Text>
                    <Text fontSize="$6" fontWeight="700" color="$color">
                      {p.title || 'Untitled proposal'}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {roll.count} {roll.count === 1 ? 'line item' : 'line items'}
                    </Text>
                  </YStack>
                  <StatusBadge status={p.status} />
                  <YStack alignItems="flex-end" gap="$1" width={132}>
                    <Text fontSize="$7" fontWeight="800" color="$color">{money(totalOf(roll.total))}</Text>
                    <Text fontSize="$1" color="$color10" textTransform="uppercase" letterSpacing={0.6}>Total</Text>
                  </YStack>
                </XStack>
              )
            })}
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
