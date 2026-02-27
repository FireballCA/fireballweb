import { useState, useEffect, useCallback } from 'react'
import { LiquidGlassSelect } from './LiquidGlassSelect'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (make: string, model: string, year: number) => void
  currentMake?: string
  currentModel?: string
  currentYear?: number
}

interface Make {
  Make_ID: number
  Make_Name: string
}

interface Model {
  Make_ID: number
  Make_Name: string
  Model_ID: number
  Model_Name: string
}

export function AddVehicleModal({
  isOpen,
  onClose,
  onSelect,
  currentMake = '',
  currentModel = '',
  currentYear = new Date().getFullYear(),
}: AddVehicleModalProps) {
  const [selectedMake, setSelectedMake] = useState(currentMake)
  const [selectedModel, setSelectedModel] = useState(currentModel)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  
  const [makes, setMakes] = useState<Make[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  // Générer les années de 1990 à l'année actuelle
  const generateYears = useCallback(() => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year)
    }
    return years
  }, [])

  const years = generateYears()

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

  // Charger les marques depuis l'API NHTSA quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && makes.length === 0) {
      loadMakes()
    }
  }, [isOpen, makes.length])

  // Charger les modèles quand une marque est sélectionnée
  useEffect(() => {
    if (selectedMake) {
      loadModels(selectedMake)
      // Réinitialiser le modèle et l'année quand on change de marque
      if (selectedMake !== currentMake) {
        setSelectedModel('')
        setSelectedYear(new Date().getFullYear())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMake])

  const loadMakes = useCallback(async () => {
    setLoadingMakes(true)
    try {
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json')
      if (!response.ok) {
        throw new Error('Failed to load makes')
      }
      
      const data = await response.json()
      if (data.Results && data.Results.length > 0) {
        // Trier les marques par ordre alphabétique
        const sortedMakes = data.Results.sort((a: Make, b: Make) => 
          a.Make_Name.localeCompare(b.Make_Name)
        )
        setMakes(sortedMakes)
      }
    } catch (error) {
      console.error('Error loading makes:', error)
    } finally {
      setLoadingMakes(false)
    }
  }, [])

  const loadModels = useCallback(async (make: string) => {
    setLoadingModels(true)
    setModels([]) // Réinitialiser les modèles
    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`
      )
      if (!response.ok) {
        throw new Error('Failed to load models')
      }
      
      const data = await response.json()
      if (data.Results && data.Results.length > 0) {
        // Trier les modèles par ordre alphabétique
        const sortedModels = data.Results.sort((a: Model, b: Model) => 
          a.Model_Name.localeCompare(b.Model_Name)
        )
        setModels(sortedModels)
      }
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoadingModels(false)
    }
  }, [])

  const handleConfirm = () => {
    if (selectedMake && selectedModel && selectedYear) {
      onSelect(selectedMake, selectedModel, selectedYear)
      onClose()
    }
  }

  if (!isOpen) return null

  const makeOptions = makes.map((make) => ({
    value: make.Make_Name,
    label: make.Make_Name,
  }))

  const modelOptions = models.map((model) => ({
    value: model.Model_Name,
    label: model.Model_Name,
    bold: true,
  }))

  const yearOptions = years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }))

  const isModelDisabled = !selectedMake || loadingModels
  const isYearDisabled = !selectedModel

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
        {/* Close button top right */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h3 className="text-white text-2xl font-normal mb-6 pr-8" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
          Select Your Car
        </h3>
        
        <div className="space-y-6">
          {/* Make Selector */}
          <LiquidGlassSelect
            label="Vehicle Make"
            value={selectedMake}
            options={makeOptions}
            onChange={(value) => {
              setSelectedMake(value)
            }}
            placeholder={loadingMakes ? 'Loading makes...' : 'Select a make'}
          />

          {/* Model Selector - Disabled until Make is selected */}
          <div className={isModelDisabled ? 'opacity-50 pointer-events-none' : ''}>
            <LiquidGlassSelect
              label="Vehicle Model"
              value={selectedModel}
              options={modelOptions}
              onChange={(value) => {
                setSelectedModel(value)
                // Réinitialiser l'année quand on change de modèle
                setSelectedYear(new Date().getFullYear())
              }}
              placeholder={loadingModels ? 'Loading models...' : selectedMake ? 'Select a model' : 'Select a make first'}
            />
          </div>

          {/* Year Selector - Disabled until Model is selected */}
          <div className={isYearDisabled ? 'opacity-50 pointer-events-none' : ''}>
            <LiquidGlassSelect
              label="Production Year"
              value={selectedYear.toString()}
              options={yearOptions}
              onChange={(value) => setSelectedYear(Number(value))}
              placeholder={selectedModel ? 'Select a year' : 'Select a model first'}
            />
          </div>
        </div>

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
            disabled={!selectedMake || !selectedModel || !selectedYear}
            className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
