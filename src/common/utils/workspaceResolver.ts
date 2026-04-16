import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { UserRepository } from '../../modules/user/users.repository.js';
import { TenantModel } from '../../modules/tenant/tenant.model.js';
import { logger } from '../../config/logger.js';

function normalizeWorkspaceId(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return Types.ObjectId.isValid(trimmed) ? trimmed : undefined;
}

/**
 * Resolves a single workspace id for non-tenant-specific flows.
 * Priority: DEFAULT_WORKSPACE_ID env -> first user profile with tenantId.
 */
export async function resolveDefaultWorkspaceId(): Promise<string | undefined> {
  const fromEnv = normalizeWorkspaceId(env.DEFAULT_WORKSPACE_ID);
  if (fromEnv) return fromEnv;
  return UserRepository.findFirstTenantId();
}

/**
 * Finds the single workspace, or creates one if none exists yet.
 * Used during first login to auto-provision the workspace.
 */
export async function getOrCreateDefaultWorkspace(): Promise<string> {
  // 1. Prefer explicit env override
  const fromEnv = normalizeWorkspaceId(env.DEFAULT_WORKSPACE_ID);
  if (fromEnv) return fromEnv;

  // 2. Use existing workspace from DB
  const existing = await TenantModel.findOne().select('_id').lean() as { _id: Types.ObjectId } | null;
  if (existing) return existing._id.toString();

  // 3. Auto-create the first workspace
  const created = await TenantModel.create({
    name: 'Default Workspace',
    slug: 'default',
  });
  logger.info('[workspace] auto-created default workspace', { id: created._id.toString() });
  return created._id.toString();
}
