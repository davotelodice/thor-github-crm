import { toast as sonnerToast } from 'sonner'

export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
  })
}

export function toastError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
  })
}

export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
  })
}

