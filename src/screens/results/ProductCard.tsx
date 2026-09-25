import heart from '../../assets/results/icon-heart.svg'
import star from '../../assets/results/star.svg'
import starMask from '../../assets/results/star-mask.svg'

const caption = 'text-[12px] leading-[16px] tracking-[-0.2px] text-black'

function HalfStar() {
  const mask = (pos: string) => ({
    maskImage: `url("${starMask}")`,
    WebkitMaskImage: `url("${starMask}")`,
    maskSize: '12px 12px',
    WebkitMaskSize: '12px 12px',
    maskPosition: pos,
    WebkitMaskPosition: pos,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  })
  return (
    <div className="relative size-[12px]">
      <div className="absolute inset-y-0 left-0 w-[6px] bg-[#e3be2b]" style={mask('0 0')} />
      <div className="absolute inset-y-0 right-0 w-[6px] bg-black/10" style={mask('-6px 0')} />
    </div>
  )
}

function ReviewStars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-[4px]">
      <div className="flex gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <img key={i} src={star} alt="" className="block size-[12px]" />
        ))}
        <HalfStar />
      </div>
      <span className={`${caption} font-medium`}>({count})</span>
    </div>
  )
}

export type Product = { image: string; merchant: string; name: string; price: string; reviews: number }

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex w-[156px] shrink-0 flex-col gap-[8px]">
      <div className="relative aspect-square w-full overflow-hidden rounded-[20px] border-[0.5px] border-[rgba(5,41,77,0.1)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
        <img src={product.image} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-black/[0.04]" />
        <button
          type="button"
          aria-label="Favorite"
          className="absolute bottom-[12px] right-[12px] flex size-[32px] items-center justify-center rounded-full bg-[rgba(40,40,40,0.3)] backdrop-blur-[2px]"
        >
          <img src={heart} alt="" className="block size-[16px]" />
        </button>
      </div>
      <div className="flex flex-col pl-[4px]">
        <p className={`${caption} truncate`}>{product.merchant}</p>
        <p className={`${caption} truncate font-semibold`}>{product.name}</p>
        <ReviewStars count={product.reviews} />
        <p className={`${caption} pt-[2px] font-semibold`}>{product.price}</p>
      </div>
    </div>
  )
}
