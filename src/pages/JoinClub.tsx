import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Description, Input, Label, Radio, RadioGroup, TextField } from '@heroui/react'
import { AppleButton } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
import { MembershipCardBackPreview } from '@/components/join-club/MembershipCardBackPreview'
import {
  JOIN_CLUB_CARD_IMAGES,
  JOIN_CLUB_MEMBER_NAME_MAX_LENGTH,
  JOIN_CLUB_WIZARD_PLACEHOLDER,
} from '@/constants/joinClubAssets'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { usePageTitle } from '@/hooks/usePageTitle'

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

/** Prix mensuels (CAD), alignés sur les libellés i18n — pour total et récap. */
const JOIN_CLUB_MONTHLY_CAD_IGNITION: Record<IgnitionMonth, number> = {
  '1': 59,
  '3': 54,
  '6': 49,
  '12': 45,
}
const JOIN_CLUB_MONTHLY_CAD_APEX: Record<ApexMonth, number> = {
  '3': 99,
  '6': 79,
  '12': 69,
}

/** XP attribués à la validation du panier (placeholder métier). */
const JOIN_CLUB_XP_REWARD: Record<ClubTier, Record<string, number>> = {
  ignition: { '1': 120, '3': 400, '6': 900, '12': 2200 },
  apex: { '3': 600, '6': 1400, '12': 3200 },
}

function joinClubMonthlyCad(tier: ClubTier, months: string): number {
  if (tier === 'ignition') {
    return JOIN_CLUB_MONTHLY_CAD_IGNITION[months as IgnitionMonth] ?? 45
  }
  return JOIN_CLUB_MONTHLY_CAD_APEX[months as ApexMonth] ?? 69
}

function joinClubXpReward(tier: ClubTier, months: string): number {
  return JOIN_CLUB_XP_REWARD[tier][months] ?? 0
}

function formatCad(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount)
}

const JOIN_CLUB_RETURN = '/join-club'

const JOIN_CLUB_NAME_INPUT_ID = 'join-club-member-name'

function blurJoinClubNameInput() {
  const el =
    document.querySelector<HTMLInputElement>('input[name="join-club-name"]') ??
    document.getElementById(JOIN_CLUB_NAME_INPUT_ID)
  if (el instanceof HTMLElement) el.blur()
}

