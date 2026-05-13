import { useState } from 'react'
import MenuContent from './MenuContent'
import ReserveContent from './ReserveContent'
import MyReservationsContent from './MyReservationsContent'
import RestaurantLocation from '../../components/customer/RestaurantLocation'
import DietaryProfile from '../../components/customer/DietaryProfile'

const TABS = [
  { key: 'menu',            label: 'Menu'            },
  { key: 'reserve',         label: 'Reserve'         },
  { key: 'my-reservations', label: 'My Reservations' },
  { key: 'location',        label: 'Location'        },
  { key: 'profile',         label: 'My Profile'      },
]

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('menu')

  return (
    <div>
      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-14 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
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
      {activeTab === 'menu'            && <MenuContent />}
      {activeTab === 'reserve'         && <ReserveContent onSuccess={() => setActiveTab('my-reservations')} />}
      {activeTab === 'my-reservations' && <MyReservationsContent />}
      {activeTab === 'location'        && <RestaurantLocation />}
      {activeTab === 'profile'         && <DietaryProfile />}
    </div>
  )
}
