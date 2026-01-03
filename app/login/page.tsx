'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .single()

    if (adminRole) {
      router.push('/admin')
      return
    }

    // Check if user is driver
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .single()

    if (driver) {
      router.push('/driver')
      return
    }

    // Not admin or driver - check if there's an unlinked driver record with this email
    const { data: unlinkedDriver } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', email.toLowerCase())
      .is('user_id', null)
      .single()

    if (unlinkedDriver) {
      // Link the driver record to this user
      await supabase
        .from('drivers')
        .update({ user_id: data.user.id })
        .eq('id', unlinkedDriver.id)
      
      router.push('/driver')
      return
    }

    // No role found
    setError('No admin or driver access found for this account.')
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Check if there's a driver record waiting for this email
    const { data: pendingDriver } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('email', email.toLowerCase())
      .is('user_id', null)
      .single()

    if (!pendingDriver) {
      setError('No driver account found for this email. Please contact your administrator.')
      setLoading(false)
      return
    }

    // Create the auth account
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Link the driver record to the new user
      await supabase
        .from('drivers')
        .update({ user_id: data.user.id })
        .eq('id', pendingDriver.id)

      setSignupSuccess(true)
    }

    setLoading(false)
  }

  if (signupSuccess) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <img src="/oolooicon.jpg" alt="ooloo" className="h-16" />
          </div>
          <h2 className="text-xl font-bold mb-4">Account Created!</h2>
          <p className="text-gray-600 mb-6">
            Please check your email to confirm your account, then you can sign in.
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setMode('login'); }}
            className="text-cyan-600 hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src="/oolooicon.jpg" alt="ooloo" className="h-16" />
        </div>
        
        <div className="flex mb-6 border-b">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 pb-3 text-center font-medium ${mode === 'login' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 pb-3 text-center font-medium ${mode === 'signup' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}
          >
            Sign Up
          </button>
        </div>
        
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder={mode === 'signup' ? 'Create a password' : ''}
              minLength={mode === 'signup' ? 6 : undefined}
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
          >
            {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            Only drivers who have been added by an administrator can sign up.
          </p>
        )}
      </div>
    </main>
  )
}