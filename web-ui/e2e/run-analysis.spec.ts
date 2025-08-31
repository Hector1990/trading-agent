import { test, expect } from '@playwright/test'

test.describe('Run Analysis Flow', () => {
  test('should navigate to run page and submit analysis', async ({ page }) => {
    // Navigate to run page
    await page.goto('/run')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('运行分析')
    
    // Fill in the form
    await page.fill('input[name="ticker"]', 'AAPL')
    await page.fill('input[name="date"]', '2024-01-01')
    
    // Select LLM provider
    await page.click('button[role="combobox"]')
    await page.click('text=OpenAI')
    
    // Submit form
    await page.click('button:has-text("开始分析")')
    
    // Should redirect to run detail page
    await expect(page).toHaveURL(/\/run\/[\w-]+/)
    
    // Should show running status
    await expect(page.locator('text=运行中')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/run')
    
    // Try to submit empty form
    await page.click('button:has-text("开始分析")')
    
    // Should show validation errors
    await expect(page.locator('text=必填')).toBeVisible()
  })
})

test.describe('Dashboard', () => {
  test('should display dashboard with stats', async ({ page }) => {
    await page.goto('/')
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('仪表板')
    await expect(page.locator('text=总运行次数')).toBeVisible()
    await expect(page.locator('text=运行中')).toBeVisible()
    await expect(page.locator('text=已完成')).toBeVisible()
    
    // Check quick actions
    await expect(page.locator('button:has-text("新建分析")')).toBeVisible()
    await expect(page.locator('button:has-text("查看历史")')).toBeVisible()
  })
})

test.describe('History Page', () => {
  test('should display and filter run history', async ({ page }) => {
    await page.goto('/history')
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('历史记录')
    
    // Test search
    await page.fill('input[placeholder*="搜索股票代码"]', 'AAPL')
    
    // Test status filter
    await page.click('button[role="combobox"]')
    await page.click('text=已完成')
    
    // Should update the list (or show no results)
    await expect(page.locator('text=任务列表')).toBeVisible()
  })
})
