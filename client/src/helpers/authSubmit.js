export function buildSignupSyncPayload(signupFields, firebaseUser) {
  return {
    firebaseUid: firebaseUser.uid,
    email: signupFields.email,
    name: signupFields.name,
    surname: signupFields.surname,
    company: signupFields.company || undefined,
    phone: signupFields.phone || undefined,
    linkedin: signupFields.linkedin || undefined,
  };
}

export function buildCompletionSyncPayload(
  currentUser,
  canonicalEmail,
  fields,
) {
  return {
    firebaseUid: currentUser?.firebaseUid || currentUser?.uid,
    email: canonicalEmail,
    name: fields.name,
    surname: fields.surname,
  };
}
