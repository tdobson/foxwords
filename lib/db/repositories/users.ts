import type { D1DatabaseLike } from '../client';
import type { UserRow } from '../types';

export interface CreateUserInput {
  id: string;
  email: string;
  stripeCustomerId?: string | null;
  subscriptionStatus?: 'free' | 'plus';
  createdAt?: number;
}

export class UserRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async findById(id: string): Promise<UserRow | null> {
    const stmt = this.db
      .prepare(
        'SELECT id, email, stripe_customer_id, subscription_status, created_at, updated_at FROM users WHERE id = ?'
      )
      .bind(id);
    return stmt.first<UserRow>();
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const stmt = this.db
      .prepare(
        'SELECT id, email, stripe_customer_id, subscription_status, created_at, updated_at FROM users WHERE email = ?'
      )
      .bind(email.toLowerCase().trim());
    return stmt.first<UserRow>();
  }

  async create(input: CreateUserInput): Promise<UserRow> {
    const now = input.createdAt ?? Date.now();
    const email = input.email.toLowerCase().trim();
    const subStatus = input.subscriptionStatus ?? 'plus';
    const stripeId = input.stripeCustomerId ?? null;

    await this.db
      .prepare(
        'INSERT INTO users (id, email, stripe_customer_id, subscription_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(input.id, email, stripeId, subStatus, now, now)
      .run();

    return {
      id: input.id,
      email,
      stripe_customer_id: stripeId,
      subscription_status: subStatus,
      created_at: now,
      updated_at: now,
    };
  }

  async updateSubscription(
    id: string,
    stripeCustomerId: string | null,
    subscriptionStatus: 'free' | 'plus'
  ): Promise<void> {
    const now = Date.now();
    await this.db
      .prepare(
        'UPDATE users SET stripe_customer_id = ?, subscription_status = ?, updated_at = ? WHERE id = ?'
      )
      .bind(stripeCustomerId, subscriptionStatus, now, id)
      .run();
  }
}
