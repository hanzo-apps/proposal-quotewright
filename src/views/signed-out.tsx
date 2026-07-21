import { useIam } from '@hanzo/iam/react'
import { YStack, XStack, H1, Text, Paragraph, Button } from '@hanzo/gui'
import { Mark, AccentButton } from '../ui'
import { ProposalPaper } from './preview'

/** A small feature pill for the hero. */
function Chip({ children }: { children: string }) {
  return (
    <XStack
      alignItems="center"
      gap="$2"
      paddingHorizontal="$3"
      paddingVertical="$1.5"
      borderRadius={999}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color2"
    >
      <YStack width={6} height={6} borderRadius={999} backgroundColor="$purple9" />
      <Text fontSize="$2" color="$color11">{children}</Text>
    </XStack>
  )
}

const SAMPLE_ITEMS = [
  { id: '1', desc: 'Brand discovery & strategy workshop', qty: 1, price: 3500 },
  { id: '2', desc: 'Visual identity system', qty: 1, price: 6800 },
  { id: '3', desc: 'Website design — 8 templates', qty: 8, price: 950 },
  { id: '4', desc: 'Webflow build & CMS integration', qty: 1, price: 5400 },
]

/**
 * Signed-out landing — the product hero. One action: PKCE sign-in with Hanzo
 * (hanzo.id); Hanzo IAM owns every credential interaction (no local form). The
 * live invoice-like paper on the right shows exactly what you ship to a client.
 */
export function SignedOut() {
  const { login, isLoading } = useIam()

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$background">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$6"
        paddingVertical="$4"
        maxWidth={1200}
        width="100%"
        alignSelf="center"
      >
        <XStack alignItems="center" gap="$2.5">
          <Mark size={30} />
          <Text fontSize="$6" fontWeight="800" color="$color">Quotewright</Text>
        </XStack>
        <Button size="$3" chromeless disabled={isLoading} onPress={() => login()}>
          Sign in
        </Button>
      </XStack>

      <XStack
        flex={1}
        flexWrap="wrap"
        gap="$9"
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$6"
        paddingVertical="$8"
        maxWidth={1200}
        width="100%"
        alignSelf="center"
      >
        <YStack flex={1} minWidth={340} maxWidth={560} gap="$5">
          <XStack
            alignSelf="flex-start"
            alignItems="center"
            gap="$2"
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius={999}
            borderWidth={1}
            borderColor="$purple7"
            backgroundColor="$purple3"
          >
            <Text fontSize="$1" fontWeight="700" color="$purple11" letterSpacing={1}>
              PROPOSAL SOFTWARE
            </Text>
          </XStack>

          <H1 fontSize={54} lineHeight={58} fontWeight="900" letterSpacing={-1.2} color="$color">
            Build and share branded proposals.
          </H1>

          <Paragraph fontSize="$6" color="$color11" maxWidth={480}>
            Draft line-item quotes with a live totals sidebar, then send clients a clean,
            read-only link. Priced, on-brand, and signed off faster.
          </Paragraph>

          <XStack gap="$2" flexWrap="wrap">
            <Chip>Line-item pricing</Chip>
            <Chip>Live totals</Chip>
            <Chip>Read-only share link</Chip>
          </XStack>

          <XStack alignItems="center" gap="$4" flexWrap="wrap">
            <AccentButton size="$5" disabled={isLoading} onPress={() => login()}>
              {isLoading ? 'Loading…' : 'Sign in with Hanzo'}
            </AccentButton>
            <Text fontSize="$2" color="$color10">
              Auth by Hanzo IAM · org-scoped data in Hanzo Base
            </Text>
          </XStack>
        </YStack>

        <YStack flex={1} minWidth={380} maxWidth={560} alignItems="center">
          <ProposalPaper
            proposal={{ client: 'Northwind Studio', title: 'Brand & Website Redesign', status: 'sent' }}
            items={SAMPLE_ITEMS}
            id="sample"
          />
        </YStack>
      </XStack>
    </YStack>
  )
}
