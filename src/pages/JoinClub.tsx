import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Description, Input, Label, Radio, RadioGroup, TextField } from '@heroui/react'
import { AppleButton } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
import { JOIN_CLUB_CARD_IMAGES, JOIN_CLUB_WIZARD_PLACEHOLDER } from '@/constants/joinClubAssets'

type ClubTier = 'ignition' | 'apex'

/** Ignition + état « aucune carte » (même grille que Ignition). */
const COMMITMENT_VALUES_IGNITION = ['1', '3', '6', '12'] as const
/** Apex uniquement. */
const COMMITMENT_VALUES_APEX = ['3', '6', '12'] as const

type IgnitionMonth = (typeof COMMITMENT_VALUES_IGNITION)[number]
type ApexMonth = (typeof COMMITMENT_VALUES_APEX)[number]

const MONTH_I18N: Record<IgnitionMonth, string> = {
  '1': 'joinClub.month1',
  '3': 'joinClub.month3',
  '6': 'joinClub.month6',
  '12': 'joinClub.month12',
}

const MONTH_DESC_IGNITION: Record<IgnitionMonth, string> = {
  '1': 'joinClub.month1Desc',
  '3': 'joinClub.month3Desc',
  '6': 'joinClub.month6Desc',
  '12': 'joinClub.month12Desc',
}

const MONTH_PRICE_IGNITION: Record<IgnitionMonth, string> = {
  '1': 'joinClub.commitmentPrice1',
  '3': 'joinClub.commitmentPrice3',
  '6': 'joinClub.commitmentPrice6',
  '12': 'joinClub.commitmentPrice12',
}

const MONTH_LABEL_APEX: Record<ApexMonth, string> = {
  '3': 'joinClub.apexMonth3Label',
  '6': 'joinClub.apexMonth6Label',
  '12': 'joinClub.apexMonth12Label',
}

const MONTH_DESC_APEX: Record<ApexMonth, string> = {
  '3': 'joinClub.apexMonth3Desc',
  '6': 'joinClub.apexMonth6Desc',
  '12': 'joinClub.apexMonth12Desc',
}

const MONTH_PRICE_APEX: Record<ApexMonth, string> = {
  '3': 'joinClub.apexCommitmentLine3',
  '6': 'joinClub.apexCommitmentLine6',
  '12': 'joinClub.apexCommitmentLine12',
}

