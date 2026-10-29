import {
  privacyConsentText,
  type PublicPrivacyPolicySettings,
} from '../../settings/application/privacyPolicySettings';

export type RegistrationConsentInput = { policyVersion: string; consentText: string };

export type PrivacyConsentCheck =
  | { ok: true; consent: RegistrationConsentInput }
  | { ok: false; status: number; error: string };

/** A public registration must carry `privacyConsent: true` and the policy
 * version the form showed. A version that no longer matches means the policy
 * changed after the form loaded, so the registrant is asked to review it again
 * rather than being recorded against wording they never saw. */
export function checkPrivacyConsent(
  data: { privacyConsent?: unknown; privacyPolicyVersion?: unknown },
  policy: PublicPrivacyPolicySettings
): PrivacyConsentCheck {
  if (data.privacyConsent !== true) return { ok: false, status: 400, error: policy.consentError };
  const shownVersion =
    typeof data.privacyPolicyVersion === 'string' ? data.privacyPolicyVersion.trim() : '';
  if (shownVersion !== policy.version)
    return {
      ok: false,
      status: 409,
      error:
        'Our Privacy Policy has been updated. Please refresh the page, review it and submit again.',
    };
  return {
    ok: true,
    consent: { policyVersion: policy.version, consentText: privacyConsentText(policy.consentLabel) },
  };
}
