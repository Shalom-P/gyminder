import type { ComponentType } from 'react'
import { HomeIcon, DumbbellIcon, GearIcon } from './icons'

export type TabId = 'home' | 'library' | 'settings'

const TABS: Array<{
  id: TabId
  label: string
  Icon: ComponentType<{ active?: boolean }>
}> = [
  { id: 'home', label: 'Today', Icon: HomeIcon },
  { id: 'library', label: 'Exercises', Icon: DumbbellIcon },
  { id: 'settings', label: 'Settings', Icon: GearIcon }
]

/**
 * Native iOS bottom tab bar. Fixed to the bottom of the centred app column,
 * translucent with a blur, respecting the home-indicator safe area.
 */
export default function TabBar({
  active,
  onSelect
}: {
  active: TabId | null
  onSelect: (id: TabId) => void
}) {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            className={`tab${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(id)}
          >
            <span className="ti">
              <Icon active={isActive} />
            </span>
            <span className="tl">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
