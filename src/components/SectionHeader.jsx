/**
 * Section heading: a tracked mono kicker, the title, an optional sub-line and an optional action
 * on the opposite edge.
 *
 * The original three props (kicker / title / sub) behave exactly as before, so the other pages
 * using it did not need touching. `accent` and `action` are additions the home page uses.
 */
export default function SectionHeader({
  kicker,
  title,
  accent,
  sub,
  action,
  center = true,
  as = 'h2',
}) {
  const H = as
  // Fluid rather than fixed: these used to be 38px/44px flat, which forced a global `!important`
  // override in index.css to stop them overflowing on a phone.
  const size = as === 'h1'
    ? 'text-[clamp(30px,6vw,46px)] font-extrabold'
    : 'text-[clamp(25px,4.6vw,39px)] font-bold'

  // An action needs the title and the action on opposite edges, which centring cannot express.
  const aligned = center && !action

  return (
    <div className={'mb-12 ' + (action ? 'flex flex-wrap items-end justify-between gap-6' : '')}>
      <div className={aligned ? 'text-center' : ''}>
        {/* .ngp-kicker is inline-flex, so text-align is what centres it — justify-* would need
            this wrapper to be a flex container. */}
        {kicker && <div className={'mb-4 ' + (aligned ? 'text-center' : '')}><span className="ngp-kicker">{kicker}</span></div>}
        <H className={'ngp-fluid mb-4 leading-[1.14] ' + size}>
          {title}
          {accent && <> <span className="ngp-grad">{accent}</span></>}
        </H>
        {sub && (
          <p className={'text-[clamp(15px,2.2vw,17.5px)] leading-[1.75] text-muted ' + (aligned ? 'mx-auto max-w-[580px]' : 'max-w-[560px]')}>
            {sub}
          </p>
        )}
        {aligned && <div className="ngp-rule mx-auto mt-7 w-[120px]" />}
      </div>
      {action}
    </div>
  )
}
