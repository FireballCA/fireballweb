import { useState, type ReactNode } from 'react'
import { AdminPanelContent } from '@/components/AdminPanelSheet'
import { cn } from '@/lib/utils'

type AdminConfigurationTab = 'notifications' | 'announcements' | 'products'

interface AdminConfigurationPageProps {
  announcementsContent: ReactNode
  productsContent: ReactNode
}

export function AdminConfigurationPage({
  announcementsContent,
  productsContent,
}: AdminConfigurationPageProps) {
  const [activeTab, setActiveTab] = useState<AdminConfigurationTab>('notifications')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {([
          { id: 'notifications', label: 'Notifications' },
          { id: 'announcements', label: 'Announcements' },
          { id: 'products', label: 'Configuration produits' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'notifications' ? (
        <AdminPanelContent section="notifications" />
      ) : activeTab === 'announcements' ? (
        <>{announcementsContent}</>
      ) : (
        <>{productsContent}</>
      )}
    </div>
  )
}
