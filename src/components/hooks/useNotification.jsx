import { toast } from 'sonner';

/**
 * Notification Hook
 * Unified API for all toast notifications
 */

export function useNotification() {
  return {
    success: (message, options = {}) => toast.success(message, {
      duration: 3000,
      ...options
    }),

    error: (message, options = {}) => toast.error(message, {
      duration: 4000,
      ...options
    }),

    info: (message, options = {}) => toast.info(message, {
      duration: 3000,
      ...options
    }),

    warning: (message, options = {}) => toast.warning(message, {
      duration: 4000,
      ...options
    }),

    loading: (message, options = {}) => toast.loading(message, options),

    promise: (promise, messages, options = {}) => {
      return toast.promise(promise, {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error',
        ...options
      });
    },

    custom: (message, options = {}) => toast.custom(message, options),

    dismiss: (toastId) => toast.dismiss(toastId)
  };
}

export default useNotification;