export function JoinClub() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  usePageTitle('Join the Club - Fireball Canada')
  const [authReady, setAuthReady] = useState(false)
  /** `null` = étape 1 : pas encore de carte choisie (image d’accueil, pas les visuels membership). */
  const [selectedTier, setSelectedTier] = useState<ClubTier | null>(null)
  const [memberName, setMemberName] = useState('')
  const [commitment, setCommitment] = useState<string>('12')
  /** Dos de carte : uniquement tant que le champ « nom » a le focus (pas quand le nom est rempli seul). */
  const [nameFieldFocused, setNameFieldFocused] = useState(false)
  /** Hors focus nom : face avant ou dos (flèches). Le focus nom impose toujours le dos. */
  const [cardPreviewFace, setCardPreviewFace] = useState<'front' | 'back'>('front')

  const heroSentinelRef = useRef<HTMLDivElement | null>(null)
  const [compactNavVisible, setCompactNavVisible] = useState(false)
  const reduceMotion = useEffectiveReducedMotion()

  const tierChosen = selectedTier !== null
  const nameFilled = memberName.trim().length > 0
  const canEditName = authReady && tierChosen
  const canEditCommitment = authReady && tierChosen && nameFilled
  const showSummary = authReady && tierChosen && nameFilled

  const commitmentKeys =
    selectedTier === 'apex' ? COMMITMENT_VALUES_APEX : COMMITMENT_VALUES_IGNITION

  useEffect(() => {
    let cancelled = false
    isAuthenticated().then((ok) => {
      if (!cancelled) setAuthReady(ok)
    })
    return () => {
      cancelled = true
    }
  }, [location.key, location.pathname])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void isAuthenticated().then(setAuthReady)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  /** Passage à Apex : 1 et 9 mois n’existent plus → repasser sur une durée valide. */
  useEffect(() => {
    if (selectedTier !== 'apex') return
    setCommitment((c) => (c === '1' ? '12' : c))
  }, [selectedTier])

  useEffect(() => {
    setCardPreviewFace('front')
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

  const imgs = selectedTier ? JOIN_CLUB_CARD_IMAGES[selectedTier] : null
  /**
   * Dos : (1) focus dans le champ nom → toujours dos avec aperçu du nom ;
   * (2) sinon → face avant ou dos selon les flèches.
   */
  const showBackFace =
    tierChosen && (nameFieldFocused ? true : cardPreviewFace === 'back')

  const gradientWord = (key: string) => (
    <span className="bg-gradient-to-l from-[#d4d4d4] via-[#7a7a7a] to-[#1a1a1a] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">
      {t(key)}
    </span>
  )

  const cardImage = (
    <div className="@container flex aspect-[4/3] w-full items-stretch overflow-hidden rounded-3xl bg-neutral-200 p-2.5 sm:p-3 md:p-3.5">
      {!tierChosen ? (
        <img
          src={JOIN_CLUB_WIZARD_PLACEHOLDER}
          alt={t('joinClub.wizardPlaceholderAlt')}
          className="h-full min-h-0 w-full max-h-full max-w-full object-contain object-center"
          draggable={false}
        />
      ) : showBackFace && selectedTier ? (
        <MembershipCardBackPreview name={memberName} tier={selectedTier} className="min-h-0 h-full w-full" />
      ) : imgs ? (
        <img
          src={imgs.front}
          alt={t('joinClub.cardImageAlt')}
          className="h-full min-h-0 w-full max-h-full max-w-full object-contain object-center"
          draggable={false}
        />
      ) : null}
    </div>
  )

  const accountReturnHref = `/account?returnTo=${encodeURIComponent(JOIN_CLUB_RETURN)}`

  /** Sous-titre récap : noir → gris (pas l’inverse). */
  const summaryGradientClass =
    'bg-gradient-to-r from-[#0a0a0a] via-[#525252] to-[#a8a8a8] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]'

  const compactNavTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }

  const summaryMonthLabel =
    selectedTier === 'apex'
      ? t(MONTH_LABEL_APEX[commitment as ApexMonth])
      : t(MONTH_I18N[commitment as IgnitionMonth])
  const summaryMonthlyCad = selectedTier ? joinClubMonthlyCad(selectedTier, commitment) : 0
  const summaryMonthsCount = Number(commitment) || 0
  const summaryTotalCad = summaryMonthlyCad * summaryMonthsCount
  const summaryXp = selectedTier ? joinClubXpReward(selectedTier, commitment) : 0

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
            className="sticky top-0 z-30 border-b border-neutral-200/90 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/85"
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
            <div className="flex flex-col gap-3">
              {cardImage}
              {tierChosen && (
                <div
                  className="flex items-center justify-center gap-2"
                  role="group"
                  aria-label={t('joinClub.previewCardNavAria')}
                >
                  <button
                    type="button"
                    className={cn(
                      'inline-flex size-10 items-center justify-center rounded-full border transition-colors',
                      'border-neutral-300 bg-white text-carbon-900 shadow-sm',
                      'hover:border-neutral-400 hover:bg-neutral-50',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900/15',
                      !showBackFace && 'border-carbon-900/25 bg-neutral-100',
                    )}
                    aria-label={t('joinClub.previewCardFrontAria')}
                    aria-pressed={!showBackFace}
                    onClick={() => {
                      setCardPreviewFace('front')
                      blurJoinClubNameInput()
                    }}
                  >
                    <ChevronLeft className="size-5 shrink-0" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex size-10 items-center justify-center rounded-full border transition-colors',
                      'border-neutral-300 bg-white text-carbon-900 shadow-sm',
                      'hover:border-neutral-400 hover:bg-neutral-50',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900/15',
                      showBackFace && 'border-carbon-900/25 bg-neutral-100',
                    )}
                    aria-label={t('joinClub.previewCardBackAria')}
                    aria-pressed={showBackFace}
                    onClick={() => {
                      setCardPreviewFace('back')
                      blurJoinClubNameInput()
                    }}
                  >
                    <ChevronRight className="size-5 shrink-0" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-16 pb-8 lg:ml-auto lg:max-w-[min(100%,420px)] lg:space-y-20 lg:pt-[19cqw] xl:max-w-[440px]">
            {!authReady && (
              <section aria-labelledby="join-login-heading" className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 shadow-sm">
                <h2
                  id="join-login-heading"
                  className="font-nav text-lg font-bold tracking-tight text-carbon-900 md:text-xl"
                >
                  {t('joinClub.loginSectionTitle')}
                </h2>
                <p className="mt-2 font-nav text-sm leading-relaxed text-neutral-600">
                  {t('joinClub.loginSectionDescription')}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    to={accountReturnHref}
                    className={cn(
                      'inline-flex items-center justify-center rounded-full border border-carbon-900 bg-carbon-900 px-5 py-2.5',
                      'font-nav text-sm font-semibold text-white transition-colors hover:bg-carbon-800',
                    )}
                  >
                    {t('joinClub.loginSectionCta')}
                  </Link>
                  <button
                    type="button"
                    className="font-nav text-sm font-semibold text-carbon-900 underline underline-offset-4 decoration-carbon-900/30 hover:decoration-carbon-900"
                    onClick={() => void isAuthenticated().then(setAuthReady)}
                  >
                    {t('joinClub.loginRecheck')}
                  </button>
                </div>
              </section>
            )}

            {authReady && (
              <>
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
                onChange={(v) =>
                  setMemberName(String(v).slice(0, JOIN_CLUB_MEMBER_NAME_MAX_LENGTH))
                }
                isDisabled={!canEditName}
              >
                <Label className="text-sm font-semibold text-carbon-900">{t('joinClub.nameFieldLabel')}</Label>
                <Input
                  id={JOIN_CLUB_NAME_INPUT_ID}
                  placeholder={t('joinClub.nameFieldPlaceholder')}
                  onFocus={() => setNameFieldFocused(true)}
                  onBlur={() => setNameFieldFocused(false)}
                  className={cn(
                    'w-full rounded-2xl border-0 bg-white px-4 py-2.5 font-nav text-sm text-carbon-900 antialiased',
                    'shadow-[0_2px_16px_rgba(15,23,42,0.07)] transition-[box-shadow] duration-200',
                    'placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-carbon-900/10',
                    'focus:shadow-[0_4px_20px_rgba(15,23,42,0.1)]',
                  )}
                />
                <Description className="text-xs leading-snug text-neutral-500 not-italic">
                  {t('joinClub.nameFieldDescription', { max: JOIN_CLUB_MEMBER_NAME_MAX_LENGTH })}
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
                onChange={(value) => {
                  setCommitment(String(value))
                  setNameFieldFocused(false)
                }}
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

            {showSummary && selectedTier && imgs && (
              <section
                aria-labelledby="join-summary-heading"
                className="border-t border-neutral-200 pt-16 md:pt-20"
              >
                <h2
                  id="join-summary-heading"
                  className="font-nav text-2xl font-bold leading-tight tracking-tight text-carbon-900 md:text-3xl"
                >
                  <span className="block">{t('joinClub.summaryTitle')}</span>
                  <span
                    className={`mt-2 block text-lg font-semibold md:mt-2.5 md:text-2xl ${summaryGradientClass}`}
                  >
                    {t('joinClub.summarySubtitle')}
                  </span>
                </h2>

                <div className="mt-10 space-y-6">
                  <figure className="overflow-hidden rounded-2xl bg-neutral-200 p-3 sm:p-4">
                    <div className="relative mx-auto flex aspect-[4/3] max-w-[260px] min-h-0 w-full items-stretch sm:max-w-[280px]">
                      <img
                        src={imgs.front}
                        alt=""
                        className="h-full min-h-0 w-full max-h-full max-w-full object-contain object-center"
                        draggable={false}
                      />
                    </div>
                    <figcaption className="sr-only">
                      {selectedTier === 'ignition' ? t('joinClub.tierIgnition') : t('joinClub.tierApex')}
                    </figcaption>
                  </figure>

                  <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 pb-4 font-nav">
                    <span className="text-sm font-semibold text-carbon-900">{summaryMonthLabel}</span>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-neutral-600">
                      {selectedTier === 'apex'
                        ? t(MONTH_PRICE_APEX[commitment as ApexMonth])
                        : t(MONTH_PRICE_IGNITION[commitment as IgnitionMonth])}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-neutral-500 sm:text-xs">
                    {t('joinClub.summaryPriceNotice')}
                  </p>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:text-[11px]">
                      {t('joinClub.summaryNameLabel')}
                    </p>
                    <p className="mt-1.5 font-nav text-base font-semibold uppercase tracking-[0.04em] text-carbon-900">
                      {memberName.trim()}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between gap-4 font-nav">
                    <span className="text-base font-bold text-carbon-900">{t('joinClub.summaryTotal')}</span>
                    <span className="text-lg font-bold tabular-nums text-carbon-900">
                      {formatCad(summaryTotalCad)}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-neutral-500">{t('joinClub.summaryXpEarned', { xp: summaryXp })}</p>

                  <p className="text-[11px] leading-relaxed text-neutral-500 sm:text-xs">{t('joinClub.summaryPaymentNotice')}</p>

                  <AppleButton
                    type="button"
                    className="w-full justify-center py-3 font-nav text-sm font-semibold"
                    onClick={() => {
                      /* Branchement paiement (Stripe, etc.) */
                    }}
                  >
                    {t('joinClub.summaryPayCta')}
                  </AppleButton>
                </div>
              </section>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
