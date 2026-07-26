import { Action } from '@stacksjs/actions'
import { fieldReport } from '../../Support/catalog'

/**
 * `GET /api/field-report`
 *
 * The whole flight record behind the site's maps: the field, every detection
 * with its position and confidence, and the prescription's zone geometry.
 *
 * `sample: true` is part of the payload rather than a note in the docs, so a
 * consumer cannot present these figures as a customer's results by accident.
 */
export default new Action({
  name: 'FieldReportAction',
  description: 'The full flight record for the demonstration field',
  method: 'GET',

  async handle() {
    const report = await fieldReport()

    if (!report)
      return { success: false, message: 'No flight record has been seeded on this instance.' }

    return { data: report }
  },
})
