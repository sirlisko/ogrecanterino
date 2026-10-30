# Conventions

Shared knowledge for working on the app: the vocabulary and visual rules the UI follows, and the
traps we've already fallen into. See [decisions.md](decisions.md) for why things work the way they
do.

## Colour means section

Each section of a scene has one colour, everywhere: cards, lanes, faders, chips, the login page.

| Section  | Token    | Hex       |
| -------- | -------- | --------- |
| Music    | `brass`  | `#d7a84a` |
| Ambience | `lichen` | `#86bfa9` |
| Effects  | `arcane` | `#a98bea` |

`brass` is also the primary action colour. Use `danger` only for destructive or warning states.
Don't introduce a fourth section colour.

## Words

Use the same name for an action everywhere it appears: button, tooltip, shortcut help and toast.

- **Start scene**: starts a scene for the table. **Fade out**: stops everything. **Resume**: undoes a fade-out.
- **Preview**: plays on this device only.
- **Mute this device**: the monitor toggle. Not "play through this device".
- **Collection**, **Quick pads**, **Table mode**.
- Sentence case, plain verbs, no all-caps labels. Errors say what happened and what to do next.

## Keyboard

- Digits and brackets are matched by `KeyboardEvent.code` (physical key), so they work on any
  layout. The Italian layout, for example, needs AltGr for `[`, and the keymap ignores modified
  keys.
- Hotkeys are ignored while typing or while a `<dialog>` is open.
- Popovers and menus stop Escape at the capture phase, so closing them doesn't also fade out the
  scene.
- New shortcuts go in `hotkeys/keymap.ts` (with a test) and in `HOTKEY_HELP`.

## Audio graph

```
music bus → duck ┐
ambience bus ────┼→ master ┬→ monitor → speakers
effect bus ──────┘         └→ MediaStream → Discord
preview ───────────────────────────────→ speakers
```

Anything the GM auditions must go through `engine.preview`/`togglePreview`, never a bus.

## Development gotchas

- **`pnpm dev` runs migrations on your real `data/app.db`.** `tsx watch` restarts the server when
  server files change, and startup applies new Drizzle migrations. To test schema changes, run a
  second server on another port with `DATA_DIR` pointing at a copy of the database.
- **Hot reload can leave two audio engines.** Editing `audio/engine.ts` or `audio/store.ts`
  re-executes the singleton while the old one keeps playing, and controls stop responding. Reload the
  page after touching audio code before deciding something is broken.
- **React StrictMode simulates unmounting** in development. Cleanup that has side effects (like
  discarding a blank scene) must survive an immediate remount; see `useDiscardIfBlank`.
- `vite-plugin-react` can't fast-refresh a module that exports both components and other values; it
  falls back to a full reload. That's harmless but worth knowing.
- Playwright screenshots land in `.playwright-mcp/`, which is git-ignored.
