import { createWorkspace } from '../auth/actions'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = typeof resolvedParams.error === 'string' ? resolvedParams.error : undefined

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Welcome to LVA</h1>
        <p className="text-gray-600 mb-6 text-center">Let&apos;s create your first workspace.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form action={createWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Workspace Name</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              required 
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  )
}
