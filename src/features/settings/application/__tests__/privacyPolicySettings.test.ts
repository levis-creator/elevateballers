import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import {
  DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS,
  privacyConsentLabelParts,
  privacyConsentText,
  privacyPolicySections,
  resolvePublicPrivacyPolicySettings,
} from '../privacyPolicySettings';
import { checkPrivacyConsent } from '../../../registration/application/privacy-consent';
import { SECTIONS } from '../../presentation/settingsSections';

const setting = (key: string, value: string): SiteSetting => ({
  id: key,
  key,
  value,
  type: 'text',
  label: key,
  description: null,
  category: 'privacy',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('privacy policy settings', () => {
  it('falls back to the template when fields are missing or blank', () => {
    const settings = resolvePublicPrivacyPolicySettings([setting('privacy_body', '   ')]);
    expect(settings).toEqual(DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS);
  });

  it('uses the edited text, version and checkbox label', () => {
    const settings = resolvePublicPrivacyPolicySettings([
      setting('privacy_title', 'Your Data'),
      setting('privacy_version', ' 2026-12-01 '),
      setting('privacy_body', '## Photos\nWe film games.'),
      setting('privacy_consentLabel', 'I accept the [data policy].'),
    ]);
    expect(settings).toMatchObject({
      title: 'Your Data',
      version: '2026-12-01',
      body: '## Photos\nWe film games.',
      consentLabel: 'I accept the [data policy].',
    });
  });

  it('covers promotion, retention and access requests in the default template', () => {
    const headings = privacyPolicySections(DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS.body).map(
      (section) => section.heading
    );
    expect(headings).toEqual(
      expect.arrayContaining([
        'What we collect',
        'Why we use it',
        'Photos, video and promotion',
        'How long we keep it',
        'Your rights',
      ])
    );
  });

  it('is editable from a Privacy Policy section in admin Settings', () => {
    const section = SECTIONS.find((item) => item.id === 'privacy');
    const keys = section?.groups.flatMap((group) => group.fields.map((field) => field.key));
    expect(section?.href).toBe('/privacy-policy');
    expect(keys).toEqual(
      expect.arrayContaining([
        'privacy_body',
        'privacy_version',
        'privacy_consentLabel',
        'privacy_consentError',
      ])
    );
  });
});

describe('privacy policy text', () => {
  it('splits headings, paragraphs and bullet lists', () => {
    const sections = privacyPolicySections(
      'Intro line one\nline two\n\n## What we collect\n- Names\n- Emails\nAnd photos.\r\n\r\n## Rights\nAsk us.'
    );
    expect(sections).toEqual([
      { heading: '', blocks: [{ type: 'paragraph', text: 'Intro line one line two' }] },
      {
        heading: 'What we collect',
        blocks: [
          { type: 'list', items: ['Names', 'Emails'] },
          { type: 'paragraph', text: 'And photos.' },
        ],
      },
      { heading: 'Rights', blocks: [{ type: 'paragraph', text: 'Ask us.' }] },
    ]);
  });
});

describe('privacy consent label', () => {
  it('links the bracketed text', () => {
    expect(privacyConsentLabelParts('I agree to the [Privacy Policy], incl. photos.')).toEqual({
      before: 'I agree to the ',
      link: 'Privacy Policy',
      after: ', incl. photos.',
    });
  });

  it('adds a policy link when the label has no brackets', () => {
    expect(privacyConsentLabelParts('I agree to photo use.')).toEqual({
      before: 'I agree to photo use. (',
      link: 'Privacy Policy',
      after: ')',
    });
  });

  it('stores the label as plain text', () => {
    expect(privacyConsentText(DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS.consentLabel)).toBe(
      'I agree to the Privacy Policy, including the use of photos and videos of me for league promotion.'
    );
  });
});

describe('registration privacy consent check', () => {
  const policy = DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS;

  it('rejects a missing or non-boolean consent', () => {
    expect(checkPrivacyConsent({ privacyPolicyVersion: policy.version }, policy)).toEqual({
      ok: false,
      status: 400,
      error: policy.consentError,
    });
    expect(
      checkPrivacyConsent({ privacyConsent: 'true', privacyPolicyVersion: policy.version }, policy)
        .ok
    ).toBe(false);
  });

  it('rejects consent given to a different policy version', () => {
    const result = checkPrivacyConsent({ privacyConsent: true }, policy);
    expect(result).toMatchObject({ ok: false, status: 409 });
  });

  it('returns the version and wording to store', () => {
    expect(
      checkPrivacyConsent({ privacyConsent: true, privacyPolicyVersion: policy.version }, policy)
    ).toEqual({
      ok: true,
      consent: { policyVersion: policy.version, consentText: privacyConsentText(policy.consentLabel) },
    });
  });
});
