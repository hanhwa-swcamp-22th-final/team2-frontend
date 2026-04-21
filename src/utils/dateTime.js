export const KST_TIME_ZONE = 'Asia/Seoul'

const EXPLICIT_ZONE_PATTERN = /(?:[zZ]|[+-]\d{2}:?\d{2})$/
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/

const kstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const kstDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function pad(value) {
  return String(value).padStart(2, '0')
}

function partsToMap(parts) {
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]))
}

function parseLocalDateTime(value) {
  const match = String(value ?? '').trim().match(LOCAL_DATE_TIME_PATTERN)
  if (!match) return null

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  return {
    year,
    month: pad(month),
    day: pad(day),
    hour: pad(hour),
    minute: pad(minute),
    second: pad(second),
  }
}

function hasExplicitZone(value) {
  return EXPLICIT_ZONE_PATTERN.test(String(value ?? '').trim())
}

export function formatKstDateInput(value) {
  if (arguments.length === 0) value = new Date()
  if (value == null || value === '') return ''

  if (typeof value === 'string') {
    const local = parseLocalDateTime(value)
    if (local && !hasExplicitZone(value)) {
      return `${local.year}-${local.month}-${local.day}`
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) return ''

  const parts = partsToMap(kstDateFormatter.formatToParts(date))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatKstSlashDate(value) {
  if (arguments.length === 0) value = new Date()
  const dateInput = formatKstDateInput(value)
  return dateInput ? dateInput.replaceAll('-', '/') : ''
}

export function formatKstDateTime(value) {
  if (arguments.length === 0) value = new Date()
  if (value == null || value === '') return ''

  if (typeof value === 'string') {
    const local = parseLocalDateTime(value)
    if (local && !hasExplicitZone(value)) {
      return `${local.year}/${local.month}/${local.day} ${local.hour}:${local.minute}`
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) return String(value)

  const parts = partsToMap(kstDateTimeFormatter.formatToParts(date))
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`
}

export function parseKstDateValue(value) {
  const dateInput = formatKstDateInput(value)
  if (!dateInput) return 0

  const [year, month, day] = dateInput.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function parseKstDateTimeValue(value) {
  if (value == null || value === '') return 0
  if (value instanceof Date) return value.getTime()

  const local = parseLocalDateTime(value)
  if (local && !hasExplicitZone(value)) {
    const timestamp = Date.UTC(
      Number(local.year),
      Number(local.month) - 1,
      Number(local.day),
      Number(local.hour),
      Number(local.minute),
      Number(local.second),
    )
    return Number.isFinite(timestamp) ? timestamp : 0
  }

  const timestamp = new Date(value).getTime()
  if (Number.isFinite(timestamp)) return timestamp

  return parseKstDateValue(value)
}
