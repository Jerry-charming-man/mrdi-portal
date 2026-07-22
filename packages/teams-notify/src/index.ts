/**
 * @mrdi/teams-notify — stub (teams-notify service not yet deployed)
 */
export interface TeamsNotifyOptions {
  gatewayBaseUrl: string;
  sourceSystem: string;
  serviceToken: string;
}

export class TeamsNotifyClient {
  private readonly gatewayBaseUrl: string;
  private readonly sourceSystem: string;
  private readonly serviceToken: string;

  constructor(opts: TeamsNotifyOptions) {
    this.gatewayBaseUrl = opts.gatewayBaseUrl;
    this.sourceSystem = opts.sourceSystem;
    this.serviceToken = opts.serviceToken;
  }

  async send(params: unknown): Promise<void> {
    console.warn('[teams-notify stub] send called — service not available');
  }

  async getStatus(adapterId: string): Promise<unknown> {
    console.warn('[teams-notify stub] getStatus called — service not available');
    return { status: 'stub', adapterId };
  }
}

export function createClient(opts: TeamsNotifyOptions): TeamsNotifyClient {
  return new TeamsNotifyClient(opts);
}

// ─── templates stub ────────────────────────────────────────────────
export const templates = {
  approvalCard: (data: Record<string, unknown>) => ({ type: 'stub_approval', ...data }),
  statusUpdateCard: (data: Record<string, unknown>) => ({ type: 'stub_status', ...data }),
  deployReadyCard: (data: Record<string, unknown>) => ({ type: 'stub_deploy', ...data }),
};
