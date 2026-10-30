import type { Pad } from '@ogre/shared'
import { usePads, useSavePads } from '../../api/me.ts'

export const PAD_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export function usePadSlots() {
  const pads = usePads().data ?? []
  const save = useSavePads()

  const replace = (slot: number, pad: Pad | null) =>
    save.mutate(
      [...pads.filter((p) => p.slot !== slot), ...(pad ? [pad] : [])].sort(
        (a, b) => a.slot - b.slot,
      ),
    )

  return {
    pads,
    at: (slot: number) => pads.find((p) => p.slot === slot),
    assign: (slot: number, soundId: string, label: string) =>
      replace(slot, { slot, soundId, label }),
    rename: (pad: Pad, label: string) => replace(pad.slot, { ...pad, label }),
    clear: (slot: number) => replace(slot, null),
  }
}
