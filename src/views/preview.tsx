import { useState } from 'react'
import { useQuery } from '@hanzo/base/react'
import { YStack, XStack, H2, Text, Paragraph, Button, Separator, Spinner, Theme } from '@hanzo/gui'
import { Mark, StatusBadge, AccentButton } from '../ui'
import {
  type Proposal,
  type LineItem,
  lineTotal,
  subtotal,
  taxOf,
  totalOf,
  money,
  shareLink,
} from '../lib/proposal'

interface PaperProposal {
  client: string
  title: string
  status: string
  created?: string
}

interface PaperItem {
  id?: string
  desc: string
  qty: number
  price: number
}

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function docNumber(id?: string): string {
  const tail = (id ?? 'sample').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `QW-${tail || 'DRAFT'}`
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <Text fontSize={strong ? '$5' : '$3'} fontWeight={strong ? '800' : '400'} color={strong ? '$color' : '$color11'}>
        {label}
      </Text>
      <Text
        fontSize={strong ? '$7' : '$3'}
        fontWeight={strong ? '800' : '600'}
        color={strong ? '$green10' : '$color'}
      >
        {value}
      </Text>
    </XStack>
  )
}

/**
 * The read-only proposal document — the clean, invoice-like artifact you share.
 * Rendered on a LIGHT `paper` surface (wrapped in `<Theme name="light">`) so the
 * same design tokens flip to dark ink on white, whatever the app chrome theme.
 * Reused by the signed-out hero to show the product at a glance.
 */
export function ProposalPaper({
  proposal,
  items,
  id,
}: {
  proposal: PaperProposal
  items: PaperItem[]
  id?: string
}) {
  const sub = subtotal(items)
  const tax = taxOf(sub)
  const total = totalOf(sub)

  return (
    <Theme name="light">
      <YStack
        width="100%"
        maxWidth={720}
        backgroundColor="$background"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$6"
        padding="$6"
        gap="$5"
        shadowColor="#000000"
        shadowOpacity={0.18}
        shadowRadius={40}
        shadowOffset={{ width: 0, height: 24 }}
      >
        <XStack justifyContent="space-between" alignItems="flex-start" gap="$4">
          <XStack alignItems="center" gap="$2.5">
            <Mark size={30} />
            <Text fontSize="$5" fontWeight="800" color="$color">
              Quotewright
            </Text>
          </XStack>
          <YStack alignItems="flex-end" gap="$2">
            <Text fontSize="$1" fontWeight="700" color="$color10" letterSpacing={1.4}>
              PROPOSAL
            </Text>
            <StatusBadge status={proposal.status} />
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Text fontSize="$1" fontWeight="700" color="$color10" letterSpacing={1.2}>
            {docNumber(id)} · {formatDate(proposal.created)}
          </Text>
          <H2 color="$color" fontSize="$9">
            {proposal.title || 'Untitled proposal'}
          </H2>
          <Text fontSize="$4" color="$color11">
            Prepared for{' '}
            <Text fontSize="$4" fontWeight="700" color="$color">
              {proposal.client || 'your client'}
            </Text>
          </Text>
        </YStack>

        <Separator borderColor="$borderColor" />

        <YStack gap="$1">
          <XStack paddingBottom="$2" gap="$3">
            <Text flex={1} fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.8}>
              DESCRIPTION
            </Text>
            <Text width={52} textAlign="right" fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.8}>
              QTY
            </Text>
            <Text width={104} textAlign="right" fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.8}>
              PRICE
            </Text>
            <Text width={116} textAlign="right" fontSize="$1" fontWeight="700" color="$color10" letterSpacing={0.8}>
              AMOUNT
            </Text>
          </XStack>

          {items.length === 0 ? (
            <XStack paddingVertical="$4" borderTopWidth={1} borderColor="$borderColor">
              <Paragraph color="$color10">No line items yet.</Paragraph>
            </XStack>
          ) : (
            items.map((item, i) => (
              <XStack
                key={item.id ?? i}
                paddingVertical="$3"
                gap="$3"
                alignItems="flex-start"
                borderTopWidth={1}
                borderColor="$borderColor"
              >
                <Text flex={1} flexShrink={1} fontSize="$4" color="$color">
                  {item.desc || 'Untitled item'}
                </Text>
                <Text width={52} textAlign="right" fontSize="$4" color="$color11">
                  {item.qty}
                </Text>
                <Text width={104} textAlign="right" fontSize="$4" color="$color11">
                  {money(item.price)}
                </Text>
                <Text width={116} textAlign="right" fontSize="$4" fontWeight="600" color="$color">
                  {money(lineTotal(item))}
                </Text>
              </XStack>
            ))
          )}
        </YStack>

        <YStack alignSelf="flex-end" width={280} gap="$2.5">
          <TotalRow label="Subtotal" value={money(sub)} />
          <TotalRow label="Tax (8%)" value={money(tax)} />
          <Separator borderColor="$borderColor" />
          <TotalRow label="Total" value={money(total)} strong />
        </YStack>

        <Separator borderColor="$borderColor" />
        <Text fontSize="$2" color="$color10" textAlign="center">
          Thank you for the opportunity. This proposal is valid for 30 days.
        </Text>
      </YStack>
    </Theme>
  )
}

/**
 * The preview VIEW: dark app chrome (a back + copy-share-link toolbar) around
 * the light proposal paper. "Copy share link" writes this origin's `/p/<id>`.
 */
export function Preview({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: propData, isLoading } = useQuery<Proposal>('proposals', {
    filter: `id = "${id}"`,
    realtime: false,
  })
  const { data: items } = useQuery<LineItem>('lineitems', {
    filter: `proposal = "${id}"`,
    sort: 'created',
    realtime: false,
  })
  const [copied, setCopied] = useState(false)
  const proposal = propData[0]

  async function copy() {
    try {
      await navigator.clipboard?.writeText(shareLink(id))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — the URL is still `/p/<id>` */
    }
  }

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$color2">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
        backgroundColor="$background"
      >
        <Button size="$3" chromeless onPress={onBack}>
          ← Back to editor
        </Button>
        <XStack alignItems="center" gap="$3">
          {copied ? (
            <Text fontSize="$2" color="$green10" fontWeight="600">
              Link copied
            </Text>
          ) : null}
          <AccentButton size="$3" onPress={copy}>
            Copy share link
          </AccentButton>
        </XStack>
      </XStack>

      <YStack flex={1} alignItems="center" padding="$5" paddingVertical="$8">
        {isLoading ? (
          <Spinner size="large" />
        ) : proposal ? (
          <ProposalPaper id={proposal.id} proposal={proposal} items={items} />
        ) : (
          <Paragraph color="$color11">Proposal not found.</Paragraph>
        )}
      </YStack>
    </YStack>
  )
}
