# Records of Processing Activities (ROPA)

## Controller Information

| Field                   | Details                              |
| ----------------------- | ------------------------------------ |
| Controller name         | Ichnos Protocol Pte. Ltd.            |
| UEN                     | 202606521W                           |
| Address                 | [YOUR REGISTERED ADDRESS, SINGAPORE] |
| Contact email           | [YOUR EMAIL]                         |
| Data Protection Contact | [YOUR NAME], Founder & CEO           |
| Date of last review     | [DATE]                               |
| Next scheduled review   | [DATE + 12 MONTHS]                   |

---

## Processing Activity 1: User Account Management

| Field                               | Details                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Creation and management of user accounts                                                                                                                |
| Purpose                             | Enable users to authenticate, access chat, submit inquiries, and manage their data                                                                      |
| Legal basis (GDPR)                  | Consent (Article 6(1)(a)) for account creation; Contract performance (Article 6(1)(b)) for service delivery                                             |
| Legal basis (PDPA)                  | Consent (Section 13)                                                                                                                                    |
| Categories of data subjects         | Website visitors who create accounts (battery manufacturers, automotive companies, regulatory consultants, investors, researchers, government agencies) |
| Categories of personal data         | Firebase UID, email address, password hash (held by Firebase), name, surname                                                                            |
| Source of data                      | Collected directly from the data subject via signup form                                                                                                |
| Recipients / processors             | Firebase Authentication (Google) — identity provider; Neon (PostgreSQL) — database storage; Vercel — hosting                                            |
| International transfers             | Singapore, EU (Neon), USA (Firebase, Vercel). Safeguards: SCCs, DPAs with all processors                                                                |
| Retention period                    | Until account deletion by user. On deletion: Firebase Auth account revoked, users row marked with deleted_at timestamp                                  |
| Technical & organizational measures | TLS encryption in transit, encryption at rest, Firebase Auth security, parameterized SQL queries, role-based access controls                            |

---

## Processing Activity 2: Contact Inquiry Handling

| Field                               | Details                                                                                                                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Collection and processing of contact form submissions                                                                                                                                                       |
| Purpose                             | Respond to inquiries about battery passport services, compliance consulting, and partnership opportunities                                                                                                  |
| Legal basis (GDPR)                  | Consent (Article 6(1)(a)) — explicit checkbox before submission                                                                                                                                             |
| Legal basis (PDPA)                  | Consent (Section 13)                                                                                                                                                                                        |
| Categories of data subjects         | Website visitors who submit contact forms                                                                                                                                                                   |
| Categories of personal data         | Name, surname, email, phone (optional), company (optional), LinkedIn URL (optional), inquiry question text, request status, admin notes                                                                     |
| Source of data                      | Collected directly from the data subject via contact form                                                                                                                                                   |
| Recipients / processors             | Neon (PostgreSQL) — database storage; Vercel — hosting; Internal admin users — for inquiry management and follow-up                                                                                         |
| International transfers             | Singapore, EU (Neon), USA (Vercel). Safeguards: SCCs, DPAs                                                                                                                                                  |
| Retention period                    | 18 months from last contact. After expiry: PII deleted or consent re-requested. On account deletion: PII overwritten with non-identifying placeholders, non-personal metadata (status, timestamps) retained |
| Technical & organizational measures | TLS, encryption at rest, Zod input validation, parameterized queries, admin authentication required for access, GDPR consent timestamp recorded                                                             |

---

## Processing Activity 3: AI Chat Interactions

