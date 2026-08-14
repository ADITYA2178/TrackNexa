import { buildApiUrl } from '../config/api'

export async function signUp(payload) {
  const response = await fetch(buildApiUrl('/api/sign-up'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to create account')
  }

  return data
}
