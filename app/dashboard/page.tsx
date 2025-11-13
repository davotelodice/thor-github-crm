import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/components/SearchBar'
import LeadsTable from '@/components/LeadsTable'
import RemoveDuplicatesButton from '@/components/RemoveDuplicatesButton'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard - CRM de Leads</h1>
          <p className="text-muted-foreground">
            Busca y gestiona tus leads de manera eficiente
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="mb-4">
        <RemoveDuplicatesButton />
      </div>

      <div className="mt-8">
        <LeadsTable />
      </div>
    </div>
  )
}

