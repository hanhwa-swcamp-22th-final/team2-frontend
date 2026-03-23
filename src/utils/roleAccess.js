const COMMON_ROUTE_NAMES = new Set(['dashboard'])

const ROLE_ROUTE_ALLOWLIST = {
  production: new Set(['dashboard', 'production', 'production-detail']),
  shipping: new Set(['dashboard', 'shipment-orders', 'shipment-order-detail', 'shipments', 'shipment-detail']),
}

export function canAccessRouteByRole(user, routeName) {
  if (!user || !routeName) return false

  if (user.role === 'admin' || user.role === 'sales') {
    return true
  }

  const allowedRoutes = ROLE_ROUTE_ALLOWLIST[user.role]
  if (!allowedRoutes) {
    return COMMON_ROUTE_NAMES.has(String(routeName))
  }

  return allowedRoutes.has(String(routeName))
}

export function canAccessPathByRole(user, path) {
  if (!user || !path) return false

  if (user.role === 'admin' || user.role === 'sales') {
    return true
  }

  if (path === '/') {
    return true
  }

  if (user.role === 'production') {
    return path.startsWith('/production')
  }

  if (user.role === 'shipping') {
    return path.startsWith('/shipment-orders') || path.startsWith('/shipments')
  }

  return false
}

export function getRoleHomePath(role) {
  if (role === 'production') return '/production'
  if (role === 'shipping') return '/shipments'
  return '/'
}

export function canManageItems(role) {
  return role === 'admin'
}

export function canManageClients(role) {
  return role === 'admin' || role === 'sales'
}
