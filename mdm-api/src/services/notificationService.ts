/**
 * Notification Service
 * 通知创建 + 列表查询 + 已读操作
 * BullMQ 背景队列（S3-1 MVP 直接写 DB，后续加队列）
 */
import type { PrismaClient } from '@prisma/client';
import type { NotificationType } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface CreateNotificationOptions {
  recipientEmail: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建一条通知（写 DB）
   * TODO(S3-2): 后续加 BullMQ 队列，邮件/WebSocket 推送走异步 job
   */
  async create(options: CreateNotificationOptions): Promise<void> {
    await this.prisma.notification.create({
      data: {
        recipient_email: options.recipientEmail,
        type: options.type,
        title: options.title,
        body: options.body ?? null,
        metadata: (options.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  /**
   * 批量创建通知
   */
  async createMany(optionsList: CreateNotificationOptions[]): Promise<void> {
    await this.prisma.notification.createMany({
      data: optionsList.map(o => ({
        recipient_email: o.recipientEmail,
        type: o.type,
        title: o.title,
        body: o.body ?? null,
        metadata: (o.metadata as Prisma.InputJsonValue) ?? undefined,
      })),
    });
  }

  /**
   * 获取用户通知列表（分页）
   */
  async list(params: {
    recipientEmail: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { recipientEmail, unreadOnly = false, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      recipient_email: recipientEmail,
      ...(unreadOnly ? { read_at: null } : {}),
    };

    const [total, unreadCount, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipient_email: recipientEmail, read_at: null },
      }),
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      data,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 标记单条通知为已读
   */
  async markRead(id: string, recipientEmail: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: { id, recipient_email: recipientEmail, read_at: null },
      data: { read_at: new Date() },
    });
    return result.count > 0;
  }

  /**
   * 全部标为已读
   */
  async markAllRead(recipientEmail: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { recipient_email: recipientEmail, read_at: null },
      data: { read_at: new Date() },
    });
    return result.count;
  }

  /**
   * 删除通知（仅本人可删）
   */
  async delete(id: string, recipientEmail: string): Promise<boolean> {
    const result = await this.prisma.notification.deleteMany({
      where: { id, recipient_email: recipientEmail },
    });
    return result.count > 0;
  }
}
