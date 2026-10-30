import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { emptySceneData } from '@ogre/shared'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from './app.ts'
import { openDb } from './db/client.ts'
import { collections, sounds, users } from './db/schema.ts'

const dir = mkdtempSync(join(tmpdir(), 'ogre-'))
const audioDir = join(dir, 'audio')
const db = openDb(':memory:')
let app: Awaited<ReturnType<typeof buildApp>>
let cookie = ''

beforeAll(async () => {
  app = await buildApp({
    db,
    audioDir,
    bannerDir: join(dir, 'banners'),
    sessionSecret: 'x'.repeat(32),
  })
  mkdirSync(audioDir, { recursive: true })
  writeFileSync(join(audioDir, 'rain_ab12cd34ef.wav'), Buffer.alloc(1000, 7))
  db.insert(sounds)
    .values({
      title: 'Rain',
      filename: 'rain_ab12cd34ef.wav',
      mime: 'audio/wav',
      size: 1000,
      category: 'ambience',
    })
    .run()
  const login = await app.inject({ method: 'POST', url: '/auth/dev-login' })
  cookie = String(login.headers['set-cookie']).split(';')[0] ?? ''
})

const get = (url: string, headers: Record<string, string> = {}) =>
  app.inject({ method: 'GET', url, headers: { cookie, ...headers } })

describe('auth', () => {
  it('rejects anonymous API and audio requests', async () => {
    expect((await app.inject({ url: '/api/sounds' })).statusCode).toBe(401)
    expect((await app.inject({ url: '/audio/rain_ab12cd34ef.wav' })).statusCode).toBe(401)
  })

  it('returns the logged-in user', async () => {
    expect((await get('/api/me')).json()).toMatchObject({ name: 'Dev GM' })
  })
})

describe('sounds', () => {
  it('lists the library', async () => {
    expect((await get('/api/sounds')).json()).toEqual([expect.objectContaining({ title: 'Rain' })])
  })

  it('serves audio with range requests and immutable caching', async () => {
    const res = await get('/audio/rain_ab12cd34ef.wav', { range: 'bytes=0-99' })
    expect(res.statusCode).toBe(206)
    expect(res.rawPayload.length).toBe(100)
    expect(res.headers['cache-control']).toContain('immutable')
  })
})

describe('scenes', () => {
  it('creates, updates, duplicates, exports and deletes a scene', async () => {
    const body = { name: 'Tavern', tags: ['Tavern'], data: emptySceneData() }
    const created = await app.inject({
      method: 'POST',
      url: '/api/scenes',
      headers: { cookie },
      payload: body,
    })
    expect(created.statusCode).toBe(201)
    const { id } = created.json()

    const updated = await app.inject({
      method: 'PUT',
      url: `/api/scenes/${id}`,
      headers: { cookie },
      payload: { ...body, name: 'Tavern (night)', visibility: 'group' },
    })
    expect(updated.json()).toMatchObject({
      name: 'Tavern (night)',
      visibility: 'group',
      ownerName: 'Dev GM',
    })

    const copy = await app.inject({
      method: 'POST',
      url: `/api/scenes/${id}/duplicate`,
      headers: { cookie },
    })
    expect(copy.json()).toMatchObject({ name: 'Tavern (night) (copy)', visibility: 'private' })

    const exported = (await get(`/api/scenes/${id}/export`)).json()
    const imported = await app.inject({
      method: 'POST',
      url: '/api/scenes/import',
      headers: { cookie },
      payload: exported,
    })
    expect(imported.json()).toMatchObject({ imported: ['Tavern (night)'] })

    expect((await get('/api/scenes')).json()).toHaveLength(3)
    const del = await app.inject({
      method: 'DELETE',
      url: `/api/scenes/${id}`,
      headers: { cookie },
    })
    expect(del.statusCode).toBe(204)
  })

  it('validates scene bodies', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scenes',
      headers: { cookie },
      payload: { name: '' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('me', () => {
  it('stores favourites, pads and recent plays', async () => {
    const [rain] = (await get('/api/sounds')).json()
    await app.inject({ method: 'PUT', url: `/api/me/favourites/${rain.id}`, headers: { cookie } })
    expect((await get('/api/me/favourites')).json()).toEqual([rain.id])

    const pads = [{ slot: 1, soundId: rain.id, label: 'Rain' }]
    await app.inject({ method: 'PUT', url: '/api/me/pads', headers: { cookie }, payload: pads })
    expect((await get('/api/me/pads')).json()).toEqual(pads)

    await app.inject({ method: 'POST', url: `/api/me/recent/${rain.id}`, headers: { cookie } })
    expect((await get('/api/me/recent')).json()).toEqual([rain.id])
  })
})

describe('collections', () => {
  const send = (method: 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    app.inject({ method, url, headers: { cookie }, payload: payload as object })
  const newScene = async (name: string) =>
    (await send('POST', '/api/scenes', { name, data: emptySceneData() })).json().id as string

  it('keeps scenes in order, skipping duplicates and unknown ids', async () => {
    const [a, b] = [await newScene('Road'), await newScene('Camp')]
    const created = await send('POST', '/api/collections', {
      name: 'Strahd',
      sceneIds: [b, a, 'nope', b],
    })
    expect(created.statusCode).toBe(201)
    const { id, sceneIds } = created.json()
    expect(sceneIds).toEqual([b, a])

    const updated = await send('PUT', `/api/collections/${id}`, {
      name: 'Strahd, act 1',
      visibility: 'group',
      sceneIds: [a, b],
    })
    expect(updated.json()).toMatchObject({ name: 'Strahd, act 1', sceneIds: [a, b] })

    await send('DELETE', `/api/scenes/${a}`)
    expect((await get(`/api/collections/${id}`)).json().sceneIds).toEqual([b])

    expect((await send('DELETE', `/api/collections/${id}`)).statusCode).toBe(204)
    expect((await get(`/api/collections/${id}`)).statusCode).toBe(404)
  })

  it("hides other GMs' private collections", async () => {
    const other = db
      .insert(users)
      .values({ discordId: 'other', name: 'Other GM' })
      .returning()
      .get()
    const hidden = db
      .insert(collections)
      .values({ ownerId: other.id, name: 'Secret' })
      .returning()
      .get()
    expect((await get(`/api/collections/${hidden.id}`)).statusCode).toBe(404)
    expect((await get('/api/collections')).json()).not.toContainEqual(
      expect.objectContaining({ id: hidden.id }),
    )
  })

  it("refuses edits to another GM's shared collection", async () => {
    const other = db.select().from(users).where(eq(users.discordId, 'other')).get()
    const shared = db
      .insert(collections)
      .values({ ownerId: other!.id, name: 'Shared', visibility: 'group' })
      .returning()
      .get()
    const res = await send('PUT', `/api/collections/${shared.id}`, { name: 'Mine now' })
    expect(res.statusCode).toBe(403)
  })

  it('validates collection bodies', async () => {
    expect((await send('POST', '/api/collections', { name: ' ' })).statusCode).toBe(400)
  })
})
