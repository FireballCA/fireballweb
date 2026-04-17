import { Link } from 'react-router-dom'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'

interface UserIdentityProps {
  partnerStatus?: string | null
  onSettingsClick?: () => void
}

const ArrowIcon = () => (
  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M9 7h8v8" />
  </svg>
)

export function UserIdentity({
  partnerStatus = null,
  onSettingsClick,
}: UserIdentityProps) {
  const buttonClass =
    'h-[34px] text-carbon-900 text-[13px] leading-[16px] text-left px-3 rounded-[6px] w-[240px] flex items-center justify-between transition-colors hover:brightness-95'

  return (
    <div>
      <p
        className="text-carbon-600 text-[13px] leading-[16px] uppercase tracking-[0.1em] mb-3"
        style={{ fontWeight: 400 }}
      >
        QUICK LINKS
      </p>
      <div className="flex flex-col gap-2">
        <a
          href={SHOPIFY_CUSTOMER_ORDERS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          style={{ background: 'rgba(229, 231, 235, 0.9)', fontWeight: 400 }}
        >
          <span>Track your order</span>
          <ArrowIcon />
        </a>
        <a
          href={SHOPIFY_CUSTOMER_ORDERS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          style={{ background: 'rgba(229, 231, 235, 0.9)', fontWeight: 400 }}
        >
          <span>Products purchased</span>
          <ArrowIcon />
        </a>
        <Link
          to="/account/company"
          className={buttonClass}
          style={{ background: 'rgba(229, 231, 235, 0.9)', fontWeight: 400 }}
        >
          <span>Become certified</span>
          <ArrowIcon />
        </Link>
        <Link
          to="/account/settings"
          className={buttonClass}
          style={{ background: 'rgba(229, 231, 235, 0.9)', fontWeight: 400 }}
        >
          <span>Settings</span>
          <ArrowIcon />
        </Link>
      </div>
    </div>
  )
}
