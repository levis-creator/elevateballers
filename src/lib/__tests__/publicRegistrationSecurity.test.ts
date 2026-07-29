import { describe, expect, it } from 'vitest';
import { isHoneypotTriggered, normalizeEmail, normalizePhone, normalizeText, validatePlayerRegistration, validateTeamRegistration } from '../publicRegistrationSecurity';

describe('public registration security', () => {
  it('normalizes names and emails', () => {
    expect(normalizeText('  Asha   Wanjiku  ')).toBe('Asha Wanjiku');
    expect(normalizeEmail('  ASHA@Example.COM ')).toBe('asha@example.com');
    expect(normalizePhone(' (+254) 700-000-000 ')).toBe('+254700000000');
  });

  it('detects the honeypot', () => {
    expect(isHoneypotTriggered('')).toBe(false);
    expect(isHoneypotTriggered('bot value')).toBe(true);
  });

  it('rejects invalid or oversized public payloads', () => {
    expect(validatePlayerRegistration({ firstName: '', lastName: 'A', email: 'bad', phone: '1', position: 'PG' })).toBeTruthy();
    expect(validateTeamRegistration({ name: 'A'.repeat(121), coachName: 'Coach', contactEmail: 'coach@example.com', contactPhone: '0700000000' })).toBeTruthy();
  });

  it('accepts normalized valid payloads', () => {
    expect(validateTeamRegistration({ name: 'Mavs', coachName: 'Coach A', contactEmail: 'coach@example.com', contactPhone: '0700000000' })).toBeNull();
    expect(validatePlayerRegistration({ firstName: 'Asha', lastName: 'Wanjiku', email: 'asha@example.com', phone: '0700000000', position: 'PG' })).toBeNull();
  });
});
