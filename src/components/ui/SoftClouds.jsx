/** Warm sunset sky with a few drifting cloud shapes. CSS only — no WebGL. */
export default function SoftClouds({ paused = false, className = '' }) {
  return (
    <div className={`sky-lite ${paused ? 'is-paused' : ''} ${className}`} aria-hidden>
      <span className="sky-cloud sky-cloud-a" />
      <span className="sky-cloud sky-cloud-b" />
      <span className="sky-cloud sky-cloud-c" />
      <span className="sky-cloud sky-cloud-d" />
    </div>
  )
}
