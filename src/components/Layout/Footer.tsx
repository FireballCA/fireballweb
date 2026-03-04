import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '@/data/products'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-carbon-900 border-t border-carbon-700">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-2xl tracking-luxury text-pearl hover:text-chrome transition-colors">
              FIREBALL
            </Link>
            <p className="mt-4 text-silver/70 text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-chrome uppercase mb-4">{t('footer.shop')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/boutique" className="text-silver/70 hover:text-chrome text-sm transition-colors">
                  {t('footer.allProducts')}
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/boutique/${c.id}`}
                    className="text-silver/70 hover:text-chrome text-sm transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-chrome uppercase mb-4">{t('footer.contact')}</h3>
            <p className="text-silver/70 text-sm">contact@fireball.fr</p>
            <p className="text-silver/70 text-sm mt-1">+33 1 23 45 67 89</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-carbon-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-silver/50 text-xs">{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6 text-xs text-silver/50">
            <a href="#" className="hover:text-chrome transition-colors">{t('footer.legalNotice')}</a>
            <a href="#" className="hover:text-chrome transition-colors">{t('footer.terms')}</a>
            <a href="#" className="hover:text-chrome transition-colors">{t('footer.privacy')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
