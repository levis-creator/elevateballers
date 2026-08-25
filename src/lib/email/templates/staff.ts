import { C } from '../config';
import { emailWrapper, sendTransactionalEmail } from '../core';
import { configuredEmailTemplate } from '../runtime-settings';

export async function sendStaffTransferNotification(data: {
  email: string;
  name: string;
  fromTeam: string;
  toTeam: string;
  effectiveFrom: Date;
}): Promise<void> {
  const effectiveDate = data.effectiveFrom.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const configured = await configuredEmailTemplate('staffTransfer', {
    name: data.name,
    firstName: data.name.split(/\s+/)[0] || 'there',
    email: data.email,
    fromTeam: data.fromTeam,
    team: data.toTeam,
    effectiveDate,
  });
  if (configured) {
    await sendTransactionalEmail({ to: data.email, subject: configured.subject, html: emailWrapper(configured.html), audit: { template: 'staff_transfer_notification' } });
    return;
  }
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Anton','Arial Black',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Team assignment updated</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Your ElevateBallers staff assignment is moving from <strong>${data.fromTeam}</strong> to <strong>${data.toTeam}</strong>.</p>
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">Effective date: <strong>${effectiveDate}</strong>.</p>
  `);
  await sendTransactionalEmail({ to: data.email, subject: `Your team assignment is moving to ${data.toTeam}`, html, audit: { template: 'staff_transfer_notification' } });
}
