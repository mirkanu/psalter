import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background px-4">
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}