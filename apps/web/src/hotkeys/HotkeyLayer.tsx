import type { Pad } from '@ogre/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { keys } from '../api/keys.ts'
import { sceneQuery } from '../api/scenes.ts'
import { engine } from '../audio/engine.ts'
import { usePlayer } from '../audio/store.ts'
import { flash } from '../ui/flash.ts'
import { actionFor, isTypingTarget, type HotkeyAction } from './keymap.ts'
import { HotkeyHelp } from './HotkeyHelp.tsx'

export function HotkeyLayer() {
  const qc = useQueryClient()
  const [help, setHelp] = useState(false)

  useEffect(() => {
    const run = (action: HotkeyAction) => {
      const { scene, monitor } = usePlayer.getState()
      switch (action.type) {
        case 'effect': {
          const card = scene?.data.effects[action.index]
          if (!card) return
          engine.fireEffect(card)
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
        case 'toggleCombat': {
          const combatId = scene?.combatSceneId
          if (!combatId) return engine.toggleCombat(null)
          return void qc
            .ensureQueryData(sceneQuery(combatId))
            .then((combat) => engine.toggleCombat(combat))
        }
        case 'focusSearch':
          return document.querySelector<HTMLInputElement>('[data-hotkey-search]')?.focus()
        case 'help':
          return setHelp((h) => !h)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || isTypingTarget(e.target)) return
      if (document.querySelector('dialog[open]')) return
      const action = actionFor(e)
      if (!action) return
      // Let Space/Enter keep activating a focused button.
      if (action.type === 'toggleMusic' && e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      run(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [qc])

  return help ? <HotkeyHelp onClose={() => setHelp(false)} /> : null
}
