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

  // Run a custom action every five minutes
  // schedule.action('CleanupTempFiles').everyFiveMinutes()

  // Run a shell command daily at midnight
  // schedule.command('echo "Daily maintenance complete"').daily()
}

process.on('SIGINT', () => {
  schedule.gracefulShutdown().then(() => process.exit(0))
})
