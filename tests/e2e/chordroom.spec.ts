import { expect, test } from '@playwright/test'

test('core chord and timeline flow', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await expect(page.getByRole('heading', { name: '今天想練什麼？' })).toBeVisible()
  await page.getByRole('searchbox', { name: '搜尋和弦' }).fill('Dm7')
  await page.getByRole('button', { name: /^Dm7 D · F · A · C$/ }).click()
  await expect(page.locator('.chord-name')).toHaveText('Dm7')
  await page.getByRole('button', { name: '加入時間軸 ＋' }).click()
  await expect(page.getByTestId('timeline-event-Dm7')).toBeAttached()
  await page.getByRole('button', { name: '播放行進' }).click()
  await expect(page.getByRole('button', { name: '停止行進' })).toBeVisible()
  expect(errors).toEqual([])
})

test('light theme and mobile layout remain operable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await page.getByLabel('主題').selectOption('light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('heading', { name: '多小節和弦時間軸' })).toBeVisible()
})
