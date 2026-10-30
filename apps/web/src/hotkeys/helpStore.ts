import { create } from 'zustand'

export const useHotkeyHelp = create<{ open: boolean }>(() => ({ open: false }))

export const toggleHotkeyHelp = () => useHotkeyHelp.setState((s) => ({ open: !s.open }))
