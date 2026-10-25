/** Ownership is derived afresh from the server-authenticated caller. */
export async function ownedFarmIds(user: unknown): Promise<number[]> {
  if (!user || typeof user !== 'object' || !('id' in user))
    return []

  const userId = holdingId(user.id)
  if (userId === null)
    return []

  const { default: Farm } = await import('../Models/Farm')
  const farms = await Farm.where('user_id', userId).get()
  return farms.map(farm => Number(farm.id))
}

/** Resolve children through app models, including the live holding scope. */
export async function ownedMissionIds(user: unknown): Promise<number[]> {
  const farms = await ownedFarmIds(user)
  if (farms.length === 0)
    return []

  const { default: Mission } = await import('../Models/Mission')
  const missions = await Mission.whereIn('farm_id', farms).get()
  return missions.map(mission => Number(mission.id))
}

/** Reject coercible, ambiguous, fractional and unsafe selector values. */
export function holdingId(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)))
    return null

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
