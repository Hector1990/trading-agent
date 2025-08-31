'use client'

import dynamic from 'next/dynamic'

const HelpModule = dynamic(() => import('@/modules/help/HelpModule'), {
  ssr: false,
})

export default function HelpPage() {
  return <HelpModule />
}
