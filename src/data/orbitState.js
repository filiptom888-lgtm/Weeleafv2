/**
 * Module-level mutable state for the coin orbit angle.
 * GSAP animates this directly; Coin3D reads it in useFrame.
 * This avoids batched React re-renders and gives buttery-smooth 60fps orbit.
 */
export const orbitState = { angle: 0 }
