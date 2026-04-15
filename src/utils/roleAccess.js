const COMMON_ROUTE_NAMES = new Set(['dashboard'])

// sales/admin 외 역할은 도메인 라우트만 접근 가능. sales 는 영업·문서·기준정보 한정.
const ROLE_ROUTE_ALLOWLIST = {
  production: new Set(['dashboard', 'production', 'production-detail']),
  shipping: new Set(['dashboard', 'shipment-orders', 'shipment-order-detail', 'shipments', 'shipment-detail']),
}

// sales 차단 경로 — gateway 에서 ADMIN/PRODUCTION 또는 ADMIN/SHIPPING 만 허용하므로
// 메뉴 노출/라우트 진입을 미리 막아 403 콘솔 에러와 빈 화면 노출 방지
const SALES_BLOCKED_PATH_PREFIXES = ['/production', '/shipment-orders', '/shipments', '/users']
const SALES_BLOCKED_ROUTE_NAMES = new Set([
  'production', 'production-detail',
  'shipment-orders', 'shipment-order-detail',
  'shipments', 'shipment-detail',
  'users',
])

// 백엔드 UPPER_CASE role → 기존 lowercase role 정규화
function normalizeRole(role) {
  if (!role) return role
  return role.toLowerCase()
}

function getUserRole(user) {
  return normalizeRole(user?.userRole ?? user?.role)
}

export function canAccessRouteByRole(user, routeName) {
  if (!user || !routeName) return false
  const role = getUserRole(user)

  if (String(routeName) === 'users') {
    return role === 'admin'
  }

  if (role === 'admin') {
    return true
  }

  if (role === 'sales') {
    return !SALES_BLOCKED_ROUTE_NAMES.has(String(routeName))
  }

  const allowedRoutes = ROLE_ROUTE_ALLOWLIST[role]
  if (!allowedRoutes) {
    return COMMON_ROUTE_NAMES.has(String(routeName))
  }

  return allowedRoutes.has(String(routeName))
}

export function canAccessPathByRole(user, path) {
  if (!user || !path) return false
  const role = getUserRole(user)

  if (path.startsWith('/users')) {
    return role === 'admin'
  }

  if (role === 'admin') {
    return true
  }

  if (role === 'sales') {
    return !SALES_BLOCKED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  }

  if (path === '/') {
    return true
  }

  if (role === 'production') {
    return path.startsWith('/production')
  }

  if (role === 'shipping') {
    return path.startsWith('/shipment-orders') || path.startsWith('/shipments')
  }

  return false
}

export function getRoleHomePath(role) {
  return '/'
}

export function canManageItems(role) {
  const r = normalizeRole(role)
  return r === 'admin'
}

export function canManageClients(role) {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'sales'
}
