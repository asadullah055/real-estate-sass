import { Types } from 'mongoose';
import { FollowupModel, type IFollowup } from './followup.model.js';
import { SequenceModel, type ISequence } from './sequence.model.js';

export const FollowupRepository = {
  async create(data: Partial<IFollowup>): Promise<IFollowup> {
    const followup = new FollowupModel(data);
    return followup.save();
  },

  async findDue(workspaceId: string, limit = 100): Promise<IFollowup[]> {
    return FollowupModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      status:      'scheduled',
      scheduledAt: { $lte: new Date() },
    })
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .lean() as unknown as Promise<IFollowup[]>;
  },

  async updateStatus(
    id: string,
    workspaceId: string,
    status: IFollowup['status'],
    patch: Partial<Pick<IFollowup, 'sentAt' | 'response'>> = {},
  ): Promise<IFollowup | null> {
    return FollowupModel.findOneAndUpdate(
      {
        _id:         new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
      },
      { $set: { status, ...patch } },
      { new: true },
    ).lean() as unknown as Promise<IFollowup | null>;
  },

  async findByLeadId(workspaceId: string, leadId: string): Promise<IFollowup[]> {
    return FollowupModel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      leadId:      new Types.ObjectId(leadId),
    })
      .sort({ scheduledAt: 1 })
      .lean() as unknown as Promise<IFollowup[]>;
  },

  async bulkCreate(data: Partial<IFollowup>[]): Promise<IFollowup[]> {
    const created = await FollowupModel.insertMany(data, { ordered: true });
    return created as unknown as IFollowup[];
  },

  async cancelByLeadId(workspaceId: string, leadId: string): Promise<number> {
    const result = await FollowupModel.updateMany(
      {
        workspaceId: new Types.ObjectId(workspaceId),
        leadId:      new Types.ObjectId(leadId),
        status:      { $in: ['scheduled'] },
      },
      { $set: { status: 'cancelled' } },
    );

    return result.modifiedCount;
  },

  async findAll(workspaceId: string): Promise<IFollowup[]> {
    return FollowupModel.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .sort({ scheduledAt: 1 })
      .lean() as unknown as Promise<IFollowup[]>;
  },

  async findById(id: string, workspaceId: string): Promise<IFollowup | null> {
    return FollowupModel.findOne({
      _id:         new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    }).lean() as unknown as Promise<IFollowup | null>;
  },

  async updateById(id: string, workspaceId: string, data: Partial<IFollowup>): Promise<IFollowup | null> {
    return FollowupModel.findOneAndUpdate(
      {
        _id:         new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
      },
      { $set: data },
      { new: true },
    ).lean() as unknown as Promise<IFollowup | null>;
  },

  async deleteById(id: string, workspaceId: string): Promise<boolean> {
    const result = await FollowupModel.deleteOne({
      _id:         new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    return result.deletedCount > 0;
  },

  async createSequence(data: Partial<ISequence>): Promise<ISequence> {
    const sequence = new SequenceModel(data);
    return sequence.save();
  },

  async listSequences(workspaceId: string): Promise<ISequence[]> {
    return SequenceModel.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<ISequence[]>;
  },

  async findSequenceById(workspaceId: string, sequenceId: string): Promise<ISequence | null> {
    return SequenceModel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      sequenceId,
    }).lean() as unknown as Promise<ISequence | null>;
  },

  async updateSequenceById(
    workspaceId: string,
    sequenceId: string,
    data: Partial<ISequence>,
  ): Promise<ISequence | null> {
    return SequenceModel.findOneAndUpdate(
      {
        workspaceId: new Types.ObjectId(workspaceId),
        sequenceId,
      },
      { $set: data },
      { new: true },
    ).lean() as unknown as Promise<ISequence | null>;
  },

  async deleteSequenceById(workspaceId: string, sequenceId: string): Promise<boolean> {
    const result = await SequenceModel.deleteOne({
      workspaceId: new Types.ObjectId(workspaceId),
      sequenceId,
    });
    return result.deletedCount > 0;
  },
};
