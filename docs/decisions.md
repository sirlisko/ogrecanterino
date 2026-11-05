# Decisions

Why the app works the way it does. Newest first. Each entry says what was decided, why, and what
it rules out, so a later change can tell whether the reason still holds.

## 2026-11-05: Redesign

### A scene's picture: upload, chosen illustration, or its tags

Every scene shows a picture on its card, in the player and in the editor. An uploaded banner wins;
otherwise `data.art` names one of 16 drawn illustrations (`sceneArtKinds`); otherwise the first
setting its tags name picks one (`artForTags`: case-insensitive, with synonyms). A fight is picked
only when no place is named, because "Battle" is usually the mood of a place: a sea battle shows
the sea, and scenes full of fights don't all look the same. The choice lives in the scene's JSON data, so it needed no migration.
While an upload is in use the illustrations are disabled in the picker rather than silently
replacing it: removing the upload is an explicit step, since it deletes the file.

The illustrations are drawn in code (`features/scenes/art`), seeded by the scene's id rather than
its name, so renaming a scene keeps its picture and two forest scenes still look different. They
replace the blurred colour washes, which matched only capitalised tags and so ignored lower-case
ones like the starter pack's.

### A selected collection is a setlist

With a collection selected, the scenes page shows its scenes as a numbered run instead of a grid:
played, playing for the table, up next (with `]`), then the rest. "Played" means started in this
browser tab (`sessionStorage`), so it describes tonight and survives a reload, but a new tab or a
new evening starts clean. Starting a scene from the setlist stays on the setlist; the name opens
the player. "Up next" starts without the second click, like `]`; the others ask first while
something is live. Collections are tabs above the page rather than chips, since they choose what
you're running rather than filtering what you see.

### The live indicator is a lit stage edge and a lit scene

While a scene plays for the table, the top edge of the transport bar lights up and so does the
scene's drawn picture, in the player header, table mode, the transport bar thumbnail and the live
scene's tile: its windows, torches and fires come up and a soft light rises behind the foreground.
At rest the lights are dim, so lit means live. Uploaded pictures have nothing to light and rely on
the edge.

By default these lights are steady. Following the sound drew the eye away from the table, so it's a
setting, "Lights follow the sound", off by default and kept per device. With it on, the edge's
colour mixes the sections by loudness (effects weighted up so a hit tints it before it's gone) and
its brightness follows the loudest one; the picture's lights follow the music and ambience, and an
effect flashes it. Reduced motion keeps them steady whatever the setting.

One animation loop (`audio/liveLevels.ts`) reads the meters for everything that follows the levels,
and everything draws through refs, so nothing re-renders per frame. The steady state is plain
rendering and runs no loop.

We tried and dropped a beam per section rising from the bar: effects are one-offs, so their beam
was dark nearly all the time and the display looked lopsided. The thin music progress line on top
of the transport bar made way for the edge; the bar still shows the time.

### Settings belong to the device

Settings (in the header) are this device's preferences and live in `localStorage`, like the pads row
and the scenes layout: a GM may want a quiet laptop at home and a touch-friendly tablet at the
table. Only the choices a GM changed are saved, so a setting they never touched follows its
default when that default changes.

The audio engine doesn't read settings. `features/settings` hands it the crossfade, the fade-out
length and how far the music ducks at startup and whenever they change, so `audio/` stays free of
UI state. Scene crossfade moved here from the Mixer, which now holds only levels and the mute; it
used to reset to 3 s on every reload.

Keyboard hints default to off on touch screens (`pointer: coarse`), where there's usually no
keyboard to press them on. "Mute this device while sending to Discord" gives the sound back when
the GM stops sending, but only if the stream muted it, and only once per stream: a GM who unmutes
mid-stream isn't muted again by a reconnect.

## 2026-11-05: Session safety

### The Discord stream reconnects by itself

A dropped stream socket (Wi-Fi, a redeploy) retries after 1, 2, 4, 8, then every 15 seconds, for
up to two minutes, and the transport bar says so: "Reconnecting to Discord", then a red "Discord
stream dropped" if it gives up. If the server has forgotten the voice channel (it restarted, or the
tab was gone longer than 30 s) it closes the socket with 4001 and the browser joins the same
channel again before retrying. It never retries after the GM stopped (1000), another tab took over
(4000) or the server refused (1008), so two tabs can't fight over the bot.

### A crash stays inside the page

Pages render inside an error boundary; the transport bar, quick pads and hotkeys sit outside it, so
the GM can still fade out when a page breaks. The audio engine is a singleton and keeps playing
regardless, which is why losing the controls was the real risk.

