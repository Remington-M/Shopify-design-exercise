// Empty + Active screens. Suggestions (nothing typed) → predictions that track the typed text.
// Hard cuts only: typing must feel immediate, so there are no transitions between hint sets.
import arrowDown from '../assets/arrow-down.svg'
import baggu from '../assets/baggu.png'
import star from '../assets/star.svg'
import search from '../assets/search.svg'

const SUGGESTIONS = ['Kitchen organizers that match my Caraway pot', 'White skate shoes', 'A gift for my nephew ']

type Bucket = { merchants: string[]; queries: string[] }

// Longest matching prefix wins. The keys are lowercase.
const BUCKETS: Record<string, Bucket> = {
  s: { merchants: ['Steve Madden', 'Skims'], queries: ['sneakers', 'sandals', 'sweaters', 'sunglasses'] },
  sh: { merchants: ['Steve Madden', 'Shopify Supply'], queries: ['shoes', 'shorts', 'shirts', 'shampoo'] },
  sho: { merchants: ['Allbirds', 'Steve Madden'], queries: ['shoes', 'shoes men', 'shoes women', 'shoes nike'] },
  'shoes ': { merchants: ['Allbirds', 'Steve Madden'], queries: ['shoes for women', 'shoes for men', 'shoes on sale', 'shoes nike'] },
  'shoes f': { merchants: ['Allbirds', 'On Running'], queries: ['shoes for women', 'shoes for flat feet', 'shoes for running', 'shoes for work'] },
  'shoes for m': { merchants: ['Hoka', 'On Running'], queries: ['shoes for men', 'shoes for marathon', 'shoes for men wide feet', 'shoes for moving'] },
  'shoes for ma': { merchants: ['Hoka', 'Saucony'], queries: ['shoes for marathon', 'shoes for marathon running', 'shoes for marathon training', 'shoes for maternity'] },
  'shoes for marathon ': { merchants: ['Hoka', 'Saucony'], queries: ['shoes for marathon training', 'shoes for marathon running', 'shoes for marathon race day', 'shoes for marathon women'] },
  'shoes for marathon t': { merchants: ['Hoka', 'Saucony'], queries: ['shoes for marathon training', 'shoes for marathon training beginners', 'shoes for marathon training women', 'shoes for marathon training high mileage'] },
}

function bucketFor(typed: string): Bucket {
  const t = typed.toLowerCase()
  const key = Object.keys(BUCKETS).filter((k) => t.startsWith(k)).sort((a, b) => b.length - a.length)[0]
  return BUCKETS[key ?? 's']
}

export function Compose({ typed }: { typed: string }) {
  if (!typed) {
    return (
      <div className="absolute left-0 top-[217px] flex w-full flex-col gap-3 px-5">
        <p className="text-[14px] font-semibold leading-5 tracking-[-0.2px] text-black/55">Suggestions</p>
        {SUGGESTIONS.map((s) => (
          <div key={s} className="flex h-10 items-center gap-2 self-start rounded-full bg-black/[0.04] p-3">
            <img src={arrowDown} className="size-4" alt="" />
            <p className="text-[12px] font-medium leading-4 tracking-[-0.2px]">{s}</p>
          </div>
        ))}
      </div>
    )
  }

  const { merchants, queries } = bucketFor(typed)
  const t = typed.toLowerCase()
  return (
    <div className="absolute left-5 top-[139px] flex w-[353px] flex-col gap-1">
      {merchants.map((m) => (
        <div key={m} className="flex h-10 items-center gap-4 py-1">
          <div className="size-8 overflow-hidden rounded-full border-[0.5px] border-[rgba(5,41,77,0.1)]">
            <img src={baggu} className="size-full object-cover" alt="" />
          </div>
          <div className="flex items-center gap-1">
            <p className="text-[14px] leading-5 tracking-[-0.2px]">{m}</p>
            <div className="flex items-center gap-0.5 rounded-md bg-black/[0.04] px-1 py-0.5 text-[12px] leading-[14px] text-black/55">
              4.7 <img src={star} className="size-3" alt="" /> (163)
            </div>
          </div>
        </div>
      ))}
      {queries.map((q) => {
        const match = q.startsWith(t) ? t.length : 0
        return (
          <div key={q} className="flex h-10 items-center gap-4 py-1">
            <div className="flex size-8 items-center justify-center">
              <img src={search} className="size-5" alt="" />
            </div>
            <p className="truncate text-[14px] leading-5 tracking-[-0.2px]">
              <span className="text-black/55">{q.slice(0, match)}</span>
              <span className="font-medium text-black">{q.slice(match)}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
