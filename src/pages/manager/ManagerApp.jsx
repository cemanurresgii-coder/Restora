import { useState } from 'react'
import ManagerReservations from './ManagerReservations'
import ManageMenu from './ManageMenu'
import ManagerDashboard from './ManagerDashboard'
import MenuContent from '../customer/MenuContent'
import AdvancedReports from '../../components/manager/AdvancedReports'

const TABS = [
  { key: 'dashboard',    label: 'Dashboard'    },
  { key: 'reservations', label: 'Reservations' },
  { key: 'reports',      label: 'Reports'      },
  { key: 'menu-view',    label: 'Menu'         },
  { key: 'manage-menu',  label: 'Manage Menu'  },
]

export default function ManagerApp() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div>
      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-14 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${activeTab === key
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'menu-view' ? (
        <MenuContent hideCart />
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-6">
          {activeTab === 'dashboard'    && <ManagerDashboard />}
          {activeTab === 'reservations' && <ManagerReservations />}
          {activeTab === 'reports'      && <AdvancedReports />}
          {activeTab === 'manage-menu'  && <ManageMenu />}
        </div>
      )}
    </div>
  )
}
