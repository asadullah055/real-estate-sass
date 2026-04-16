import type { ITenant, RetellSettings } from './tenant.model.js';

export interface RetellSettingsDto {
  /** Masked value, e.g. "key_****abcd". Use hasApiKey to check if set. */
  apiKey?: string;
  receptionistAgentId?: string;
  qualifierAgentId?: string;
  /** Masked value. Use hasWebhookSecret to check if set. */
  webhookSecret?: string;
  fromNumber?: string;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
}

export interface TenantSettingsDto {
  id: string;
  name: string;
  slug: string;
  retellSettings: RetellSettingsDto;
  status: string;
}

/** Shows prefix + **** + last 4 chars so users can identify which key is saved */
function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}

export function toRetellSettingsDto(settings: RetellSettings): RetellSettingsDto {
  return {
    apiKey:               maskSecret(settings.apiKey),
    receptionistAgentId: settings.receptionistAgentId,
    qualifierAgentId:    settings.qualifierAgentId,
    webhookSecret:       maskSecret(settings.webhookSecret),
    fromNumber:          settings.fromNumber,
    hasApiKey:           !!settings.apiKey,
    hasWebhookSecret:    !!settings.webhookSecret,
  };
}

export function toTenantSettingsDto(tenant: ITenant): TenantSettingsDto {
  return {
    id:             tenant._id.toString(),
    name:           tenant.name,
    slug:           tenant.slug,
    retellSettings: toRetellSettingsDto(tenant.retellSettings ?? {}),
    status:         tenant.status,
  };
}
