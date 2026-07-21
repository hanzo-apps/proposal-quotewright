import type { ReactNode } from 'react'
import { YStack, XStack, Text, Button, type SizeTokens } from '@hanzo/gui'
import { statusMeta } from './lib/proposal'

/**
 * Shared @hanzo/gui pieces reused across the three views (list · editor ·
 * preview) and the signed-out hero. Everything is built from primitives with
 * Tamagui LONGHAND props so it compiles under `tsc` and renders under Vite.
 */

/** The Quotewright monogram — a violet tile with a bold `Q`. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius="$3"
      backgroundColor="$purple9"
      alignItems="center"
      justifyContent="center"
    >
      <Text color="#ffffff" fontWeight="800" fontSize={Math.round(size * 0.52)}>
        Q
      </Text>
    </YStack>
  )
}

/**
 * The brand primary button — one violet accent, one place. `Button` styles its
 * label through `Button.Text` (the frame has no `color` prop), which also lets
 * the label track the button size.
 */
export function AccentButton({
  children,
  size = '$4',
  disabled,
  onPress,
}: {
  children: ReactNode
  size?: SizeTokens
  disabled?: boolean
  onPress?: () => void
}) {
  return (
    <Button
      size={size}
      backgroundColor="$purple9"
      borderWidth={0}
      opacity={disabled ? 0.5 : 1}
      disabled={disabled}
      hoverStyle={{ backgroundColor: '$purple10' }}
      pressStyle={{ backgroundColor: '$purple10' }}
      onPress={onPress}
    >
      <Button.Text color="#ffffff" fontWeight="700">
        {children}
      </Button.Text>
    </Button>
  )
}

/** A pill badge for a proposal's status — theme-relative, reads on light + dark. */
export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <XStack
      alignItems="center"
      gap="$2"
      paddingHorizontal="$2.5"
      paddingVertical="$1.5"
      borderRadius={999}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color2"
    >
      <YStack width={7} height={7} borderRadius={999} backgroundColor={meta.dot} />
      <Text fontSize="$1" fontWeight="700" color={meta.color} textTransform="uppercase" letterSpacing={0.6}>
        {meta.label}
      </Text>
    </XStack>
  )
}
