const SESSION_KEY = 'auth_completion_shown';

export function isCompletionRequired(profileState) {
  return profileState?.isProfileComplete === false;
}

export function markCompletionShown() {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function wasCompletionShown() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function clearCompletionShown() {
  sessionStorage.removeItem(SESSION_KEY);
}
