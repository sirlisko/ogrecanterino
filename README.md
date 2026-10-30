# Ogre Canterino

A self-hosted soundboard for tabletop RPG sessions. You build **scenes** out of a music playlist,
ambience layers (constant loops, or one-shots that fire at random intervals) and effect pads, then run them
live at the table or stream them into a Discord voice channel.

- Imports bardic.tools sound libraries (CSV) and scene exports (`scenes.json`)
- Crossfades between tracks and between whole scenes; fade everything out with Esc, then resume if you didn't mean it
- Collections: ordered sets of scenes for a campaign or one-shot, stepped through with `[` and `]` like a setlist
- Keyboard-driven: `1`–`0` fire effects, `Shift+1`–`9` fire your quick pads, `Space` plays or pauses music, hold `D` to lower the music while you talk (press `?` for the full list)
- A combat button that swaps the music to a linked battle playlist and back
- Preview anything on your own device without interrupting the table
- Table mode with big buttons for running a session from a tablet
- Shared library with batch uploads, editable details, per-GM scenes, favourites and quick pads
- Discord bot that plays the exact mix you hear, with no re-encoding on the server

Design decisions and shared conventions live in [docs/decisions.md](docs/decisions.md) and
[docs/conventions.md](docs/conventions.md).

## How it works

```
Browser (GM)                                       Server (Docker)
Web Audio mixer ── speakers                        Fastify API + SQLite
        └─ MediaRecorder (WebM/Opus) ── WebSocket ─▶ demux → split into 20 ms Opus frames → Discord voice
```

Only the browser mixes audio, so the table and Discord always hear the same thing.

## Local development

Requires Node 22+, pnpm and ffmpeg (`brew install ffmpeg`).

```sh
pnpm install
cp .env.example .env          # set DEV_LOGIN=true and ADMIN_DISCORD_IDS=dev for a local login button
pnpm --filter @ogre/server import:library ~/Documents/rpg/tools/bardic_tools_sounds.csv ~/Documents/rpg/tools/soundk
pnpm --filter @ogre/server import:scenes ~/Documents/rpg/tools/soundk/scenes.json
pnpm dev                      # API on :3000, app on http://localhost:5173
pnpm test
```

Imports are idempotent, so you can re-run them after adding files. Imported scenes are shared with
everyone as templates. GMs duplicate them to make their own versions. Scene cards whose audio file
isn't in the library are kept and marked _missing_.

## Discord setup

1. Create an application at <https://discord.com/developers/applications>.
2. **OAuth2**: add the redirect `https://<your-domain>/auth/callback` (and `http://localhost:5173/auth/callback`
   for development). Copy the client ID and secret into `.env`.
3. **Bot**: reset the token and copy it into `DISCORD_BOT_TOKEN`. No privileged intents are needed.
4. Invite the bot to your server with the link shown in the app's Discord panel. It needs View Channel, Connect and Speak.
5. Put your server's ID in `ALLOWED_GUILD_IDS` (only its members can log in) and your own user ID in `ADMIN_DISCORD_IDS`.

During a session, open **Discord** in the bottom bar, pick a voice channel, and the bot joins and starts playing
your mix. If you're also in the channel, untick "Play through this device" so you don't hear it twice. One
bot can be in one channel per Discord server, so two GMs in the same server can't stream at the same time.

Streaming works in Chrome, Edge and Firefox.

## Deploying to a VPS

Any small Linux box with Docker works (2 GB RAM and about 10 GB of disk for the bundled library).

```sh
git clone <this repo> ogrecanterino && cd ogrecanterino
cp .env.example .env    # fill in DOMAIN, PUBLIC_URL, SESSION_SECRET and the Discord values
docker compose up -d --build
```

Point the domain's DNS at the server first. Caddy fetches the HTTPS certificate automatically.

### Uploading the library

From your machine, copy only the audio files plus the CSV and scene export:

```sh
rsync -av --include='*/' --include='*.mp3' --include='*.ogg' --include='*.wav' --include='scenes.json' \
  --exclude='*' ~/Documents/rpg/tools/soundk/ server:ogre-import/soundk/
rsync -av ~/Documents/rpg/tools/bardic_tools_sounds.csv server:ogre-import/
```

Then on the server:

```sh
cd ogrecanterino
docker compose run --rm -v ~/ogre-import:/import:ro app \
  node_modules/.bin/tsx scripts/import-library.ts /import/bardic_tools_sounds.csv /import/soundk
docker compose run --rm -v ~/ogre-import:/import:ro app \
  node_modules/.bin/tsx scripts/import-scenes.ts /import/soundk/scenes.json
rm -rf ~/ogre-import    # the import copied the files into ./data/audio
```

### Backups

Everything lives in `./data`: `app.db` (scenes, users, favourites), `audio/` and `banners/`. A nightly
consistent copy of the database:

```sh
0 4 * * * sqlite3 ~/ogrecanterino/data/app.db ".backup '/backups/ogre-$(date +\%a).db'"
```

## Deploying with Coolify

Coolify's own proxy handles HTTPS, so skip `compose.yaml` and its Caddy service and build the Dockerfile directly:

1. **New Resource → Private Repository**, branch `main`.
2. **Build Pack** `Dockerfile`, location `/docker/Dockerfile`, base directory `/`. **Ports Exposes** `3000`.
3. **Domains**: `https://<your-domain>`.
4. **Environment Variables**: everything in `.env.example` except `DOMAIN` and `DEV_LOGIN`. Untick "Build Variable"
   on the secrets.
5. **Persistent Storage**: a directory (bind) mount from `/srv/ogrecanterino/data` to `/data`, not a named volume,
   so the library can be rsynced in and the database backed up from the host.
6. Deploy, then check the mount from the container terminal with `grep ' /data ' /proc/self/mountinfo`.

Upload the library into the mounted folder. rsync won't create missing parent directories, and Docker creates
the mount as root:

```sh
ssh server 'sudo mkdir -p /srv/ogrecanterino/data/import && sudo chown -R $USER: /srv/ogrecanterino/data/import'
rsync -av --include='*/' --include='*.mp3' --include='*.ogg' --include='*.wav' --include='scenes.json' \
  --exclude='*' ~/Documents/rpg/tools/soundk/ server:/srv/ogrecanterino/data/import/soundk/
rsync -av ~/Documents/rpg/tools/bardic_tools_sounds.csv server:/srv/ogrecanterino/data/import/
```

Then in Coolify's container **Terminal**:

```sh
cd /app/apps/server
node_modules/.bin/tsx scripts/import-library.ts /data/import/bardic_tools_sounds.csv /data/import/soundk
node_modules/.bin/tsx scripts/import-scenes.ts /data/import/soundk/scenes.json
rm -rf /data/import
```

The import only needs to run once: redeploys keep `/data`. Turn on **Auto Deploy** to redeploy on every push to
`main`. For backups, use the cron above with `/srv/ogrecanterino/data/app.db`.

## Credits and licensing

The bundled sounds come from many artists, and many are under Creative Commons licences that require attribution.
The **Credits** page lists every artist from the library's `By` column. Keep the app behind the Discord login
and don't make the audio publicly downloadable.
