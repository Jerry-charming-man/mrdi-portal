/**
 * @mrdi/teams-notify — MRDI Teams Notify Gateway SDK
 *
 * 用法：
 * ```ts
 * import { TeamsNotifyClient, templates } from '@mrdi/teams-notify';
 *
 * const client = new TeamsNotifyClient({
 *   gatewayBaseUrl: 'http://localhost:3010',
 *   sourceSystem:   'cimrms',
 *   serviceToken:   process.env.TEAMS_NOTIFY_SERVICE_TOKEN!,
 * });
 *
 * await client.send({
 *   eventId:    `cimrms-${requestId}-schedule`,
 *   recipients: { users: [assigneeEmail] },
 *   card:       templates.scheduleCard({ ... }),
 * });
 * ```
 */

export { TeamsNotifyClient, type TeamsNotifyClientOptions } from './client.js';
export type {
  AdaptiveCard,
  CallbackConfig,
  Recipients,
  SendParams,
  NotifyOptions,
  NotificationStatus,
} from './client.js';
export { GatewayError } from './client.js';

export { templates } from './templates/index.js';
export type {
  ApprovalTemplateParams,
  ScheduleTemplateParams,
  UatResultTemplateParams,
  DeployReadyTemplateParams,
  StatusUpdateTemplateParams,
} from './templates/index.js';
