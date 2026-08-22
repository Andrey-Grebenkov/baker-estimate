import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Order, OrderStatus } from '../domain/types'
import { ORDER_STATUSES, statusStyles } from '../lib/orderStatus'

interface OrderStatusDropdownProps {
  order: Order
  onSelect: (status: OrderStatus) => void
  disabled?: boolean
}

export function OrderStatusDropdown({ order, onSelect, disabled }: OrderStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function updatePosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setMenuStyle({ top: rect.bottom + 4, left: rect.left })
      }
    }

    function closeOnScroll() {
      setIsOpen(false)
    }

    if (isOpen) {
      updatePosition()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', closeOnScroll)
      window.addEventListener('scroll', closeOnScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', closeOnScroll)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [isOpen])

  const handleSelect = (status: OrderStatus) => {
    setIsOpen(false)
    if (status !== order.status) {
      onSelect(status)
    }
  }

  return (
    <div className="relative" ref={containerRef} data-testid="order-status-dropdown">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className={[
          'inline-flex w-full items-center justify-between gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors sm:w-auto',
          statusStyles[order.status],
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90',
        ].join(' ')}
        data-testid="order-status-trigger"
      >
        <span>{order.status}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="fixed z-50 mt-1 min-w-[8rem] rounded-lg bg-white p-1 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          style={{ top: menuStyle.top, left: menuStyle.left }}
          data-testid="order-status-menu"
        >
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleSelect(status)}
              className={[
                'flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs font-medium ring-1 transition-colors',
                statusStyles[status],
                status === order.status ? 'ring-offset-1 ring-offset-slate-100 dark:ring-offset-slate-900' : '',
              ].join(' ')}
              data-testid={`order-status-option-${status}`}
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
