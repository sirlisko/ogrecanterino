import type { Pad } from '@ogre/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { keys } from '../api/keys.ts'
import { sceneQuery } from '../api/scenes.ts'
import { engine } from '../audio/engine.ts'
import { usePlayer } from '../audio/store.ts'
import { useActiveCollection } from '../features/collections/activeCollection.ts'
import { adjacentScene, combatSceneIdFor } from '../features/collections/setlist.ts'
import { loadSetlist, useGoToScene } from '../features/collections/useSetlist.ts'
import { flash } from '../ui/flash.ts'
import { actionFor, isTypingTarget, type HotkeyAction } from './keymap.ts'
import { HotkeyHelp } from './HotkeyHelp.tsx'
import { toggleHotkeyHelp, useHotkeyHelp } from './helpStore.ts'

export function HotkeyLayer() {
  const qc = useQueryClient()
  const help = useHotkeyHelp((s) => s.open)
  const goTo = useRef(useGoToScene())

  useEffect(() => {
    const run = (action: HotkeyAction) => {
      const { scene, monitor } = usePlayer.getState()
      switch (action.type) {
        case 'effect': {
          const card = scene?.data.effects[action.index]
          if (!card) return
          void engine.triggerEffect(card)
          flash(document.querySelector(`[data-effect-id="${card.id}"]`))
          return
        }
        case 'pad': {
          const pad = qc.getQueryData<Pad[]>(keys.pads)?.find((p) => p.slot === action.slot)
          if (!pad) return
          void engine.firePad(pad.soundId)
          flash(document.querySelector(`[data-pad-slot="${action.slot}"]`), 'var(--color-ink)')
          return
        }
        case 'toggleMusic':
          return engine.music?.toggle()
        case 'nextTrack':
          return engine.music?.next()
        case 'previousTrack':
          return engine.music?.previous()
        case 'fadeOut':
          return void engine.stopScene()
        case 'toggleMonitor':
          return engine.setMonitor(!monitor)
        case 'toggleCombat':
          if (!scene) return
          return void loadSetlist(qc).then(async ({ collection }) => {
            const combatId = combatSceneIdFor(scene, collection)
            engine.toggleCombat(combatId ? await qc.ensureQueryData(sceneQuery(combatId)) : null)
          })
        case 'nextScene':
        case 'previousScene':
          return void loadSetlist(qc).then(({ collection, scenes }) => {
            const offset = action.type === 'nextScene' ? 1 : -1
            const target = adjacentScene(collection, scenes, scene?.id ?? null, offset)
            if (target) goTo.current(target)
          })
        case 'focusSearch':
          return document.querySelector<HTMLInputElement>('[data-hotkey-search]')?.focus()
        case 'help':
          return toggleHotkeyHelp()
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || isTypingTarget(e.target)) return
      if (document.querySelector('dialog[open]')) return
      const action = actionFor(e)
      if (!action) return
      // Let Space/Enter keep activating a focused button.
      if (action.type === 'toggleMusic' && e.target instanceof HTMLButtonElement) return
      // Without a collection to step through, Page Up/Down keep scrolling the page.
      const step = action.type === 'nextScene' || action.type === 'previousScene'
      if (step && !useActiveCollection.getState().id) return
      e.preventDefault()
      run(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [qc])

  return help ? <HotkeyHelp onClose={() => useHotkeyHelp.setState({ open: false })} /> : null
}
