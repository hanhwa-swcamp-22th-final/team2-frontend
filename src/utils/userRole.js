const VALID_ROLES = new Set(['admin', 'sales', 'production', 'shipping'])

function normalizeOrgName(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '')
}

export function normalizeUserRole(role) {
  const value = String(role ?? '').trim().toLowerCase()
  return VALID_ROLES.has(value) ? value : ''
}

export function deriveRoleFromDepartmentName(name) {
  const value = normalizeOrgName(name)
  if (!value) return ''

  if (value.includes('영업') || value.includes('sales')) return 'sales'
  if (value.includes('생산') || value.includes('production')) return 'production'
  if (value.includes('출하') || value.includes('shipping')) return 'shipping'
  if (value.includes('경영지원') || value.includes('관리') || value.includes('admin')) return 'admin'

  return ''
}

export function inferRoleFromOrg({ departmentId, teamId, departments = [], teams = [] } = {}) {
  const team = teams.find((t) => sameId(t.teamId ?? t.id, teamId))
  const resolvedDepartmentId = departmentId || team?.departmentId
  const department = departments.find((d) => sameId(d.departmentId ?? d.id, resolvedDepartmentId))
  const departmentName = department?.departmentName ?? department?.name ?? team?.departmentName ?? ''
  return deriveRoleFromDepartmentName(departmentName)
}

export function resolveUserRole({ role, departmentId, teamId, departments = [], teams = [] } = {}) {
  return normalizeUserRole(role) || inferRoleFromOrg({ departmentId, teamId, departments, teams })
}

export function toBackendRole(role) {
  return normalizeUserRole(role).toUpperCase()
}
