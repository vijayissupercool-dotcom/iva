import { createClient } from '@/utils/supabase/server'
import { prisma } from '@lva/db'
import { redirect } from 'next/navigation'
import { signout } from '../auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userWithWorkspaces = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: {
          workspace: true
        }
      }
    }
  })

  // If the user has no workspaces, redirect to onboarding
  if (!userWithWorkspaces || userWithWorkspaces.memberships.length === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <form action={signout}>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </header>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Workspaces</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userWithWorkspaces.memberships.map((membership) => (
              <div 
                key={membership.workspaceId} 
                className="p-4 border rounded-md hover:border-blue-500 transition-colors cursor-pointer"
              >
                <h3 className="font-medium text-gray-900">{membership.workspace.name}</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">{membership.role.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
