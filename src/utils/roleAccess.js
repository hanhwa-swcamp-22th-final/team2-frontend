const COMMON_ROUTE_NAMES = new Set(['dashboard'])

const ROLE_ROUTE_ALLOWLIST = {
  production: new Set(['dashboard', 'production', 'production-detail']),
  shipping: new Set(['dashboard', 'shipment-orders', 'shipment-order-detail', 'shipments', 'shipment-detail']),
}

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

  if (role === 'admin' || role === 'sales') {
    return true
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

  if (role === 'admin' || role === 'sales') {
    return true
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