| Field                               | Details                                                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Processing user questions via AI chat assistant and storing Q&A pairs                                                                                                                               |
| Purpose                             | Provide instant answers to technical questions about battery compliance; store interactions for service improvement and market demand analytics                                                     |
| Legal basis (GDPR)                  | Legitimate interest (Article 6(1)(f)) — supported by documented Legitimate Interest Assessment                                                                                                      |
| Legal basis (PDPA)                  | Legitimate business purpose (Section 13, read with Section 14)                                                                                                                                      |
| Categories of data subjects         | Authenticated users who use the AI chat feature                                                                                                                                                     |
| Categories of personal data         | Chat question text, AI-generated response text, timestamps, user ID (linked to account), derived topic classifications                                                                              |
| Source of data                      | Collected directly from the data subject via chat interface. Topic classifications generated automatically by AI                                                                                    |
| Recipients / processors             | xAI (Grok API) — AI response generation (receives question text only, no PII such as name or email); Neon (PostgreSQL) — Q&A storage; Vercel — hosting                                              |
| International transfers             | Singapore, EU (Neon), USA (xAI, Vercel). Safeguards: SCCs, DPAs. Note: only question text (no PII) is sent to xAI                                                                                   |
| Retention period                    | 36 months from creation. After expiry: anonymized (user identity removed, question/answer text retained for aggregate analytics) or deleted. On account deletion: records anonymized immediately    |
| Technical & organizational measures | TLS, encryption at rest, backend proxy for xAI calls (API keys server-side), per-user rate limiting, transparency notice displayed before chat begins, right to object documented in Privacy Policy |

---

## Processing Activity 4: Chat Topic Analytics

| Field                               | Details                                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Automated classification of chat and form questions into topic categories                                                                          |
| Purpose                             | Generate aggregated market demand analytics, identify trending questions, inform product development                                               |
| Legal basis (GDPR)                  | Legitimate interest (Article 6(1)(f)) — derived from Processing Activity 3                                                                         |
| Legal basis (PDPA)                  | Legitimate business purpose                                                                                                                        |
| Categories of data subjects         | All users who submit questions (chat or form)                                                                                                      |
| Categories of personal data         | Question ID (linked to question text), topic label, confidence score, model identifier. Note: topic records themselves contain no direct PII       |
| Source of data                      | Derived from question text via AI classification (xAI batch analysis triggered by admin)                                                           |
| Recipients / processors             | xAI (Grok API) — topic classification (receives question text only); Neon (PostgreSQL) — topic storage; Internal admin users — analytics dashboard |
| International transfers             | Same as Processing Activity 3                                                                                                                      |
| Retention period                    | Indefinite for aggregated topic counts. Per-question topic records follow the 36-month retention of their parent question record                   |
| Technical & organizational measures | Admin-only access to analytics dashboard, role-based access controls, no PII in topic records themselves                                           |

---

## Processing Activity 5: User Profile Data

| Field                               | Details                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Storage of extended user profile information                                                                           |
| Purpose                             | Pre-fill forms, display user information in admin dashboard swimlanes, enable GDPR data export                         |
| Legal basis (GDPR)                  | Consent (Article 6(1)(a)) — collected at signup with consent checkbox                                                  |
| Legal basis (PDPA)                  | Consent (Section 13)                                                                                                   |
| Categories of data subjects         | All registered users                                                                                                   |
| Categories of personal data         | Name, surname, email, phone (optional), company (optional), LinkedIn URL (optional)                                    |
| Source of data                      | Collected directly from data subject at signup; may be updated by user via profile editing                             |
| Recipients / processors             | Neon (PostgreSQL) — storage; Vercel — hosting; Internal admin users — visible in admin dashboard                       |
| International transfers             | Singapore, EU (Neon), USA (Vercel). Safeguards: SCCs, DPAs                                                             |
| Retention period                    | Until account deletion. On deletion: PII overwritten with non-identifying placeholders (row retained for FK integrity) |
| Technical & organizational measures | TLS, encryption at rest, parameterized queries, authenticated access only                                              |

---

## Processing Activity 6: Admin Lead Management

| Field                               | Details                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Internal management of leads via admin dashboard (Kanban board, timeline, notes)                                          |
| Purpose                             | Track inquiry status, manage follow-ups, add internal notes, qualify leads                                                |
| Legal basis (GDPR)                  | Legitimate interest (Article 6(1)(f)) — necessary for business operations and fulfilling inquiry responses                |
| Legal basis (PDPA)                  | Legitimate business purpose                                                                                               |
| Categories of data subjects         | Users who have submitted inquiries or used the chat                                                                       |
| Categories of personal data         | All data from Processing Activities 2, 3, and 5, plus admin-authored internal notes                                       |
| Source of data                      | Aggregated from other processing activities; admin notes authored by internal staff                                       |
| Recipients / processors             | Internal admin users only (authenticated via Firebase custom claims); Neon (PostgreSQL) — storage                         |
| International transfers             | Same as other activities                                                                                                  |
| Retention period                    | Follows retention of underlying data (18 months for contact data, 36 months for chat data)                                |
| Technical & organizational measures | Admin role verified server-side via Firebase custom claims, admin middleware on all endpoints, audit trail via timestamps |

