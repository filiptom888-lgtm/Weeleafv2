import { gsap } from 'gsap'

/**
 * Module-level mutable state for the coin orbit angle.
 * GSAP animates this directly; Coin3D reads it in useFrame.
 */
export const orbitState = {
  angle: 0,
  focusedId: null,
  lastManualAt: 0,
}

/** Orbit angle that places a coin at screen-center, in front of the camera (+Z). */
export const FRONT_DEGREES = 90

function shortestAngleDelta(from, to) {
  let d = (to - from) % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

export function markOrbitManual() {
  orbitState.lastManualAt = performance.now()
  orbitState.focusedId = null
}

export function orbitDeltaToCoin(coin) {
  if (!coin || coin.angle == null) return 0
  return shortestAngleDelta(orbitState.angle, FRONT_DEGREES - coin.angle)
}

export function centerOrbitOnCoin(coin, { duration = 0.72, ease = 'power2.inOut', force = false } = {}) {
  if (!coin || coin.angle == null) return Promise.resolve()
  if (!force && performance.now() - orbitState.lastManualAt < 220) return Promise.resolve()

  orbitState.focusedId = coin.id
  const target = FRONT_DEGREES - coin.angle
  const delta = shortestAngleDelta(orbitState.angle, target)
  if (Math.abs(delta) < 0.35) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    gsap.to(orbitState, {
      angle: orbitState.angle + delta,
      duration,
      ease,
      overwrite: 'auto',
      onComplete: () => {
        orbitState.angle = ((orbitState.angle % 360) + 360) % 360
        resolve()
      },
    })
  })
}
