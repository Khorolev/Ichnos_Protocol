import { useState } from 'react';

const INITIAL_LOGIN = { email: '', password: '' };
const INITIAL_SIGNUP = {
  email: '',
  password: '',
  name: '',
  surname: '',
  company: '',
  phone: '',
  linkedin: '',
};
const INITIAL_COMPLETION = { name: '', surname: '' };

export function useAuthFormState() {
  const [activeTab, setActiveTab] = useState('login');
  const [loginFields, setLoginFields] = useState(INITIAL_LOGIN);
  const [signupFields, setSignupFields] = useState(INITIAL_SIGNUP);
  const [completionFields, setCompletionFields] = useState(INITIAL_COMPLETION);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setLoginFields(INITIAL_LOGIN);
    setSignupFields(INITIAL_SIGNUP);
    setCompletionFields(INITIAL_COMPLETION);
    setError('');
    setLoading(false);
    setActiveTab('login');
  };

  return {
    activeTab,
    setActiveTab,
    loginFields,
    setLoginFields,
    signupFields,
    setSignupFields,
    completionFields,
    setCompletionFields,
    error,
    setError,
    loading,
    setLoading,
    resetState,
  };
}
