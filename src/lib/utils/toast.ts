import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  dismiss: (toastId?: string) => toastId ? toast.dismiss(toastId) : toast.dismiss(),
  promise: <T>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Something went wrong'
    }: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ) => toast.promise(promise, { loading, success, error })
}; 