---

## Processing Activity 7: GDPR Rights Fulfillment

| Field                               | Details                                                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Processing data subject access, portability, and deletion requests                                                                                                   |
| Purpose                             | Comply with GDPR Articles 15-17, 20 and PDPA access/correction/withdrawal rights                                                                                     |
| Legal basis (GDPR)                  | Legal obligation (Article 6(1)(c))                                                                                                                                   |
| Legal basis (PDPA)                  | Legal obligation under PDPA Sections 21, 22                                                                                                                          |
| Categories of data subjects         | Any registered user exercising their rights                                                                                                                          |
| Categories of personal data         | All personal data held about the requesting user                                                                                                                     |
| Source of data                      | Aggregated from all processing activities for the requesting user                                                                                                    |
| Recipients / processors             | Data returned directly to the requesting user (JSON download); Neon (PostgreSQL) — deletion/anonymization operations                                                 |
| International transfers             | Data export delivered directly to user; no additional transfers                                                                                                      |
| Retention period                    | Deletion request logs retained for 3 years for compliance audit purposes                                                                                             |
| Technical & organizational measures | Authenticated access required, identity verified via Firebase Auth before processing, deletion confirmation required, anonymization executed in database transaction |

---

## Processing Activity 8: Website Analytics and Cookies

| Field                               | Details                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Processing activity                 | Collection of website usage data via cookies and analytics tools                                                                  |
| Purpose                             | Understand website traffic, optimize user experience, monitor technical performance                                               |
| Legal basis (GDPR)                  | Strictly necessary cookies: Legitimate interest (Article 6(1)(f)). Analytics cookies: Consent (Article 6(1)(a)) via cookie banner |
| Legal basis (PDPA)                  | Deemed consent for functional cookies; explicit consent for analytics                                                             |
| Categories of data subjects         | All website visitors                                                                                                              |
| Categories of personal data         | Anonymized IP address, browser type, device information, pages visited, session duration, referral source                         |
| Source of data                      | Collected automatically via cookies and web server logs                                                                           |
| Recipients / processors             | Vercel — hosting and edge analytics; [ANALYTICS PROVIDER if applicable]                                                           |
| International transfers             | USA (Vercel). Safeguards: DPA with Vercel                                                                                         |
| Retention period                    | 12 months, then automatically expired                                                                                             |
| Technical & organizational measures | IP anonymization, cookie consent banner with reject option, no advertising cookies, cookie preferences stored locally             |

---

## Sub-Processor Register

| Sub-Processor     | Service                                 | Data Processed                                              | Location | DPA in Place                       | Transfer Mechanism        |
| ----------------- | --------------------------------------- | ----------------------------------------------------------- | -------- | ---------------------------------- | ------------------------- |
| Google (Firebase) | Authentication                          | Firebase UID, email, password hash                          | USA      | Yes — Google Cloud DPA             | SCCs                      |
| Neon Tech         | PostgreSQL database                     | All structured data (profiles, requests, questions, topics) | EU / USA | Yes — Neon DPA                     | SCCs / Adequacy           |
| Vercel            | Website hosting, serverless functions   | Request data in transit, edge logs                          | USA      | Yes — Vercel DPA                   | SCCs                      |
| xAI               | AI chat responses, topic classification | Question text only (no PII)                                 | USA      | [VERIFY — check if xAI offers DPA] | SCCs / No PII transferred |
| Calendly          | Meeting scheduling                      | Name, email (entered by user on Calendly)                   | USA      | Yes — Calendly DPA                 | SCCs                      |

---

## Review Log

| Date   | Reviewer    | Changes Made         |
| ------ | ----------- | -------------------- |
| [DATE] | [YOUR NAME] | Initial ROPA created |
|        |             |                      |
