export function buildSignupSyncPayload(signupFields) {
  return {
    email: signupFields.email,
    name: signupFields.name,
    surname: signupFields.surname,
    company: signupFields.company || undefined,
    phone: signupFields.phone || undefined,
    linkedin: signupFields.linkedin || undefined,
  };
}

export function buildCompletionSyncPayload(canonicalEmail, fields) {
  return {
    email: canonicalEmail,
    name: fields.name,
    surname: fields.surname,
  };
}
