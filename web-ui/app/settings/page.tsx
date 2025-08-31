'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, Key, Globe, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    openaiKey: '',
    deepseekKey: '',
    anthropicKey: '',
    backendUrl: 'http://localhost:8000',
    defaultProvider: 'openai',
    notifications: true,
    autoSave: true,
    debugMode: false,
  })

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('tradingagents-settings', JSON.stringify(settings))
    toast.success('设置已保存')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground">
          配置应用程序设置和 API 密钥
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">API 配置</TabsTrigger>
          <TabsTrigger value="general">通用设置</TabsTrigger>
          <TabsTrigger value="security">安全</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API 密钥
              </CardTitle>
              <CardDescription>
                配置各个 AI 提供商的 API 密钥
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={settings.openaiKey}
                  onChange={(e) => setSettings({...settings, openaiKey: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deepseek-key">DeepSeek API Key</Label>
                <Input
                  id="deepseek-key"
                  type="password"
                  placeholder="sk-..."
                  value={settings.deepseekKey}
                  onChange={(e) => setSettings({...settings, deepseekKey: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings.anthropicKey}
                  onChange={(e) => setSettings({...settings, anthropicKey: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                后端配置
              </CardTitle>
              <CardDescription>
                配置后端服务器连接
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backend-url">后端 URL</Label>
                <Input
                  id="backend-url"
                  type="url"
                  placeholder="http://localhost:8000"
                  value={settings.backendUrl}
                  onChange={(e) => setSettings({...settings, backendUrl: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-provider">默认 LLM 提供商</Label>
                <Select 
                  value={settings.defaultProvider}
                  onValueChange={(v) => setSettings({...settings, defaultProvider: v})}
                >
                  <SelectTrigger id="default-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通用设置
              </CardTitle>
              <CardDescription>
                应用程序偏好设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">通知</Label>
                  <p className="text-sm text-muted-foreground">
                    接收任务完成通知
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(v) => setSettings({...settings, notifications: v})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">自动保存</Label>
                  <p className="text-sm text-muted-foreground">
                    自动保存报告和设置
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={settings.autoSave}
                  onCheckedChange={(v) => setSettings({...settings, autoSave: v})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode">调试模式</Label>
                  <p className="text-sm text-muted-foreground">
                    显示详细的调试信息
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={settings.debugMode}
                  onCheckedChange={(v) => setSettings({...settings, debugMode: v})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全设置
              </CardTitle>
              <CardDescription>
                管理安全和隐私选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-2">数据隐私</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  所有 API 密钥都存储在本地浏览器中，不会发送到服务器。
                </p>
                <Button variant="outline" size="sm">
                  清除本地数据
                </Button>
              </div>
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-2">会话管理</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  管理活动会话和登录设备
                </p>
                <Button variant="outline" size="sm">
                  查看活动会话
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </div>
    </div>
  )
}
