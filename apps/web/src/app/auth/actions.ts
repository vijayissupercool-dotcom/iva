'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
}

import { prisma } from '@lva/db'
import { redirect as navRedirect } from 'next/navigation'

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    navRedirect('/login')
  }

  const name = formData.get('name') as string
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  try {
    await prisma.$transaction(async (tx) => {
      // Ensure user exists in our DB
      await tx.user.upsert({
        where: { id: user.id },
        update: { email: user.email ?? '' },
        create: {
          id: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.full_name,
        }
      })

      // Create workspace and member
      await tx.workspace.create({
        data: {
          name,
          slug,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      })
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    navRedirect('/onboarding?error=' + encodeURIComponent(message))
  }

  revalidatePath('/', 'layout')
  navRedirect('/app')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  navRedirect('/login')
}
