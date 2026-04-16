import { Types } from 'mongoose';
import { SubscriptionModel, type ISubscription, type SubscriptionPlan, type SubscriptionStatus } from './subscription.model.js';

export const SubscriptionRepository = {
  async findByUserId(userId: string | Types.ObjectId): Promise<ISubscription | null> {
    return SubscriptionModel.findOne({ userId }).lean() as unknown as Promise<ISubscription | null>;
  },

  async findByStripeCustomerId(stripeCustomerId: string): Promise<ISubscription | null> {
    return SubscriptionModel.findOne({ stripeCustomerId }).lean() as unknown as Promise<ISubscription | null>;
  },

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<ISubscription | null> {
    return SubscriptionModel.findOne({ stripeSubscriptionId }).lean() as unknown as Promise<ISubscription | null>;
  },

  async create(data: {
    userId: Types.ObjectId;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialEndsAt?: Date;
    stripeCustomerId?: string;
  }): Promise<ISubscription> {
    const doc = new SubscriptionModel(data);
    return doc.save();
  },

  async updateByUserId(
    userId: string | Types.ObjectId,
    updates: Partial<Pick<ISubscription,
      | 'stripeCustomerId'
      | 'stripeSubscriptionId'
      | 'plan'
      | 'status'
      | 'trialEndsAt'
      | 'currentPeriodEnd'
      | 'cancelAtPeriodEnd'
    >>,
  ): Promise<ISubscription | null> {
    return SubscriptionModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true },
    ).lean() as unknown as Promise<ISubscription | null>;
  },

  async updateByStripeSubscriptionId(
    stripeSubscriptionId: string,
    updates: Partial<Pick<ISubscription,
      | 'plan'
      | 'status'
      | 'currentPeriodEnd'
      | 'cancelAtPeriodEnd'
    >>,
  ): Promise<ISubscription | null> {
    return SubscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId },
      { $set: updates },
      { new: true },
    ).lean() as unknown as Promise<ISubscription | null>;
  },

  async findAllWithPagination(
    page: number,
    limit: number,
    filter: Record<string, unknown> = {},
  ): Promise<{ subscriptions: ISubscription[]; total: number }> {
    const skip = (page - 1) * limit;
    const [subscriptions, total] = await Promise.all([
      SubscriptionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SubscriptionModel.countDocuments(filter),
    ]);
    return { subscriptions: subscriptions as unknown as ISubscription[], total };
  },

  async countByPlan(): Promise<{ free_trial: number; pro: number }> {
    const [freeCount, proCount] = await Promise.all([
      SubscriptionModel.countDocuments({ plan: 'free_trial' }),
      SubscriptionModel.countDocuments({ plan: 'pro' }),
    ]);
    return { free_trial: freeCount, pro: proCount };
  },
};
