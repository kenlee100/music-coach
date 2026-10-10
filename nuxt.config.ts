export default defineNuxtConfig({
  compatibilityDate: '2026-10-10',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: 'Chordroom｜吉他和弦與節奏練習室',
      meta: [
        { name: 'description', content: '搜尋和弦、閱讀吉他指板、建立多小節和弦時間軸並配合節拍練習。' },
        { name: 'theme-color', content: '#0b1020' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  nitro: {
    prerender: { routes: ['/'] }
  },
  typescript: { typeCheck: true }
})
