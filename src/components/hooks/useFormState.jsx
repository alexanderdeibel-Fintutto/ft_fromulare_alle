import { useState, useCallback } from 'react';

export function useFormState(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const setValue = useCallback((fieldId, value) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => ({ ...prev, [fieldId]: null }));
  }, []);
  
  const setFieldTouched = useCallback((fieldId) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
  }, []);
  
  const setFieldError = useCallback((fieldId, error) => {
    setErrors(prev => ({ ...prev, [fieldId]: error }));
  }, []);
  
  const reset = useCallback((newValues = {}) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, []);
  
  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    setFieldError,
    reset
  };
}