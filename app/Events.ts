import type { Events } from '@stacksjs/types'

/**
 * Model events this app listens for. Stacks 0.74 only accepts event names
 * declared on `AppEvents` (or its built-in auth events), so the ones the map
 * below uses are declared here. The payload is the model row the ORM emits.
 */
declare module '@stacksjs/events' {
  interface AppEvents {
    'user:created': Record<string, unknown>
    'herdMove:created': Record<string, unknown>
    'herdMove:updated': Record<string, unknown>
  }
}

/**
 * **Events Configuration**
 *
 * This configuration defines all of your events. Because Stacks is fully-typed, you may
 * hover any of the options below and the definitions will be provided. In case you
 * have any questions, feel free to reach out via Discord or GitHub Discussions.
 */
export default {
  // eventName: ['Listener1', 'Listener2'] -> listeners default to ./app/actions/*
  'user:registered': ['SendWelcomeEmail'],
  'user:created': ['NotifyUser'],

  /*
   * Herding moves.
   *
   * `HerdMove` is observed, so the ORM emits these on every write. They are
   * declared here with no listeners yet because the events are the integration
   * point an operations desk needs: a move being authorised is the moment an
   * aircraft may launch, and a move being aborted is the moment somebody has
   * to go and look at a mob. Both want a notification long before they want a
   * dashboard refresh.
   */
  'herdMove:created': [],
  'herdMove:updated': [],
} satisfies Events
