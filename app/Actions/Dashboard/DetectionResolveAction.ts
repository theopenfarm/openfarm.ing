import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import Detection from '../../Models/Detection'
import Mission from '../../Models/Mission'
import { farmFor } from '../../Support/dashboard'
import { seeOther } from '../../Support/formResponse'
import { userFromRequest } from '../../Support/session'

/**
 * Close a finding, or put it back on the list.
 *
 * A detection is the model's opinion; whether it mattered is the farmer's. The
 * dashboard is where that judgement is recorded, and it has to go both ways —
 * a patch marked done that comes back next week needs reopening, not a second
 * row saying the same thing.
 *
 * Ownership is checked through the flight: a detection belongs to a mission,
 * and a mission belongs to a farm.
 */
export default new Action({
  name: 'DetectionResolveAction',
  description: 'Mark one of the farmer’s detections resolved, or reopen it',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('detection-resolve', 120).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return seeOther('/login')

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id)
      return seeOther('/dashboard?e=noholding')

    const detectionId = Number(request.get('detection_id'))
    if (!Number.isFinite(detectionId))
      return seeOther('/dashboard/detections?e=unknown')

    const detection = await Detection.where('id', detectionId).first()
    if (!detection?.id)
      return seeOther('/dashboard/detections?e=notfound')

    const flight = await Mission
      .where('id', Number((detection as any).mission_id))
      .where('farm_id', farm.id)
      .first()

    if (!flight?.id)
      return seeOther('/dashboard/detections?e=notfound')

    /*
     * The model's own vocabulary, not a generic "resolved".
     *
     * A finding closes in one of two ways and the difference matters to the
     * next flight: `treated` means the farmer acted on it and the patch should
     * be re-checked, `dismissed` means it was not a real problem and the model
     * was wrong. Collapsing both into one state throws away the only signal
     * that says which.
     */
    const intent = String(request.get('intent') ?? 'treated')
    const status = intent === 'reopen'
      ? 'open'
      : intent === 'dismiss' ? 'dismissed' : 'treated'

    await Detection.where('id', Number(detection.id)).update({ status } as any)

    return seeOther(`/dashboard/detections?ok=${status}`)
  },
})
