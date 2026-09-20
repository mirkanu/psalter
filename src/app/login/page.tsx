import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { AccountRequestNote } from '@/components/auth/AccountRequestNote'

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-background px-4 py-8">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <AccountRequestNote />
    </div>
  )
}
