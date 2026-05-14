import { useState, useEffect } from 'react';

import { checkApiHealth } from '../helpers/apiHealthCheck';

export function useApiSanityCheck() {
  const [warning, setWarning] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkApiHealth().then((result) => {
      setWarning(result.warning);
      setIsChecking(false);
    });
  }, []);

  return { warning, isChecking };
}
