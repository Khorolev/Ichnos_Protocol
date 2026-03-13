# Consent & Notice Texts — Developer Reference

Use these exact strings in the corresponding UI components. Do not modify
without legal review.

---

## 1. Contact Form Consent Checkbox

**Component:** ContactForm.jsx — GDPR consent checkbox (required)

**Text:**

> I consent to Ichnos Protocol storing my contact details to respond to my
> inquiry. My data will be retained for 18 months. I can withdraw consent at
> any time. See our [Privacy Policy](/privacy).

**Implementation notes:**

- Checkbox must be unchecked by default
- Form cannot be submitted without this checkbox checked
- Store timestamp of consent in `users.gdpr_consent_timestamp`

---

## 2. Signup Form Consent Checkbox

**Component:** AuthModal.jsx — Signup tab, consent checkbox (required)

**Text:**

> I consent to Ichnos Protocol storing my contact details to respond to my
> inquiries. See our [Privacy Policy](/privacy).

**Implementation notes:**

- Checkbox must be unchecked by default
- Account cannot be created without this checkbox checked
- This consent covers contact data only (chat analytics is handled under
  legitimate interest — no checkbox needed)

---

## 3. Chat Notice Banner

**Component:** ChatModal.jsx — Displayed at the top of the chat window,
above the first message, on every session start

**Text:**

> Your questions are stored to help us improve our services. For details,
> see our [Privacy Policy](/privacy). You can request deletion of your data
> at any time.

**Implementation notes:**

- This is an informational notice, not a consent gate
- Do NOT require user to click "accept" before chatting
- Display as a subtle, non-dismissible banner or as part of the AI greeting
- This transparency notice is legally required for legitimate interest
  processing

---

## 4. Cookie Consent Banner

**Component:** CookieConsent.jsx (react-cookie-consent)

**Primary text:**

> We use cookies to ensure our website functions properly. We also use
> optional analytics cookies to understand how you use our site.
> See our [Cookie Policy](/cookies).

**Buttons:**

- "Accept all" — enables all cookies
- "Reject all" — only strictly necessary cookies
- "Manage preferences" — opens granular settings

**Implementation notes:**

- Must appear on first visit
- Must not set optional cookies until consent is given
- "Reject all" must be equally prominent as "Accept all"
- Store preference in `cookie_consent` cookie (strictly necessary)

---

## 5. Account Deletion Confirmation Modal

**Component:** PrivacyPage.jsx — Delete account confirmation

**Text:**

> Are you sure you want to delete your account? This action cannot be undone.
>
> Your contact details will be permanently removed. Your chat questions and
> inquiry content will be retained in anonymized form for aggregated
> analytics — your identity will no longer be linked to this data.

**Buttons:**

- "Cancel" (primary/default)
- "Delete my account" (destructive/red)

**Implementation notes:**

- Require the user to type "DELETE" or similar confirmation
- Log the deletion request timestamp before processing
- Process deletion: anonymize user_profiles, contact_requests PII; set
  users.deleted_at; revoke Firebase Auth account

---

## 6. Data Download Confirmation

**Component:** PrivacyPage.jsx — Download data action

**Text (button):**

> Download my data (JSON)

**Text (after download):**

> Your data has been downloaded. The file contains all personal information
> we hold about you, including your profile, contact requests, and chat
> history.

---

## 7. Returning User — Right to Object Notice

**Component:** ContactPage.jsx (returning user status view) or
UserMenu.jsx — Only shown once, after first login post-deployment

**Text:**

> We analyze chat questions in aggregate to improve our services (see our
> Privacy Policy). You can opt out at any time by contacting us at
> [YOUR EMAIL].

**Implementation notes:**

- Show once as a dismissible info banner
- Track dismissal in localStorage or user preferences
- This fulfills the GDPR requirement to inform existing users when
  processing basis changes or when legitimate interest processing begins

---

## Summary: What Needs a Checkbox vs. What Does Not

| Data Processing            | Legal Basis         | Checkbox Required?                |
| -------------------------- | ------------------- | --------------------------------- |
| Contact data storage       | Consent             | YES — checkbox on form and signup |
| Chat question analytics    | Legitimate interest | NO — informational notice only    |
| Strictly necessary cookies | Legitimate interest | NO — no consent needed            |
| Analytics cookies          | Consent             | YES — cookie banner               |
