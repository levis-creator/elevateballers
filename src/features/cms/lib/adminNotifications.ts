import { prisma } from '@/lib/prisma';

export type OperationalNotificationType =
  | 'MAILBOX_SYNC_FAILED'
  | 'ATTACHMENT_BLOCKED'
  | 'EMAIL_DELIVERY_FAILED'
  | 'JOB_FAILED'
  | 'SECURITY_ALERT'
  | 'REGISTRATION_DUPLICATE';

export async function createOperationalNotification(input: {
  type: OperationalNotificationType;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
}) {
  return prisma.registrationNotification.create({
    data: {
      type: input.type,
      message: input.message.slice(0, 191),
      metadata: {
        severity: input.severity ?? 'warning',
        ...(input.metadata ?? {}),
      },
    },
  });
}
