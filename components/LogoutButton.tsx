'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/actions/logout'
import { toast } from 'sonner'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      toast.success('Sesión cerrada correctamente')
    } catch (error) {
      toast.error('Error al cerrar sesión', {
        description: error instanceof Error ? error.message : 'Ocurrió un error desconocido',
      })
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="outline"
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
    </Button>
  )
}


