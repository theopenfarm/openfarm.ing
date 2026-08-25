import process from 'node:process'
import { schedule } from '@stacksjs/scheduler'

/**
 * **Scheduler**
 *
 * Define your scheduled tasks here. Jobs, actions, and shell commands
 * can all be scheduled with a fluent, expressive API.
 *
 * @see https://docs.stacksjs.com/scheduling
 */
export default function () {
  // Run the Inspire job every hour
  schedule
    .job('Inspire')
    .hourly()
    .setTimeZone('America/Los_Angeles')

  /*
   * Turn each holding's active capabilities into flights that are due.
   *
   * Early morning: the plan for the day should exist before anyone looks at
   * it, and a flight planned overnight can still be flown in the same weather
   * window. Daily rather than hourly because the cadences are measured in
   * days — running it more often would find nothing due and write nothing.
   */
  schedule
    .job('ScheduleCapabilityFlights')
    .daily()
    .at('05:30')
    .setTimeZone('Europe/Berlin')

  /*
   * Propose the herding moves each grazing holding's rotation is due.
   *
   * Half an hour after the flight schedule, so the two never contend for the
   * same box, and early for the same reason: a farmer wants the morning's
   * proposals waiting when they look, not arriving while they read them. It
   * only ever writes proposals - nothing on this schedule can put an aircraft
   * over livestock, which is why herding is safe to plan unattended at all.
   */
  schedule
    .job('PlanHerdMoves')
    .daily()
    .at('06:00')
    .setTimeZone('Europe/Berlin')

  // Run a custom action every five minutes
  // schedule.action('CleanupTempFiles').everyFiveMinutes()

  // Run a shell command daily at midnight
  // schedule.command('echo "Daily maintenance complete"').daily()
}

process.on('SIGINT', () => {
  schedule.gracefulShutdown().then(() => process.exit(0))
})
