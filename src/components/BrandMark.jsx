// The logo at the top left: your logo if brand.logo is set, otherwise a colored badge
// with the first letter of the brand name. brand.logoDark (optional) is used in dark mode,
// for logos that would disappear on a dark background.
export default function BrandMark({ brand }) {
  if (brand.logo) {
    // Smaller on phones so a wide wordmark doesn't squeeze the brand name out.
    const imgClass = 'h-8 w-auto max-w-20 shrink-0 object-contain sm:h-10 sm:max-w-40'
    return brand.logoDark ? (
      <>
        <img src={brand.logo} alt={`${brand.name} logo`} className={`${imgClass} dark:hidden`} />
        <img src={brand.logoDark} alt={`${brand.name} logo`} className={`${imgClass} hidden dark:block`} />
      </>
    ) : (
      <img src={brand.logo} alt={`${brand.name} logo`} className={imgClass} />
    )
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
      {brand.name.charAt(0).toUpperCase()}
    </div>
  )
}
