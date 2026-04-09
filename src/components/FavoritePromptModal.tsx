type Props = {
  open: boolean
  onClose: () => void
  onContinue: () => void
  onSignIn: () => void
}

export function FavoritePromptModal({ open, onClose, onContinue, onSignIn }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorite-prompt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-carbon-200 bg-white p-6 shadow-2xl">
        <h2 id="favorite-prompt-title" className="font-display text-xl font-bold text-carbon-900">
          Save to favorites?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-carbon-600">
          Sign in to sync your favorites across devices. You can add this item locally and keep shopping as a guest.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full border border-carbon-200 bg-white px-5 py-2.5 text-sm font-semibold text-carbon-800 transition hover:bg-carbon-50"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-full border border-[#0485F7] bg-[#0485F7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-[#3592F9] hover:bg-[#3592F9]"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
