import { type Key, useState, type ReactNode } from 'react'
import { Tabs } from '@heroui/react'
import { motion } from 'motion/react'

type AdminConfigurationTab = 'notifications' | 'announcements' | 'products' | 'trainings' | 'events'

interface AdminConfigurationPageProps {
  notificationsContent: ReactNode
  announcementsContent: ReactNode
  productsContent: ReactNode
  trainingsContent: ReactNode
  eventsContent: ReactNode
  activeTab?: AdminConfigurationTab
  onTabChange?: (tab: AdminConfigurationTab) => void
}

export function AdminConfigurationPage({
  notificationsContent,
  announcementsContent,
  productsContent,
  trainingsContent,
  eventsContent,
  activeTab,
  onTabChange,
}: AdminConfigurationPageProps) {
  const [internalTab, setInternalTab] = useState<AdminConfigurationTab>('notifications')
  const selectedTab = activeTab ?? internalTab

  const setTab = (next: AdminConfigurationTab) => {
    if (!activeTab) setInternalTab(next)
    onTabChange?.(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key: Key) => setTab(String(key) as AdminConfigurationTab)}
          className="w-full max-w-xl"
        >
          <Tabs.List
            aria-label="Navigation de configuration admin"
            className="mx-auto flex w-fit items-center gap-1 rounded-full bg-slate-100 p-1"
          >
            <Tabs.Tab
              id="notifications"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Notifications
            </Tabs.Tab>
            <Tabs.Tab
              id="announcements"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Announcements
            </Tabs.Tab>
            <Tabs.Tab
              id="products"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Products
            </Tabs.Tab>
            <Tabs.Tab
              id="trainings"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Trainings
            </Tabs.Tab>
            <Tabs.Tab
              id="events"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Events
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>
      <div className="relative">
        <motion.div
          initial={false}
          animate={{
            opacity: selectedTab === 'notifications' ? 1 : 0,
            y: selectedTab === 'notifications' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={selectedTab === 'notifications' ? 'block' : 'hidden'}
        >
          {notificationsContent}
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            opacity: selectedTab === 'announcements' ? 1 : 0,
            y: selectedTab === 'announcements' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={selectedTab === 'announcements' ? 'block' : 'hidden'}
        >
          {announcementsContent}
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            opacity: selectedTab === 'products' ? 1 : 0,
            y: selectedTab === 'products' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={selectedTab === 'products' ? 'block' : 'hidden'}
        >
          {productsContent}
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            opacity: selectedTab === 'trainings' ? 1 : 0,
            y: selectedTab === 'trainings' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={selectedTab === 'trainings' ? 'block' : 'hidden'}
        >
          {trainingsContent}
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            opacity: selectedTab === 'events' ? 1 : 0,
            y: selectedTab === 'events' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={selectedTab === 'events' ? 'block' : 'hidden'}
        >
          {eventsContent}
        </motion.div>
      </div>
    </div>
  )
}
