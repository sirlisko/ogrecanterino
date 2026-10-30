# Decisions

Why the app works the way it does. Newest first. Each entry says what was decided, why, and what
it rules out, so a later change can tell whether the reason still holds.

## 2026-10-30: UX review

### Collections, not folders

Scenes are grouped into **collections**: named, ordered lists of scenes, private or shared with the
group. A scene can be in any number of collections.

- **Why not folders:** RPG scenes get reused ("Rainy tavern" turns up in a campaign, a one-shot and
  another GM's game). Folders give each scene one home, which forces duplicates that drift apart.
  Tags already answer "what kind of scene is this"; collections answer "what am I running".
- **Why "Collections":** neutral enough for campaigns, adventures and one-shots alike.
- **Order is the setlist.** With a collection selected, `[`/`]` (or Page Up/Down) step through its
  scenes and the transport bar shows the next one. There is no separate setlist or session entity.
- **Combat fallback:** a collection can name combat music, used by its scenes that don't set their own.
- **Server behaviour:** `PUT /api/collections/:id` replaces the whole list. Unknown and duplicate
  scene ids are dropped on write. Deleting a scene removes it from every collection (FK cascade).
  Scenes that are no longer shared with you stay in the list and the UI reports them as
  unavailable.
- **Deferred:** nested collections (make "Strahd, act 2" instead) and per-collection sound
  libraries. Add them only if one level proves too flat.

### Only "Start scene" changes what the table hears

On a scene that isn't playing, clicking a track or effect **previews it on this device**; it no longer
starts the scene. A GM preparing the next scene mid-session must never cut the current mood by
accident.

### Previews never reach Discord

Previews (library, editor, non-live scenes, pad picker) play through a parallel preview path wired
straight to the speakers, so they never reach the Discord stream. That path mirrors the master and
bus volumes, and scene previews also apply the card and scene volume, so a track auditions as loud
as it will play; a fixed-level preview sounded louder than the scene and ignored the mixer. They
ignore "Mute this device", because previews are for the GM's ears only.

### One save model: autosave

The player and the editor both save in the background (800 ms debounce, `useLiveScene`), with a
status note and Cmd+S to flush. There is no Save button and no leave-page guard. Changes to shared
scenes you don't own apply live but aren't saved. A scene with an empty name isn't saved, and the
editor says so.

New scenes that are left untouched (still "Untitled scene", no cards, tags or banner) are deleted
when you leave the editor, unless you're going to their own player.

### Esc stays, but becomes undoable

Esc still fades out everything; the habit is worth keeping. A **Resume** toast then appears for 8
seconds and restarts the scene and its track. We chose this over moving fade-out to a harder key.

### Long effects toggle, short ones retrigger

Effects of 8 seconds or longer (`LONG_EFFECT_MS`) show progress, and pressing them again (pad or
hotkey) stops them. Short effects layer on every press, so rapid hits like sword clangs and gunshots
still work.

### Ducking is a gain stage, not a volume change

Holding D lowers music to about −10 dB through a gain node after the music bus. It never touches
the music volume setting. It releases on key-up or when the window loses focus. Table mode has a
"Hold to talk" button that does the same.

Effect cards can opt in to the same duck ("Lower the music while it plays") for narration and big
monster roars. It's off by default so existing scenes sound the same. The duck stays on while the
key is held or any such effect is sounding.

### Quick pads live in the transport bar

Pads moved from the bottom of the player page into a **Pads** tray, so they're reachable on every
page. You assign, rename and clear them there; empty pads open a sound picker. The library's "Pin
to pad" select remains as a shortcut.

### Table mode is a separate route

`/table` drops navigation and editing for big touch targets. It shows whatever is playing and never
starts a scene itself, consistent with "only Start scene changes what the table hears".

### Where state lives

| State                                              | Where                       | Why                                    |
| -------------------------------------------------- | --------------------------- | -------------------------------------- |
| Scenes, collections, sounds, pads, favourites      | Server                      | Shared, or must survive device changes |
| Volumes, active collection, recently played scenes | `localStorage`              | Per-device conveniences; safe to lose  |
| What's playing, previewing, ducked, muted          | Zustand store (`usePlayer`) | Live audio state                       |

### No icon dependency

Controls use a small inline SVG set (`ui/Icon.tsx`). Unicode media glyphs rendered differently per
platform, and some turned into emoji on Apple devices. Add an icon to `PATHS` rather than pulling in
a library.

### Guard a playing session

While a scene plays, closing or reloading the tab asks for confirmation, and the app holds a screen
wake lock so a tablet doesn't lock and suspend the audio. The lock is taken again whenever the tab
becomes visible, because browsers drop it on hide. If the lock is denied (battery saver), the app
does nothing more.

### Considered and not done

- **An "Add to…" dropdown in the editor library:** it would be clipped inside the scrolling sidebar,
  so the rows have labelled buttons instead.
- **Hardware media keys (Media Session API):** short tracks play from decoded buffers, not media
  elements, so the keys would only sometimes work. An unreliable control is worse than none.
- **Playlist resilience:** when a track fails to load (server gone, flaky network) the music deck
  skips straight to the next track, so an outage races through the whole playlist. Worth a retry or
  stop-after-N-failures rule if it bites at the table.

## 2026-10-30: Initial build

### The browser is the only mixer

All mixing happens in Web Audio in the GM's browser. The Discord bot only relays that browser's
Opus stream, so the table and Discord always hear the same mix and the server never re-encodes.
Chromium's MediaRecorder emits 60 ms Opus packets, which the server splits into the 20 ms frames
`@discordjs/voice` expects. WebKit (Safari and every iOS browser) emits 2.5 ms frames instead, which
the server joins eight at a time; sent one per tick, they played as distorted, near-silent audio.
