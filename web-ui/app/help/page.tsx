'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { BookOpen, Code, HelpCircle, MessageCircle, Github, Mail } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    question: '如何配置 API 密钥？',
    answer: '前往设置页面，在 API 配置选项卡中输入您的 OpenAI、DeepSeek 或 Anthropic API 密钥。密钥将安全地存储在您的浏览器本地存储中。'
  },
  {
    question: '支持哪些股票代码？',
    answer: '系统支持美股市场的所有标准股票代码，如 AAPL、GOOGL、TSLA 等。请使用大写字母输入股票代码。'
  },
  {
    question: '分析需要多长时间？',
    answer: '分析时间取决于选择的分析师数量和 LLM 提供商。通常单个分析师需要 2-5 分钟，多个分析师可能需要 10-20 分钟。'
  },
  {
    question: '如何查看历史报告？',
    answer: '您可以在历史记录页面查看所有运行记录，或在报告页面查看已完成的分析报告。点击查看详情可以查看完整报告。'
  },
  {
    question: '支持哪些 LLM 提供商？',
    answer: '目前支持 OpenAI (GPT-4)、DeepSeek 和 Anthropic (Claude) 三种 LLM 提供商。您可以在运行分析时选择使用哪个提供商。'
  },
  {
    question: '如何导出分析报告？',
    answer: '在报告详情页面，您可以选择以 Markdown、JSON 或 HTML 格式下载报告。点击相应的下载按钮即可。'
  }
]

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">帮助中心</h1>
        <p className="text-muted-foreground">
          获取使用指南和常见问题解答
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              查看完整的使用文档和 API 参考
            </p>
            <Button variant="outline" className="w-full">
              查看文档
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API 参考
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              了解如何通过 API 集成 TradingAgents
            </p>
            <Button variant="outline" className="w-full">
              API 文档
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              社区支持
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              加入社区获取帮助和分享经验
            </p>
            <Button variant="outline" className="w-full">
              访问社区
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速入门</CardTitle>
          <CardDescription>
            按照以下步骤开始使用 TradingAgents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <div>
                <h4 className="font-medium">配置 API 密钥</h4>
                <p className="text-sm text-muted-foreground">
                  在 <Link href="/settings" className="text-primary hover:underline">设置页面</Link> 配置您的 AI 提供商 API 密钥
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <div>
                <h4 className="font-medium">创建分析任务</h4>
                <p className="text-sm text-muted-foreground">
                  在 <Link href="/run" className="text-primary hover:underline">运行分析页面</Link> 输入股票代码和选择分析参数
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <div>
                <h4 className="font-medium">查看分析结果</h4>
                <p className="text-sm text-muted-foreground">
                  分析完成后，在 <Link href="/reports" className="text-primary hover:underline">报告页面</Link> 查看和下载详细报告
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
          <CardDescription>
            找到常见问题的答案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertTitle>需要更多帮助？</AlertTitle>
        <AlertDescription>
          <div className="mt-2 flex gap-4">
            <Button variant="outline" size="sm">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              联系支持
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
