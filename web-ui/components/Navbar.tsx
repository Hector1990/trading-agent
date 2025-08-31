"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ModeToggle'
import { 
  Home, 
  PlayCircle, 
  History, 
  FileText, 
  Settings,
  HelpCircle,
  TrendingUp
} from 'lucide-react'

const navigation = [
  { name: '仪表板', href: '/', icon: Home },
  { name: '运行分析', href: '/run', icon: PlayCircle },
  { name: '历史记录', href: '/history', icon: History },
  { name: '报告', href: '/reports', icon: FileText },
  { name: '设置', href: '/settings', icon: Settings },
  { name: '帮助', href: '/help', icon: HelpCircle },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              TradingAgents
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 transition-colors hover:text-foreground/80",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline-block">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
