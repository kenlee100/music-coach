import { expect, test } from '@playwright/test'

test('core chord and timeline flow', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await expect(page.getByRole('heading', { name: '今天想練什麼？' })).toBeVisible()
  await expect(page.locator('.fretboard-string')).toHaveCount(6)
  await expect(page.locator('.fret-marker')).toHaveCount(5)
  await expect(page.locator('.fret-marker.double')).toHaveCount(1)
  await expect(page.locator('.fretboard-wrap')).toHaveCSS('overflow', 'hidden')
  await page.getByRole('searchbox', { name: '搜尋和弦' }).fill('Dm7')
  await page.getByRole('button', { name: /^Dm7 D · F · A · C$/ }).click()
  await expect(page.locator('.chord-name')).toHaveText('Dm7')
  await page.getByRole('button', { name: '加入時間軸 ＋' }).click()
  await expect(page.getByTestId('timeline-event-Dm7')).toBeAttached()
  await page.getByRole('button', { name: '播放行進' }).click()
  await expect(page.getByRole('button', { name: '停止行進' })).toBeVisible()
  expect(errors).toEqual([])
})

test('compatible scale view can be selected and persisted', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await page.getByLabel('FRETBOARD VIEW').selectOption('scale')
  await expect(page.getByLabel('COMPATIBLE SCALE')).toBeVisible()
  await page.getByLabel('COMPATIBLE SCALE').selectOption('lydian')
  await expect(page.locator('.scale-summary')).toContainText('C Lydian')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel('FRETBOARD VIEW')).toHaveValue('scale')
  await expect(page.getByLabel('COMPATIBLE SCALE')).toHaveValue('lydian')
})

test('light theme and mobile layout remain operable', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await page.getByLabel('主題').selectOption('light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('heading', { name: '多小節和弦時間軸' })).toBeVisible()
  expect(errors).toEqual([])
})

test('practice selection persists after reload', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await page.getByRole('searchbox', { name: '搜尋和弦' }).fill('G7')
  await page.getByRole('button', { name: /^G7 G · B · D · F$/ }).click()
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await expect(page.locator('.chord-name')).toHaveText('G7')
})

test('unknown practice schema falls back without crashing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('chordroom-practice', JSON.stringify({ version: 99, currentChord: 'G7' })))
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('main[data-ready="true"]')).toBeAttached()
  await expect(page.locator('.chord-name')).toHaveText('Cmaj7')
})
