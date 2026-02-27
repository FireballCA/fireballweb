import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUserProfile, isAuthenticated, logout } from '@/utils/supabaseAuth'
import { MemberStatusHero } from '@/components/MemberStatusHero/MemberStatusHero'
import { AddVehicleModal } from '@/components/AddVehicleModal'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  ceramicProtectionDate: Date // Date de complétion de la protection
}

type ProtectionStatus = 'green' | 'yellow' | 'red'

export function AccountDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [fullName, setFullName] = useState('')
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [welcomeLineVisible, setWelcomeLineVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [enterButtonVisible, setEnterButtonVisible] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [carModalOpen, setCarModalOpen] = useState(false)
  
  // 3 voitures avec des dates différentes pour tester les 3 statuts
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      brand: 'Audi',
      model: 'Rs4',
      year: 2007,
      ceramicProtectionDate: new Date(), // Vert : vient d'être fait (aujourd'hui)
    },
    {
      id: '2',
      brand: 'BMW',
      model: 'M3',
      year: 2020,
      ceramicProtectionDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Jaune : il y a 60 jours (moins de 3 mois)
    },
    {
      id: '3',
      brand: 'Porsche',
      model: '911',
      year: 2022,
      ceramicProtectionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // Rouge : il y a 25 jours (moins de 1 mois avant expiration)
    },
  ])
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('1')
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0]

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      // Vérifier l'authentification Supabase
      const authenticated = await isAuthenticated()
      
      if (!authenticated) {
        navigate('/account', { replace: true })
        return
      }

      // Charger le profil utilisateur
      const profile = await getCurrentUserProfile()
      
      // Récupérer le state une seule fois
      const state = location.state as { fromRegister?: boolean; welcomeName?: string } | null
      
      // Déterminer le nom complet
      let customerFullName = ''
      if (profile) {
        customerFullName = `${profile.first_name} ${profile.last_name}`.trim() || profile.email
      } else if (state?.welcomeName) {
        customerFullName = state.welcomeName
      } else {
        customerFullName = 'Member'
      }

      setFullName(customerFullName)
      const shouldShowWelcome = state?.fromRegister === true && Boolean(state.welcomeName)
      if (!shouldShowWelcome) {
        setShowDashboard(true)
        return
      }
      setWelcomeName(state?.welcomeName ?? customerFullName)

    const lineTimer = window.setTimeout(() => setWelcomeLineVisible(true), 120)
    const subtitleTimer = window.setTimeout(() => setSubtitleVisible(true), 2600)
    const ctaTimer = window.setTimeout(() => setEnterButtonVisible(true), 3400)
    const safetyTimer = window.setTimeout(() => setShowDashboard(true), 20000)

      return () => {
        window.clearTimeout(lineTimer)
        window.clearTimeout(subtitleTimer)
        window.clearTimeout(ctaTimer)
        window.clearTimeout(safetyTimer)
      }
    }

    checkAuthAndLoadProfile()
  }, [location.state, navigate])

  const showWelcomeScreen = welcomeName !== null && !showDashboard
  const nameParts = (welcomeName ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]) || 'Member'
  const currentXp = 2403
  const targetXp = 3000

  // Calculer le statut de protection en fonction de la date
  const getProtectionStatus = (protectionDate: Date): ProtectionStatus => {
    const now = new Date()
    const diffTime = now.getTime() - protectionDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // Supposons que la protection dure 6 mois (180 jours)
    const protectionDuration = 180
    const daysRemaining = protectionDuration - diffDays
    
    if (daysRemaining > 90) {
      return 'green' // Plus de 3 mois restants
    } else if (daysRemaining > 30) {
      return 'yellow' // Moins de 3 mois mais plus de 1 mois
    } else {
      return 'red' // Moins de 1 mois
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const protectionStatus = getProtectionStatus(selectedVehicle.ceramicProtectionDate)
  
  const statusColors = {
    green: '#10B981', // Vert
    yellow: '#F59E0B', // Jaune
    red: '#EF4444', // Rouge
  }

  const handleLogout = async () => {
    await logout()
    navigate('/account', { replace: true })
  }

  return (
    <section className="relative min-h-screen bg-[#252525] text-pearl">
      {showWelcomeScreen && (
        <div className="fixed inset-0 z-[130] bg-black">
          <div className="h-full w-full flex items-center justify-center px-6">
            <div className="text-center">
              <h1
                className="font-nav font-bold text-5xl md:text-6xl text-white"
                style={{
                  clipPath: welcomeLineVisible ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                  transform: welcomeLineVisible ? 'translateX(0)' : 'translateX(-22px)',
                  opacity: welcomeLineVisible ? 1 : 0.2,
                  transition:
                    'clip-path 2400ms cubic-bezier(0.22, 1, 0.36, 1), transform 2400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1800ms ease',
                }}
              >
                Welcome, {firstName}.
              </h1>
              <p
                className={`mt-7 text-[11px] md:text-xs font-nav font-bold uppercase tracking-[0.14em] text-silver/90 transition-all duration-[1400ms] ease-out ${
                  subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Your journey into fireball network starts here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDashboard(true)
                  setWelcomeName(null)
                }}
                className={`mt-10 inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-nav font-bold text-white transition-all duration-700 hover:bg-white/20 ${
                  enterButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                Access dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showDashboard && (
        <div className="w-full relative">
          <MemberStatusHero 
            userName={fullName || 'Anthony Bergeron'}
            currentXp={currentXp}
            targetXp={targetXp}
          />
          <div 
            className="w-full bg-[#252525] relative z-10 min-h-[300px]"
            style={{
              marginTop: '-40px',
              borderRadius: '45px 45px 0 0',
            }}
          >
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                {/* Left: Title */}
                <h2 className="text-white text-5xl font-normal tracking-tight">My Garage</h2>
                
                {/* Right: Car Info + Logout */}
                <div className="flex flex-col items-end gap-3">
                  {/* Logout button (desktop) */}
                  <button
                    onClick={handleLogout}
                    className="hidden lg:block px-4 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all border border-white/15 mb-2"
                  >
                    Logout
                  </button>
                  {/* Sélecteur de voiture (temporaire pour tester les 3 statuts) */}
                  <div className="flex gap-2 mb-2">
                    {vehicles.map((vehicle) => {
                      const vehicleStatus = getProtectionStatus(vehicle.ceramicProtectionDate)
                      return (
                        <button
                          key={vehicle.id}
                          onClick={() => setSelectedVehicleId(vehicle.id)}
                          className={`px-3 py-1 rounded text-xs transition-all ${
                            selectedVehicleId === vehicle.id
                              ? 'bg-white/20 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/15'
                          }`}
                          title={`${vehicle.brand} ${vehicle.model} - Status: ${vehicleStatus}`}
                        >
                          {vehicle.brand}
                        </button>
                      )
                    })}
                  </div>
                  
                  <p className="text-[#a0a0a0] text-3xl font-normal">
                    {selectedVehicle.brand} <span className="font-bold">{selectedVehicle.model}</span> {selectedVehicle.year}
                  </p>
                  <button 
                    onClick={() => setCarModalOpen(true)}
                    className="text-white text-sm font-normal hover:opacity-70 transition-opacity underline"
                  >
                    Change my car
                  </button>
                  
                  {/* Ceramic Protection Status */}
                  <div className="flex flex-col items-end gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      {/* Indicateur de couleur */}
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: statusColors[protectionStatus] }}
                      />
                      <span className="text-white text-sm font-normal">
                        Ceramic protection : Active
                      </span>
                    </div>
                    <p className="text-[#a0a0a0] text-xs font-normal">
                      Completed the {formatDate(selectedVehicle.ceramicProtectionDate)}
                    </p>
                    <a 
                      href="#"
                      className="text-white text-xs font-normal hover:opacity-70 transition-opacity underline"
                      onClick={(e) => {
                        e.preventDefault()
                        // TODO: Implémenter la logique de prise de rendez-vous
                      }}
                    >
                      Prendre rendez-vous
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddVehicleModal
        isOpen={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        onSelect={(make, model, year) => {
          // Pour l'instant, on met à jour la voiture sélectionnée
          setVehicles(prev => prev.map(v => 
            v.id === selectedVehicleId 
              ? { ...v, brand: make, model, year }
              : v
          ))
        }}
        currentMake={selectedVehicle.brand}
        currentModel={selectedVehicle.model}
        currentYear={selectedVehicle.year}
      />
    </section>
  )
}
