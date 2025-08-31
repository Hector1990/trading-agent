'use client'

import dynamic from 'next/dynamic'

const SettingsModule = dynamic(() => import('@/modules/settings/SettingsModule'), {
  ssr: false,
})

export default function SettingsPage() {
  return <SettingsModule />
}
