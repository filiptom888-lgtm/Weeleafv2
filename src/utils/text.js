/** Strip leading emoji / dingbats so headings match the new type, even from live config. */
const LEADING_EMOJI =
  /^(?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*|\uFE0F|\u200D|[\u2600-\u27BF\u2300-\u23FF\u2B50\uFE0F])+\s*/u

export function stripLeadingEmoji(text) {
  if (typeof text !== 'string') return text
  let next = text.trim()
  let prev = ''
  while (next && next !== prev) {
    prev = next
    next = next.replace(LEADING_EMOJI, '').trim()
  }
  return next
}
