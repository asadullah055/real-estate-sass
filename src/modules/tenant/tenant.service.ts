import { TenantRepository } from './tenant.repository.js';
import { toTenantSettingsDto, type TenantSettingsDto } from './tenant.dto.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import type { UpdateRetellSettingsInput } from './tenant.validation.js';
import { env } from '../../config/env.js';

export const TenantService = {
  async getSettings(tenantId: string): Promise<TenantSettingsDto> {
    const tenant = await TenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Workspace');
    return toTenantSettingsDto(tenant);
  },

  async updateRetellSettings(
    tenantId: string,
    input: UpdateRetellSettingsInput,
  ): Promise<TenantSettingsDto> {
    const updated = await TenantRepository.updateRetellSettings(tenantId, input);
    if (!updated) throw new NotFoundError('Workspace');
    return toTenantSettingsDto(updated);
  },

  /**
   * Returns raw (unmasked) Retell credentials for internal service use.
   * Falls back to env vars if workspace has no values set.
   */
  async getRetellCredentials(tenantId: string) {
    const settings = await TenantRepository.getRetellSettings(tenantId);
    return {
      apiKey:               settings?.apiKey              || env.RETELL_API_KEY,
      receptionistAgentId: settings?.receptionistAgentId,
      qualifierAgentId:    settings?.qualifierAgentId,
      webhookSecret:       settings?.webhookSecret        || env.RETELL_WEBHOOK_SECRET,
      fromNumber:          settings?.fromNumber,
    };
  },
};
