"use client"

interface SupRefProps {
  id: number
}

export default function SupRef({ id }: SupRefProps) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('sup-navigate', { detail: { supId: id } }))
  }

  return (
    <span
      id={`sup-body-${id}`}
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-full w-[13px] h-[13px] text-[10px] leading-none font-medium text-white cursor-pointer select-none relative -top-[5px] ml-[2px] transition-colors duration-150 bg-stone-300 hover:bg-orange-700 dark:bg-zinc-600 dark:hover:bg-lime-200 dark:hover:text-zinc-900"
    >
      {id}
    </span>
  )
}
