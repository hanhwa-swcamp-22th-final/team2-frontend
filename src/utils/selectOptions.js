export function buildSelectOptions(values = []) {
  const seen = new Set()

  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
    .map((value) => ({ value, label: value }))
}

export function buildSelectOptionsFromRows(rows = [], field) {
  return buildSelectOptions(rows.map((row) => row?.[field]))
}
