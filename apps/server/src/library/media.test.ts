import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { measureGainDb } from './media.ts'

const hasFfmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

function tone(dir: string, name: string, source: string) {
  const path = join(dir, name)
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', source, '-t', '5', path])
  return path
}

describe.skipIf(!hasFfmpeg)('measureGainDb', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ogre-loudness-'))

  it('boosts a quiet sound towards the target', async () => {
    const gain = await measureGainDb(tone(dir, 'quiet.wav', 'sine=f=1000,volume=-12dB'), 'music')
    expect(gain).toBeGreaterThan(8)
    expect(gain).toBeLessThanOrEqual(12)
  })

  it('cuts a loud sound', async () => {
    const gain = await measureGainDb(tone(dir, 'loud.wav', 'sine=f=1000,volume=15dB'), 'music')
    expect(gain).toBeLessThan(-6)
  })

  it('leaves silence alone', async () => {
    expect(await measureGainDb(tone(dir, 'silence.wav', 'anullsrc'), 'effect')).toBeNull()
  })
})
