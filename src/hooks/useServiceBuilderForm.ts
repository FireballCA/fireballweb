import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { fetchGarageVehicles, type GarageVehicleRow } from '@/utils/supabaseGarage'
import { XP_PER_DOLLAR } from '@/utils/supabaseXp'
import {
  insertServiceRequest,
  uploadServiceRequestVehiclePhotos,
  type ServiceRequestSource,
} from '@/utils/serviceRequests'
import { CERAMIC_COATING_SECTIONS } from '@/data/ceramicCoatingSections'
import {
  PAINT_CONDITIONS,
  PRODUCT_KITS,
  VEHICLE_SIZES,
  WAX_OPTIONS,
  getKitPrice,
  type PaintCondition,
  type VehicleSize,
} from '@/constants/serviceBuilderCatalog'

export function useServiceBuilderForm() {
  const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null)
  const [selectedPaintCondition, setSelectedPaintCondition] = useState<PaintCondition | null>(null)
  const [selectedCoatingId, setSelectedCoatingId] = useState<string | null>(null)
  const [selectedWaxId, setSelectedWaxId] = useState<string | null>(null)
  const [selectedFinishType, setSelectedFinishType] = useState<'coating' | 'wax'>('coating')
  const [selectedKitIds, setSelectedKitIds] = useState<string[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [garageSheetOpen, setGarageSheetOpen] = useState(false)
  const [addVehicleSheetOpen, setAddVehicleSheetOpen] = useState(false)
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicleRow[]>([])
  const [garageLoading, setGarageLoading] = useState(false)
  const [importedVehicle, setImportedVehicle] = useState<GarageVehicleRow | null>(null)
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false)
  const [successSheetOpen, setSuccessSheetOpen] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [serviceAddress, setServiceAddress] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [uploadedVehicleImages, setUploadedVehicleImages] = useState<File[]>([])
  const [vehicleMakeInput, setVehicleMakeInput] = useState('')
  const [vehicleModelInput, setVehicleModelInput] = useState('')
  const [vehicleYearInput, setVehicleYearInput] = useState('')

  const refreshAuthState = useCallback(async () => {
    const ok = await isAuthenticated()
    setIsLoggedIn(ok)
  }, [])

  useEffect(() => {
    let cancelled = false
    isAuthenticated()
      .then((ok) => {
        if (!cancelled) setIsLoggedIn(ok)
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onFocus = () => {
      void refreshAuthState()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshAuthState()
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshAuthState])

  const loadGarage = useCallback(async () => {
    setGarageLoading(true)
    try {
      const rows = await fetchGarageVehicles()
      setGarageVehicles(rows)
    } finally {
      setGarageLoading(false)
    }
  }, [])

  useEffect(() => {
    if (garageSheetOpen) void loadGarage()
  }, [garageSheetOpen, loadGarage])

  const totalPrice = useMemo(() => {
    const vehicleBasePrice = VEHICLE_SIZES.find((size) => size.id === selectedVehicleSize)?.price ?? 0
    const paintAdjustment =
      PAINT_CONDITIONS.find((condition) => condition.id === selectedPaintCondition)?.adjustment ?? 0
    const kitsTotal = PRODUCT_KITS
      .filter((k) => selectedKitIds.includes(k.id))
      .reduce((sum, k) => sum + getKitPrice(k), 0)
    return vehicleBasePrice + paintAdjustment + kitsTotal
  }, [selectedVehicleSize, selectedPaintCondition, selectedKitIds])

  const estimatedXp = useMemo(() => Math.max(0, Math.round(totalPrice * XP_PER_DOLLAR)), [totalPrice])

  const canProceed =
    selectedVehicleSize !== null &&
    selectedPaintCondition !== null &&
    (selectedCoatingId !== null || selectedWaxId !== null)

  const isReviewFormValid = useMemo(() => {
    return (
      vehicleMakeInput.trim().length > 0 &&
      vehicleModelInput.trim().length > 0 &&
      vehicleYearInput.trim().length > 0 &&
      contactPhone.trim().length > 0 &&
      contactFirstName.trim().length > 0 &&
      contactLastName.trim().length > 0 &&
      contactEmail.trim().length > 0 &&
      serviceAddress.trim().length > 0
    )
  }, [
    vehicleMakeInput,
    vehicleModelInput,
    vehicleYearInput,
    contactPhone,
    contactFirstName,
    contactLastName,
    contactEmail,
    serviceAddress,
  ])

  const coatingName = useMemo(
    () => CERAMIC_COATING_SECTIONS.find((c) => c.id === selectedCoatingId)?.name ?? '',
    [selectedCoatingId],
  )
  const waxName = useMemo(
    () => (selectedWaxId ? WAX_OPTIONS.find((w) => w.id === selectedWaxId)?.name ?? '' : ''),
    [selectedWaxId],
  )

  useEffect(() => {
    if (!importedVehicle) return
    setVehicleMakeInput(importedVehicle.brand ?? '')
    setVehicleModelInput(importedVehicle.model ?? '')
    setVehicleYearInput(importedVehicle.year ? String(importedVehicle.year) : '')
  }, [importedVehicle])

  const generateRequestNumber = useCallback(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const rnd = Math.floor(100000 + Math.random() * 900000)
    return `FB-SRV-${yyyy}-${rnd}`
  }, [])

  const handleVehicleImagesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setUploadedVehicleImages(files.slice(0, 6))
  }, [])

  const resetForm = useCallback(() => {
    setSelectedVehicleSize(null)
    setSelectedPaintCondition(null)
    setSelectedCoatingId(null)
    setSelectedWaxId(null)
    setSelectedFinishType('coating')
    setSelectedKitIds([])
    setGarageSheetOpen(false)
    setAddVehicleSheetOpen(false)
    setImportedVehicle(null)
    setReviewSheetOpen(false)
    setSuccessSheetOpen(false)
    setRequestNumber('')
    setIsSending(false)
    setContactFirstName('')
    setContactLastName('')
    setContactEmail('')
    setContactPhone('')
    setServiceAddress('')
    setCustomMessage('')
    setUploadedVehicleImages([])
    setVehicleMakeInput('')
    setVehicleModelInput('')
    setVehicleYearInput('')
  }, [])

  const submitServiceRequest = useCallback(
    async (opts: {
      source: ServiceRequestSource
      stockistId?: string | null
      stockistSnapshot?: string | null
    }): Promise<{ ok: true; reference: string } | { ok: false; error: string }> => {
      if (!isReviewFormValid || !selectedVehicleSize || !selectedPaintCondition || !selectedCoatingId) {
        return { ok: false, error: 'Form incomplete' }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? null
      const reference = generateRequestNumber()
      let photoManifest: string | null = null
      if (uploadedVehicleImages.length > 0) {
        const uploaded = await uploadServiceRequestVehiclePhotos(reference, uploadedVehicleImages)
        if (!uploaded.ok) return { ok: false, error: uploaded.error }
        photoManifest = uploaded.paths.join(', ')
      }
      const saved = await insertServiceRequest({
        source: opts.source,
        stockistId: opts.stockistId ?? null,
        stockistSnapshot: opts.stockistSnapshot ?? null,
        reference,
        userId,
        vehicleSize: selectedVehicleSize,
        paintCondition: selectedPaintCondition,
        coatingId: selectedCoatingId,
        coatingName,
        waxId: selectedWaxId,
        waxName: waxName || null,
        estimateCad: totalPrice,
        vehicleMake: vehicleMakeInput.trim(),
        vehicleModel: vehicleModelInput.trim(),
        vehicleYear: vehicleYearInput.trim(),
        contactFirstName: contactFirstName.trim(),
        contactLastName: contactLastName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        serviceAddress: serviceAddress.trim(),
        customMessage: customMessage.trim() || null,
        photoManifest,
      })
      if (!saved.ok) return { ok: false, error: saved.error }
      return { ok: true, reference }
    },
    [
      isReviewFormValid,
      selectedVehicleSize,
      selectedPaintCondition,
      selectedCoatingId,
      selectedWaxId,
      generateRequestNumber,
      coatingName,
      waxName,
      totalPrice,
      vehicleMakeInput,
      vehicleModelInput,
      vehicleYearInput,
      contactFirstName,
      contactLastName,
      contactEmail,
      contactPhone,
      serviceAddress,
      customMessage,
      uploadedVehicleImages,
    ],
  )

  return {
    selectedVehicleSize,
    setSelectedVehicleSize,
    selectedPaintCondition,
    setSelectedPaintCondition,
    selectedCoatingId,
    setSelectedCoatingId,
    selectedWaxId,
    setSelectedWaxId,
    selectedFinishType,
    setSelectedFinishType,
    selectedKitIds,
    setSelectedKitIds,
    isLoggedIn,
    isAuthLoading,
    garageSheetOpen,
    setGarageSheetOpen,
    addVehicleSheetOpen,
    setAddVehicleSheetOpen,
    garageVehicles,
    garageLoading,
    importedVehicle,
    setImportedVehicle,
    reviewSheetOpen,
    setReviewSheetOpen,
    successSheetOpen,
    setSuccessSheetOpen,
    requestNumber,
    setRequestNumber,
    isSending,
    setIsSending,
    contactFirstName,
    setContactFirstName,
    contactLastName,
    setContactLastName,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
    serviceAddress,
    setServiceAddress,
    customMessage,
    setCustomMessage,
    uploadedVehicleImages,
    vehicleMakeInput,
    setVehicleMakeInput,
    vehicleModelInput,
    setVehicleModelInput,
    vehicleYearInput,
    setVehicleYearInput,
    loadGarage,
    totalPrice,
    estimatedXp,
    canProceed,
    isReviewFormValid,
    coatingName,
    waxName,
    generateRequestNumber,
    handleVehicleImagesChange,
    submitServiceRequest,
    resetForm,
  }
}

export type ServiceBuilderFormApi = ReturnType<typeof useServiceBuilderForm>
