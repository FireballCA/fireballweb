import { Link } from 'react-router-dom'

export function Typhon() {
  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: '#101010', minHeight: '100vh' }}>
      {/* Background TYPHON text */}
      <div
        className="absolute inset-0 flex items-start justify-center pointer-events-none select-none pt-20"
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(100px, 22vw, 420px)',
            lineHeight: 1,
            opacity: 0.25,
            background: 'linear-gradient(179deg, #FFF 1.11%, #101010 84.67%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          TYPHON
        </span>
      </div>

      {/* Product image */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/8f82ea46c4881025ef1f324810277b455c8f2a70?width=3105"
          alt="Typhon product"
          style={{
            width: 'clamp(400px, 60vw, 900px)',
            height: 'auto',
            transform: 'rotate(-109.356deg)',
            marginRight: '-10%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen px-12 py-32">
        {/* Title */}
        <div className="mt-auto pt-48">
          <h1
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(60px, 8vw, 120px)',
              color: '#fff',
              lineHeight: 1,
              margin: 0,
            }}
          >
            TYPHON
          </h1>

          {/* Discover button */}
          <Link
            to="/boutique"
            className="inline-block mt-12 px-8 py-4 rounded-full font-medium text-white transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: '#B61B1B',
              fontFamily: 'inherit',
            }}
          >
            Discover
          </Link>
        </div>
      </div>
    </div>
  )
}
