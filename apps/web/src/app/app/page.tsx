import { createClient } from '@/utils/supabase/server'
import { prisma } from '@lva/db'
import { redirect } from 'next/navigation'
import { signout } from '../auth/actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

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
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden border-0 bg-transparent cursor-pointer p-0">
                <Avatar>
                  <AvatarImage src="" alt={user.email || "User"} />
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signout} className="w-full">
                <DropdownMenuItem>
                  <button type="submit" className="w-full text-left cursor-pointer text-red-600 outline-none">
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
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
