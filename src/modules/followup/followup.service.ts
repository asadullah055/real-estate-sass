import { FollowupRepository } from './followup.repository.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { ConflictError } from '../../common/errors/AppError.js';
import type { IFollowup } from './followup.model.js';
import type { ISequence } from './sequence.model.js';

export const FollowupService = {
  async createSequence(workspaceId: string, data: Partial<ISequence>): Promise<ISequence> {
    const existing = await FollowupRepository.findSequenceById(workspaceId, data.sequenceId ?? '');
    if (existing) throw new ConflictError('Sequence ID already exists in this workspace');
    return FollowupRepository.createSequence({
      ...data,
      workspaceId: workspaceId as unknown as ISequence['workspaceId'],
    });
  },

  async listSequences(workspaceId: string): Promise<ISequence[]> {
    return FollowupRepository.listSequences(workspaceId);
  },

  async getSequenceById(workspaceId: string, sequenceId: string): Promise<ISequence> {
    const sequence = await FollowupRepository.findSequenceById(workspaceId, sequenceId);
    if (!sequence) throw new NotFoundError('Sequence');
    return sequence;
  },

  async updateSequenceById(
    workspaceId: string,
    sequenceId: string,
    data: Partial<ISequence>,
  ): Promise<ISequence> {
    const sequence = await FollowupRepository.updateSequenceById(workspaceId, sequenceId, data);
    if (!sequence) throw new NotFoundError('Sequence');
    return sequence;
  },

  async deleteSequenceById(workspaceId: string, sequenceId: string): Promise<void> {
    const deleted = await FollowupRepository.deleteSequenceById(workspaceId, sequenceId);
    if (!deleted) throw new NotFoundError('Sequence');
  },

  async createFollowup(workspaceId: string, data: Partial<IFollowup>): Promise<IFollowup> {
    return FollowupRepository.create({
      ...data,
      workspaceId: workspaceId as unknown as IFollowup['workspaceId'],
    });
  },

  async listFollowups(workspaceId: string, leadId?: string): Promise<IFollowup[]> {
    if (leadId) return FollowupRepository.findByLeadId(workspaceId, leadId);
    return FollowupRepository.findAll(workspaceId);
  },

  async getFollowupById(id: string, workspaceId: string): Promise<IFollowup> {
    const followup = await FollowupRepository.findById(id, workspaceId);
    if (!followup) throw new NotFoundError('Followup');
    return followup;
  },

  async updateFollowupById(
    id: string,
    workspaceId: string,
    data: Partial<IFollowup>,
  ): Promise<IFollowup> {
    const followup = await FollowupRepository.updateById(id, workspaceId, data);
    if (!followup) throw new NotFoundError('Followup');
    return followup;
  },

  async deleteFollowupById(id: string, workspaceId: string): Promise<void> {
    const deleted = await FollowupRepository.deleteById(id, workspaceId);
    if (!deleted) throw new NotFoundError('Followup');
  },

  async createFromSequence(
    workspaceId: string,
    leadId: string,
    sequenceId: string,
    startAt?: string | Date,
  ): Promise<IFollowup[]> {
    const sequence = await FollowupRepository.findSequenceById(workspaceId, sequenceId);
    if (!sequence || !sequence.isActive) throw new NotFoundError('Sequence');

    const startTime = startAt ? new Date(startAt) : new Date();
    if (Number.isNaN(startTime.getTime())) throw new Error('Invalid startAt value');

    const payload: Partial<IFollowup>[] = [...sequence.steps]
      .sort((a, b) => a.step - b.step)
      .map((step) => ({
        workspaceId: workspaceId as unknown as IFollowup['workspaceId'],
        leadId:      leadId as unknown as IFollowup['leadId'],
        sequenceId:  sequence.sequenceId,
        stepNumber:  step.step,
        type:        step.type,
        content: {
          subject: step.subject,
          body:    step.template,
        },
        scheduledAt: new Date(startTime.getTime() + step.delayMinutes * 60 * 1000),
        status:      'scheduled',
        response:    { opened: false, clicked: false, replied: false },
      }));

    return FollowupRepository.bulkCreate(payload);
  },

  async getDueFollowups(workspaceId: string, limit?: number): Promise<IFollowup[]> {
    return FollowupRepository.findDue(workspaceId, limit);
  },

  async markSent(
    id: string,
    workspaceId: string,
    response?: Partial<IFollowup['response']>,
  ): Promise<IFollowup> {
    const followup = await FollowupRepository.updateStatus(id, workspaceId, 'sent', {
      sentAt:   new Date(),
      response: response
        ? {
            opened:  !!response.opened,
            clicked: !!response.clicked,
            replied: !!response.replied,
          }
        : undefined,
    });

    if (!followup) throw new NotFoundError('Followup');
    return followup;
  },

  async markFailed(id: string, workspaceId: string): Promise<IFollowup> {
    const followup = await FollowupRepository.updateStatus(id, workspaceId, 'failed');
    if (!followup) throw new NotFoundError('Followup');
    return followup;
  },

  async cancelSequence(workspaceId: string, leadId: string): Promise<number> {
    return FollowupRepository.cancelByLeadId(workspaceId, leadId);
  },
};
