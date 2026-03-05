import { Link } from 'react-router-dom'

export function PartnerSettings() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-white mb-2">Settings</h1>
      <p className="text-sm text-white/60 mb-6">
        Update your business profile and preferences.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <Link
          to="/partner/onboarding"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          Edit company profile
          <span className="text-white/50">→</span>
        </Link>
      </div>
    </div>
  )
}
