import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 8000,
})

api.interceptors.request.use((config) => {
  config.headers['X-Screen-Only'] = 'true'
  return config
})
