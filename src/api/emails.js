import { api } from '@/lib/api'

export async function fetchActivityEmails() {
  const { data } = await api.get('/activityEmails')
  return data
}