export function JoinClub() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  /** `null` = étape 1 : pas encore de carte choisie (image d’accueil, pas les visuels membership). */
  const [selectedTier, setSelectedTier] = useState<ClubTier | null>(null)
  const [memberName, setMemberName] = useState('')
  const [commitment, setCommitment] = useState<string>('12')
  const [showCardBack, setShowCardBack] = useState(false)
  const [imgFallbackFront, setImgFallbackFront] = useState(false)

  const personalizeRef = useRef<HTMLElement | null>(null)
  const heroSentinelRef = useRef<HTMLDivElement | null>(null)
  const [compactNavVisible, setCompactNavVisible] = useState(false)
  const reduceMotion = useReducedMotion()

  const tierChosen = selectedTier !== null
  const nameFilled = memberName.trim().length > 0
  const canEditName = tierChosen
  const canEditCommitment = tierChosen && nameFilled

  const commitmentKeys =
    selectedTier === 'apex' ? COMMITMENT_VALUES_APEX : COMMITMENT_VALUES_IGNITION

  useEffect(() => {
    setImgFallbackFront(false)
  }, [selectedTier, showCardBack])

  /** Passage à Apex : 1 et 9 mois n’existent plus → repasser sur une durée valide. */
  useEffect(() => {
    if (selectedTier !== 'apex') return
    setCommitment((c) => (c === '1' ? '12' : c))
  }, [selectedTier])

  useEffect(() => {
    const el = heroSentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      ([entry]) => {
        setCompactNavVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = personalizeRef.current
    if (!el || typeof IntersectionObserver === 'undefined' || !tierChosen) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        setShowCardBack(entry.isIntersecting && entry.intersectionRatio >= 0.15)
      },
      { threshold: [0, 0.15, 0.35, 0.5, 1] },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [tierChosen])

  const imgs = selectedTier ? JOIN_CLUB_CARD_IMAGES[selectedTier] : null
  const showFlip = tierChosen && showCardBack
  const imageSrc = !tierChosen
    ? JOIN_CLUB_WIZARD_PLACEHOLDER
    : imgs
      ? imgFallbackFront || !showFlip
        ? imgs.front
        : imgs.back
      : JOIN_CLUB_WIZARD_PLACEHOLDER

  const onImgError = useCallback(() => {
    if (!showFlip || !tierChosen) return
    setImgFallbackFront(true)
  }, [showFlip, tierChosen])

  const gradientWord = (key: string) => (
    <span className="bg-gradient-to-l from-[#d4d4d4] via-[#7a7a7a] to-[#1a1a1a] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">
      {t(key)}
    </span>
  )

  const cardImage = (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-neutral-200">
      <img
        src={imageSrc}
        alt={tierChosen ? t('joinClub.cardImageAlt') : t('joinClub.wizardPlaceholderAlt')}
        className="h-full w-full object-cover"
        onError={onImgError}
        draggable={false}
      />
    </div>
  )

  const compactNavTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div className="min-h-screen bg-white text-carbon-900">
      <AnimatePresence>
        {compactNavVisible && (
          <motion.header
            key="join-club-compact-nav"
            role="banner"
            aria-label={t('joinClub.compactNavAria')}
            initial={reduceMotion ? false : { y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -56, opacity: 0 }}
            transition={compactNavTransition}
            className="fixed inset-x-0 top-0 z-[125] border-b border-neutral-200/90 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/85"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
              <h2 className="min-w-0 flex-1 truncate pr-2 font-nav text-sm font-bold tracking-tight text-carbon-900 md:text-base">
                {t('joinClub.pageTitle')}
              </h2>
              <div className="shrink-0">
                <AppleButton
                  type="button"
                  className="whitespace-nowrap px-3 py-1.5 text-[10px] font-nav md:text-xs"
                  onClick={() => navigate('/contact')}
                >
                  {t('joinClub.needHelp')}
                </AppleButton>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-6 md:pt-8 lg:pt-10">
        <div
          ref={heroSentinelRef}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-10 xl:gap-12"
        >
          <h1 className="min-w-0 shrink-0 font-nav text-4xl font-bold tracking-tight text-carbon-900 md:text-5xl lg:w-[60%] lg:max-w-[720px] lg:text-6xl">
            {t('joinClub.pageTitle')}
          </h1>
          <div className="flex min-w-0 flex-1 justify-end lg:justify-end">
            <div className="flex w-full justify-end lg:max-w-[min(100%,420px)] xl:max-w-[440px]">
              <AppleButton
                type="button"
                className="shrink-0 whitespace-nowrap font-nav"
                onClick={() => navigate('/contact')}
              >
                {t('joinClub.needHelp')}
              </AppleButton>
            </div>
          </div>
        </div>

        {/* @container : ~19cqw ≈ un peu au-dessus du milieu vertical de l’image 4/3 (colonne ~60 %). */}
        <div className="@container mt-16 flex flex-col gap-12 lg:mt-20 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <aside className="w-full shrink-0 lg:sticky lg:top-40 lg:w-[60%] lg:max-w-[720px]">
            {cardImage}
          </aside>

          <div className="min-w-0 flex-1 space-y-16 pb-8 lg:ml-auto lg:max-w-[min(100%,420px)] lg:space-y-20 lg:pt-[19cqw] xl:max-w-[440px]">
            <section aria-labelledby="join-status-heading">
              <h2
                id="join-status-heading"
                className="w-full text-left font-nav text-lg font-bold tracking-tight text-carbon-900 md:text-xl"
              >
                {t('joinClub.chooseLead')}
                {gradientWord('joinClub.chooseHighlight')}
              </h2>

              <div
                className="mt-6 flex w-full flex-col gap-3"
                role="radiogroup"
                aria-label={t('joinClub.statusChoiceGroupAria')}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTier === 'ignition'}
                  onClick={() => setSelectedTier('ignition')}
                  className={cn(
                    'rounded-2xl border border-black px-4 py-3.5 text-left transition-colors',
                    selectedTier === 'ignition'
                      ? 'bg-neutral-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]'
                      : 'bg-white hover:bg-neutral-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-nav text-[17px] font-semibold leading-tight text-carbon-900 md:text-lg">
                      {t('joinClub.tierIgnition')}
                    </span>
                    <span className="max-w-[48%] shrink-0 text-right text-[10px] font-medium leading-tight text-neutral-500 sm:text-[11px]">
                      {t('joinClub.fromPriceIgnition')}
                    </span>
                  </div>
                  <p className="mt-2.5 font-nav text-[10px] font-normal leading-snug text-carbon-900 sm:text-[11px]">
                    {t('joinClub.subscriptionDurations')}
                  </p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTier === 'apex'}
                  onClick={() => setSelectedTier('apex')}
                  className={cn(
                    'rounded-2xl border border-black px-4 py-3.5 text-left transition-colors',
                    selectedTier === 'apex'
                      ? 'bg-neutral-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]'
                      : 'bg-white hover:bg-neutral-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-nav text-[17px] font-semibold leading-tight text-carbon-900 md:text-lg">
                      {t('joinClub.tierApex')}
                    </span>
                    <span className="max-w-[48%] shrink-0 text-right text-[10px] font-medium leading-tight text-neutral-500 sm:text-[11px]">
                      {t('joinClub.fromPriceApex')}
                    </span>
                  </div>
                  <p className="mt-2.5 font-nav text-[10px] font-normal leading-snug text-carbon-900 sm:text-[11px]">
                    {t('joinClub.subscriptionDurationsApex')}
                  </p>
                </button>
              </div>
            </section>

            <section
              ref={personalizeRef}
              aria-labelledby="join-yours-heading"
              className={cn(!canEditName && 'opacity-50')}
            >
              <h2
                id="join-yours-heading"
                className="w-full text-left font-nav text-lg font-bold tracking-tight text-carbon-900 md:text-xl"
              >
                {t('joinClub.makeItYoursLead')}
                {gradientWord('joinClub.makeItYoursHighlight')}
              </h2>
              {!canEditName && (
                <p className="mt-2 font-nav text-xs text-neutral-500">{t('joinClub.unlockNameHint')}</p>
              )}

              {/* Doc HeroUI : https://www.heroui.com/docs/react/components/text-field#with-description — pilule blanche, ombre douce */}
              <TextField
                fullWidth
                className="mt-6 max-w-md gap-1.5 font-nav"
                name="join-club-name"
                value={memberName}
                onChange={setMemberName}
                isDisabled={!canEditName}
              >
                <Label className="text-sm font-semibold text-carbon-900">{t('joinClub.nameFieldLabel')}</Label>
                <Input
                  placeholder={t('joinClub.nameFieldPlaceholder')}
                  className={cn(
                    'w-full rounded-2xl border-0 bg-white px-4 py-2.5 font-nav text-sm text-carbon-900 antialiased',
                    'shadow-[0_2px_16px_rgba(15,23,42,0.07)] transition-[box-shadow] duration-200',
                    'placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-carbon-900/10',
                    'focus:shadow-[0_4px_20px_rgba(15,23,42,0.1)]',
                  )}
                />
                <Description className="text-xs leading-snug text-neutral-500 not-italic">
                  {t('joinClub.nameFieldDescription')}
                </Description>
              </TextField>
            </section>

            {/* Doc HeroUI : https://www.heroui.com/docs/react/components/radio-group — même palette que « Choose your status » (carbon / neutral). */}
            <section
              aria-labelledby="join-commitment-heading"
              className={cn('font-nav', !canEditCommitment && 'opacity-50')}
            >
              {!canEditCommitment && (
                <p className="mb-3 font-nav text-xs text-neutral-500">{t('joinClub.unlockCommitmentHint')}</p>
              )}
              <RadioGroup
                className="flex flex-col gap-4"
                name="join-club-commitment"
                value={commitment}
                onChange={(value) => setCommitment(String(value))}
                aria-labelledby="join-commitment-heading"
                isDisabled={!canEditCommitment}
              >
                <div className="flex flex-col gap-1">
                  <Label
                    id="join-commitment-heading"
                    className="text-left font-nav text-lg font-bold tracking-tight text-carbon-900 md:text-xl"
                  >
                    {t('joinClub.chooseCommitmentLead')}
                    {gradientWord('joinClub.chooseCommitmentHighlight')}
                  </Label>
                  <Description className="text-sm font-normal leading-snug text-neutral-500">
                    {t(
                      selectedTier === 'apex'
                        ? 'joinClub.commitmentGroupDescriptionApex'
                        : 'joinClub.commitmentGroupDescription',
                    )}
                  </Description>
                </div>

                {commitmentKeys.map((m) => {
                  const isApex = selectedTier === 'apex'
                  const monthLabel = isApex
                    ? t(MONTH_LABEL_APEX[m as ApexMonth])
                    : t(MONTH_I18N[m as IgnitionMonth])
                  const descKey = isApex ? MONTH_DESC_APEX[m as ApexMonth] : MONTH_DESC_IGNITION[m as IgnitionMonth]
                  const priceKey = isApex ? MONTH_PRICE_APEX[m as ApexMonth] : MONTH_PRICE_IGNITION[m as IgnitionMonth]
                  return (
                  <Radio
                    key={m}
                    value={m}
                    className={cn(
                      'group flex w-full cursor-pointer items-start gap-3 rounded-2xl py-2 outline-none transition-colors',
                      'hover:bg-neutral-50',
                      'data-[focus-visible]:ring-2 data-[focus-visible]:ring-carbon-900/15',
                    )}
                  >
                    <Radio.Control className="flex shrink-0 items-center justify-center pt-0.5">
                      <Radio.Indicator
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-neutral-400 bg-white shadow-inner',
                          'group-data-[selected]:border-[#006FEE] group-data-[selected]:bg-[#006FEE]',
                        )}
                      >
                        <span
                          className="size-1.5 rounded-full bg-white opacity-0 transition-opacity group-data-[selected]:opacity-100"
                          aria-hidden
                        />
                      </Radio.Indicator>
                    </Radio.Control>
                    <Radio.Content className="flex min-w-0 flex-1 flex-row items-start justify-between gap-2 sm:gap-3">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Label className="text-sm font-semibold text-carbon-900">{monthLabel}</Label>
                        <Description className="text-[11px] font-normal leading-snug text-neutral-500 sm:text-xs">
                          {t(descKey)}
                        </Description>
                      </div>
                      <span
                        className="max-w-[52%] shrink-0 pt-0.5 text-right text-[10px] font-medium leading-tight text-neutral-500 sm:max-w-[55%] sm:text-[11px]"
                      >
                        {t(priceKey)}
                      </span>
                    </Radio.Content>
                  </Radio>
                  )
                })}
              </RadioGroup>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
