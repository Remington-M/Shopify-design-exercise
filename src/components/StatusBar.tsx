import cellular from '../assets/cellular.svg'
import wifi from '../assets/wifi.svg'
import battery from '../assets/battery.svg'

export function StatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[62px] bg-gradient-to-b from-white to-white/0">
      <div className="flex items-center justify-center gap-[154px] px-6 pb-[19px] pt-[21px]">
        <div className="flex h-[22px] flex-1 items-center justify-center pt-[1.5px]">
          <p className="text-[17px] font-semibold leading-[22px] text-[#181d27]">9:41</p>
        </div>
        <div className="flex h-[22px] flex-1 items-center justify-center gap-[7px] pr-px pt-px">
          <img src={cellular} className="h-[12.226px] w-[19.2px]" alt="" />
          <img src={wifi} className="h-[12.328px] w-[17.142px]" alt="" />
          <img src={battery} className="h-[13px] w-[27.328px]" alt="" />
        </div>
      </div>
    </div>
  )
}
