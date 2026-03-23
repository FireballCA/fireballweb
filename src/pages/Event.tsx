export function Event() {
  return (
    <div className="bg-black text-white">
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden -mt-20 px-6 pb-20 pt-32 md:pb-24 md:pt-36"
        aria-label="Hero"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/Assets/videoplayback.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="font-nav font-bold text-5xl leading-[1.02] tracking-tight text-pearl md:text-6xl lg:text-7xl xl:text-8xl">
            An Evening After the Show
          </h1>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <a
              href="#request-invitation"
              className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3.5 text-center font-nav text-sm font-bold text-white transition-opacity hover:opacity-90 md:px-8"
            >
              Request your invitation
            </a>
            <a
              href="#learn-more"
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-transparent px-6 py-3.5 text-center font-nav text-sm font-bold text-pearl transition-colors duration-200 hover:border-white/55 hover:bg-white hover:text-black md:px-8"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
