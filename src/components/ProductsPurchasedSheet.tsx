import { useEffect } from 'react'

interface ProductsPurchasedSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function ProductsPurchasedSheet({ isOpen, onClose }: ProductsPurchasedSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div
        className="relative w-full h-[92vh] md:h-[88vh] overflow-hidden pointer-events-auto flex flex-col rounded-t-[28px] shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#0a0a0a',
          animation: 'productsPurchasedSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header type Apple */}
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45">
              Account
            </p>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white">
              Products purchased
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/65 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Contenu type page Apple */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-5 pb-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Colonne gauche : résumé */}
            <div className="w-full lg:w-[32%] flex flex-col gap-4">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[13px] font-medium text-white/80 mb-2">
                  Historique d’achats
                </p>
                <p className="text-[28px] font-semibold tracking-[-0.03em] text-white">
                  0&nbsp;orders
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-white/60">
                  Une fois que vous aurez passé une commande avec votre compte Fireball,
                  elle apparaîtra ici avec les produits, le total et les points gagnés.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45 mb-2">
                  Points
                </p>
                <p className="text-[22px] font-semibold tracking-[-0.03em] text-white">
                  0 points
                </p>
                <p className="mt-1 text-[12px] text-white/60">
                  Chaque achat admissible vous fait progresser dans votre niveau de membre.
                </p>
              </div>
            </div>

            {/* Colonne droite : liste des commandes */}
              <div className="w-full lg:flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-[13px] font-medium text-white/80">
                  Vos commandes
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.02] px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/65">
                    All time
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-white/[0.18] bg-white/[0.03] px-6 py-7 flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.04] text-white/70 mb-3.5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 11h18M7 11V7a5 5 0 0 1 10 0v4m-9 7h8"
                    />
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-white mb-1">
                  Aucune commande pour l’instant
                </p>
                <p className="text-[13px] text-white/65 max-w-md">
                  Quand vous validerez un achat sur la boutique avec ce compte, nous
                  afficherons ici le détail de la commande, les produits et les points
                  associés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes productsPurchasedSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0.98;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
