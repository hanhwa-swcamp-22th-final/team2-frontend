import { api } from '@/lib/api'

export async function fetchNavigationItems() {
  const { data } = await api.get('/navigationItems')
  return data
}
