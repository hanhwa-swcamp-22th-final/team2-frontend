import { api } from '@/lib/api'

export async function fetchActivityEmails() {
  const { data } = await api.get('/email-logs')
  return data.content ?? data
}
