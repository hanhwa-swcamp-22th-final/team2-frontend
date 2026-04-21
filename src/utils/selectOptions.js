function resolveOptionLabel(value, labelResolver) {
  if (!labelResolver) return value
  if (typeof labelResolver === 'function') return labelResolver(value)

  const raw = String(value ?? '')
  return labelResolver[raw]
    ?? labelResolver[raw.toLowerCase()]
    ?? labelResolver[raw.toUpperCase()]
    ?? value
}

export function buildSelectOptions(values = [], labelResolver = null) {
  const seen = new Set()

  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
    .map((value) => ({ value, label: resolveOptionLabel(value, labelResolver) }))
}

export function buildSelectOptionsFromRows(rows = [], field, labelResolver = null) {
  return buildSelectOptions(rows.map((row) => row?.[field]), labelResolver)
}