### A reload offers to resume

While a scene plays, the scene, track and position are saved to `localStorage` (on every track
change, every 5 s and when the tab hides). The next load offers them through the Resume toast,
which stays until dismissed because the GM may not be looking. A fade-out clears the record, and
anything older than 12 hours is ignored. Audio can't start without a click, so this is an offer,
not an automatic restart.

### Blank new scenes are swept, not deleted on close

The editor still discards an untouched new scene when you leave it. Scenes left behind by a closed
tab, reload or crash are deleted the next time their owner opens the scenes page, once they're an
hour old. Deleting on `pagehide` was rejected: a reload keeps the editor's "fresh" state, so it
would delete the scene out from under the page being reloaded.

### The health check only fails on the database

`GET /healthz` is public and returns `{ ok, discord }`. Only a database failure returns 503. A
proxy that routes on health would otherwise take the whole app offline during a Discord outage, so
monitors that care about the bot should check the `discord` field instead.

### Starting another scene from a card takes two clicks

While a scene is live, the start button on a scene card or in "Recently played" first turns into
"Start scene?" for three seconds, and only a second click replaces the live scene. The button sits
where you'd click to open the scene, so browsing mid-session could crossfade the table by
accident. With nothing playing it starts straight away, and the `[`/`]` hotkeys and table mode's
Next button are deliberate enough to skip the question. A GM who finds it in the way can turn it
off in Settings.

### Deleting a scene is undone, not confirmed

Delete hides the scene at once and shows "Deleted … Undo" for eight seconds; the request goes out
when that closes, when another scene is deleted, or when the tab closes (`fetch` with `keepalive`).
It matches Esc and Resume: act now, take it back if it was a mistake. Sounds still ask first, in a
dialog that names the scenes using them, because deleting a sound deletes its file and an undo
would mean keeping the file around. No `confirm()` is left in the app.

### Previews of long sounds can seek

Sounds of 90 s or more stream through a media element, so their preview shows a seek bar in the
library, the editor and a scene that isn't live. Shorter ones play from a decoded buffer and get
none; restarting a buffer at an offset wasn't worth it for clips that short.

### Missing sounds are replaced in the editor

A card whose sound is missing gets "Missing, replace", which opens the library at the section's
category and relinks the card. The label and settings stay, since the GM may have renamed it.

### The app stays one bundle

Splitting the editor and library into lazy chunks would save about 40 KB of the 184 KB (gzip),
once, as the bundle is cached for a year. But a redeploy removes old chunks, so a tab left open
through a deploy would fail to open those pages mid-session. Revisit if the bundle grows a lot.

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

Holding D lowers music to about −10 dB through a gain node after the music bus (Settings also
offers about −6 and −20 dB). It never touches the music volume setting. It releases on key-up or when the window loses focus. Table mode has a
"Hold to talk" button that does the same.

Effect cards can opt in to the same duck ("Lower the music while it plays") for narration and big
monster roars. It's off by default so existing scenes sound the same. The duck stays on while the
key is held or any such effect is sounding.

### Loudness is levelled per category

Every sound is measured once with ffmpeg's EBU R128 filter (on upload, import, or
`measure:loudness`) and stores a trim in dB that each voice applies before its volume. Each category
has its own target (music −14, ambience −25, effects −20 LUFS): the library's averages when this
was added, so files are evened out within a category without shifting the balance between music
and ambience that scenes were mixed with. Boosts stop 1 dB under the file's peak and at +12 dB.
Sounds too short or quiet to measure play unchanged.

### Quick pads live in the transport bar

Pads moved from the bottom of the player page into a **Pads** tray, so they're reachable on every
page. You assign, rename and clear them there; empty pads open a sound picker. The library's
"Assign to pad" select remains as a shortcut.

### Table mode is a separate route

`/table` drops navigation and editing for big touch targets. It shows whatever is playing and only
starts a scene from its explicit controls, consistent with "only Start scene changes what the table
hears".

Updated 2026-11-05 (redesign): the live scene's picture runs behind the header and lights up
with the sound; Back, Next, Hold to talk, Combat and Fade out sit in one strip under it; the mixer
is four upright faders in a column beside the pads, like a desk, and drops under them on a phone.

Updated 2026-11-05: a tablet is often the only screen at the table, so table mode now has the
mixer volumes, "Mute this device", ambience switches (with "Now" for interval layers), the Discord
status and a **Scenes** picker. Ambience switches go through the same working copy as the player
page, so they save for the scene's owner and stay session-only on shared scenes. Only assigned
quick pads show; assigning happens in the transport bar.

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
