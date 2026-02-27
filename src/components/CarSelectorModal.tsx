import { useState, useEffect, useCallback } from 'react'
import { LiquidGlassSelect } from './LiquidGlassSelect'

interface CarBrand {
  name: string
  models: {
    name: string
    years: number[]
  }[]
}

interface CarSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (brand: string, model: string, year: number) => void
  currentBrand?: string
  currentModel?: string
  currentYear?: number
}

export function CarSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentBrand = 'Audi',
  currentModel = 'Rs4',
  currentYear = 2007,
}: CarSelectorModalProps) {
  const [selectedBrand, setSelectedBrand] = useState(currentBrand)
  const [selectedModel, setSelectedModel] = useState(currentModel)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [loading, setLoading] = useState(false)

  // Charger les données fallback immédiatement
  const loadFallbackData = useCallback(() => {
    const fallback: CarBrand[] = [
      {
        name: 'Audi',
        models: [
          { name: 'A3', years: Array.from({ length: 29 }, (_, i) => 1996 + i) },
          { name: 'A4', years: Array.from({ length: 31 }, (_, i) => 1994 + i) },
          { name: 'Rs4', years: Array.from({ length: 25 }, (_, i) => 2000 + i) },
          { name: 'A5', years: Array.from({ length: 18 }, (_, i) => 2007 + i) },
          { name: 'A6', years: Array.from({ length: 31 }, (_, i) => 1994 + i) },
          { name: 'A7', years: Array.from({ length: 15 }, (_, i) => 2010 + i) },
          { name: 'A8', years: Array.from({ length: 31 }, (_, i) => 1994 + i) },
          { name: 'Q5', years: Array.from({ length: 17 }, (_, i) => 2008 + i) },
          { name: 'Q7', years: Array.from({ length: 20 }, (_, i) => 2005 + i) },
          { name: 'TT', years: Array.from({ length: 27 }, (_, i) => 1998 + i) },
        ],
      },
      {
        name: 'BMW',
        models: [
          { name: 'Série 1', years: Array.from({ length: 21 }, (_, i) => 2004 + i) },
          { name: 'Série 3', years: Array.from({ length: 50 }, (_, i) => 1975 + i) },
          { name: 'Série 5', years: Array.from({ length: 53 }, (_, i) => 1972 + i) },
          { name: 'Série 7', years: Array.from({ length: 48 }, (_, i) => 1977 + i) },
          { name: 'X3', years: Array.from({ length: 22 }, (_, i) => 2003 + i) },
          { name: 'X5', years: Array.from({ length: 26 }, (_, i) => 1999 + i) },
          { name: 'M3', years: Array.from({ length: 39 }, (_, i) => 1986 + i) },
          { name: 'M5', years: Array.from({ length: 41 }, (_, i) => 1984 + i) },
        ],
      },
      {
        name: 'Mercedes-Benz',
        models: [
          { name: 'Classe A', years: Array.from({ length: 28 }, (_, i) => 1997 + i) },
          { name: 'Classe C', years: Array.from({ length: 32 }, (_, i) => 1993 + i) },
          { name: 'Classe E', years: Array.from({ length: 32 }, (_, i) => 1993 + i) },
          { name: 'Classe S', years: Array.from({ length: 53 }, (_, i) => 1972 + i) },
          { name: 'GLC', years: Array.from({ length: 10 }, (_, i) => 2015 + i) },
          { name: 'GLE', years: Array.from({ length: 10 }, (_, i) => 2015 + i) },
          { name: 'GLS', years: Array.from({ length: 19 }, (_, i) => 2006 + i) },
          { name: 'AMG GT', years: Array.from({ length: 11 }, (_, i) => 2014 + i) },
        ],
      },
      {
        name: 'Porsche',
        models: [
          { name: '911', years: Array.from({ length: 62 }, (_, i) => 1963 + i) },
          { name: 'Cayenne', years: Array.from({ length: 23 }, (_, i) => 2002 + i) },
          { name: 'Panamera', years: Array.from({ length: 16 }, (_, i) => 2009 + i) },
          { name: 'Macan', years: Array.from({ length: 11 }, (_, i) => 2014 + i) },
          { name: 'Boxster', years: Array.from({ length: 29 }, (_, i) => 1996 + i) },
          { name: 'Cayman', years: Array.from({ length: 20 }, (_, i) => 2005 + i) },
        ],
      },
      {
        name: 'Ferrari',
        models: [
          { name: '488', years: [2015, 2016, 2017, 2018, 2019] },
          { name: 'F8 Tributo', years: Array.from({ length: 5 }, (_, i) => 2019 + i) },
          { name: 'SF90', years: Array.from({ length: 6 }, (_, i) => 2019 + i) },
          { name: 'Roma', years: Array.from({ length: 6 }, (_, i) => 2019 + i) },
          { name: 'Portofino', years: Array.from({ length: 8 }, (_, i) => 2017 + i) },
          { name: '812 Superfast', years: Array.from({ length: 8 }, (_, i) => 2017 + i) },
        ],
      },
      {
        name: 'Lamborghini',
        models: [
          { name: 'Huracán', years: Array.from({ length: 11 }, (_, i) => 2014 + i) },
          { name: 'Aventador', years: Array.from({ length: 12 }, (_, i) => 2011 + i) },
          { name: 'Urus', years: Array.from({ length: 7 }, (_, i) => 2018 + i) },
          { name: 'Gallardo', years: Array.from({ length: 11 }, (_, i) => 2003 + i) },
        ],
      },
      {
        name: 'Tesla',
        models: [
          { name: 'Model S', years: Array.from({ length: 13 }, (_, i) => 2012 + i) },
          { name: 'Model 3', years: Array.from({ length: 8 }, (_, i) => 2017 + i) },
          { name: 'Model X', years: Array.from({ length: 10 }, (_, i) => 2015 + i) },
          { name: 'Model Y', years: Array.from({ length: 5 }, (_, i) => 2020 + i) },
        ],
      },
      {
        name: 'Toyota',
        models: [
          { name: 'Camry', years: Array.from({ length: 43 }, (_, i) => 1982 + i) },
          { name: 'Corolla', years: Array.from({ length: 59 }, (_, i) => 1966 + i) },
          { name: 'RAV4', years: Array.from({ length: 31 }, (_, i) => 1994 + i) },
          { name: 'Prius', years: Array.from({ length: 28 }, (_, i) => 1997 + i) },
          { name: 'Land Cruiser', years: Array.from({ length: 74 }, (_, i) => 1951 + i) },
        ],
      },
      {
        name: 'Honda',
        models: [
          { name: 'Civic', years: Array.from({ length: 53 }, (_, i) => 1972 + i) },
          { name: 'Accord', years: Array.from({ length: 49 }, (_, i) => 1976 + i) },
          { name: 'CR-V', years: Array.from({ length: 30 }, (_, i) => 1995 + i) },
        ],
      },
      {
        name: 'Ford',
        models: [
          { name: 'Mustang', years: Array.from({ length: 61 }, (_, i) => 1964 + i) },
          { name: 'F-150', years: Array.from({ length: 77 }, (_, i) => 1948 + i) },
          { name: 'Focus', years: Array.from({ length: 21 }, (_, i) => 1998 + i) },
        ],
      },
    ]
    setBrands(fallback)
  }, [])

  // Bloquer le scroll quand le modal est ouvert
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

  // Charger les données au montage du composant ou à l'ouverture
  useEffect(() => {
    if (isOpen && brands.length === 0) {
      // Charger immédiatement les données fallback pour une expérience fluide
      loadFallbackData()
      // Essayer de charger depuis l'API en arrière-plan
      loadCarDataFromAPI()
    }
  }, [isOpen, brands.length, loadFallbackData, loadCarDataFromAPI])

  // Charger depuis l'API en arrière-plan (sans bloquer l'UI)
  const loadCarDataFromAPI = useCallback(async () => {
    try {
      // Étape 1: Charger toutes les marques avec format JSON
      const makesResponse = await fetch('https://www.carqueryapi.com/api/0.3/?cmd=getMakes&format=json')
      if (!makesResponse.ok) {
        throw new Error('API request failed')
      }
      
      const makesData = await makesResponse.json()
      
      if (!makesData?.Makes || makesData.Makes.length === 0) {
        throw new Error('No makes found')
      }

      const allMakes = makesData.Makes.map((make: any) => make.make_display || make.make_name).filter(Boolean)
      
      if (allMakes.length === 0) {
        throw new Error('No valid makes')
      }

      // Étape 2: Charger les modèles pour les marques principales d'abord (top 50)
      const brandsData: CarBrand[] = []
      const topMakes = allMakes.slice(0, 50) // Limiter pour éviter les timeouts
      const batchSize = 5 // Réduire la taille du batch
      
      for (let i = 0; i < topMakes.length; i += batchSize) {
        const batch = topMakes.slice(i, i + batchSize)
        const batchPromises = batch.map(async (make: string) => {
          try {
            const modelsResponse = await fetch(
              `https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${encodeURIComponent(make)}&format=json`
            )
            
            if (!modelsResponse.ok) {
              return null
            }
            
            const modelsData = await modelsResponse.json()

            if (modelsData?.Models && modelsData.Models.length > 0) {
              const models = modelsData.Models.map((model: any) => {
                const startYear = model.model_year_start || 1900
                const endYear = model.model_year_end || new Date().getFullYear()
                const years: number[] = []
                
                // Limiter les années pour éviter des tableaux trop grands
                const minYear = Math.max(startYear, 1950)
                const maxYear = Math.min(endYear, new Date().getFullYear())
                
                for (let year = minYear; year <= maxYear; year++) {
                  years.push(year)
                }
                
                return {
                  name: model.model_name || model.model_display || '',
                  years: years.length > 0 ? years : [minYear],
                }
              }).filter((m: any) => m.name && m.years.length > 0)
              
              if (models.length > 0) {
                return {
                  name: make,
                  models,
                }
              }
            }
            return null
          } catch (error) {
            // Ignorer les erreurs silencieusement pour ne pas polluer la console
            return null
          }
        })

        const batchResults = await Promise.all(batchPromises)
        const validBrands = batchResults.filter((brand): brand is CarBrand => brand !== null)
        brandsData.push(...validBrands)
      }

      if (brandsData.length > 0) {
        // Trier les marques par ordre alphabétique
        brandsData.sort((a, b) => a.name.localeCompare(b.name))
        // Merger avec les données existantes (fallback)
        setBrands((prevBrands) => {
          const merged = [...prevBrands]
          brandsData.forEach((newBrand) => {
            const existingIndex = merged.findIndex((b) => b.name === newBrand.name)
            if (existingIndex >= 0) {
              merged[existingIndex] = newBrand // Remplacer par les données de l'API
            } else {
              merged.push(newBrand) // Ajouter si nouvelle
            }
          })
          return merged.sort((a, b) => a.name.localeCompare(b.name))
        })
      }
    } catch (error) {
      // Ne pas afficher d'erreur, on utilise déjà les données fallback
      // Ne pas afficher d'erreur, on utilise déjà les données fallback
      // L'erreur est silencieuse pour ne pas perturber l'utilisateur
    }
  }, [])

  if (!isOpen) return null

  const selectedBrandData = brands.find((b) => b.name === selectedBrand)
  const selectedModelData = selectedBrandData?.models.find((m) => m.name === selectedModel)

  const handleConfirm = () => {
    onSelect(selectedBrand, selectedModel, selectedYear)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop avec blur */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />
      
      {/* Modal - Style Liquid Glass Apple moderne */}
      <div
        className="relative rounded-3xl shadow-2xl max-w-2xl w-full p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(80px) saturate(200%)',
          WebkitBackdropFilter: 'blur(80px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-2xl font-normal mb-6" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>Select Your Car</h3>
        
        {loading ? (
          <div className="text-white/70 text-center py-8">Loading car data...</div>
        ) : (
          <div className="space-y-6">
            {/* Brand Selector */}
            <LiquidGlassSelect
              label="Brand"
              value={selectedBrand}
              options={brands.map((brand) => ({ value: brand.name, label: brand.name }))}
              onChange={(value) => {
                setSelectedBrand(value)
                const brand = brands.find((b) => b.name === value)
                if (brand && brand.models.length > 0) {
                  setSelectedModel(brand.models[0].name)
                  setSelectedYear(brand.models[0].years[0])
                }
              }}
            />

            {/* Model Selector */}
            {selectedBrandData && (
              <LiquidGlassSelect
                label="Model"
                value={selectedModel}
                options={selectedBrandData.models.map((model) => ({ 
                  value: model.name, 
                  label: model.name,
                  bold: true 
                }))}
                onChange={(value) => {
                  setSelectedModel(value)
                  const model = selectedBrandData.models.find((m) => m.name === value)
                  if (model && model.years.length > 0) {
                    setSelectedYear(model.years[0])
                  }
                }}
              />
            )}

            {/* Year Selector */}
            {selectedModelData && (
              <LiquidGlassSelect
                label="Year"
                value={selectedYear.toString()}
                options={selectedModelData.years.map((year) => ({ 
                  value: year.toString(), 
                  label: year.toString() 
                }))}
                onChange={(value) => setSelectedYear(Number(value))}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl text-white transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
