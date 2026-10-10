# Chordroom

[線上 Demo](https://kenlee100.github.io/music-coach/)

Chordroom 是以 Nuxt、Vue 3、TypeScript 與 Web Audio API 製作的吉他和弦練習工具。它提供和弦查詢、吉他指板定位、多小節和弦時間軸與節拍練習。

## 專案特色

- 標準調弦吉他指板，顯示第 1–22 格。
- 和弦組成音、公式、相容音階切換及指板位置提示。
- 電吉他與木吉他指板配色。
- 跟隨系統、淺色及深色主題。
- 40–240 BPM、3/4 與 4/4 拍號。
- 多小節和弦時間軸，支援全音符至六十四分音符。
- 方塊拖移、雙側縮放及同小節連鎖推動。
- 預備拍與和弦時間軸播放。
- 將練習設定與和弦行進保存在目前瀏覽器。
- 匯出和弦行進為純文字檔。

完整操作方式請參閱 [USAGE.md](./USAGE.md)。

## 技術架構

本專案使用 Nuxt 4、Vue 3 與 TypeScript。現階段只有根路由 `/`，透過 `nuxt generate` 輸出靜態網站；瀏覽器 API 集中於 `.client.ts` service，保留未來按路由使用 prerender、CSR 或 SSR 的能力。

主要模組：

- `app/pages/index.vue`：唯一頁面與功能協調。
- `app/components/ChordLibrary.vue`：和弦搜尋、分類與選取。
- `app/components/GuitarFretboard.vue`：目前和弦、相容音階與 1–22 格指板。
- `app/components/RhythmTimeline.vue`：時間軸拖移、縮放及鍵盤操作。
- `app/composables/usePracticeTransport.ts`：播放 phase、排程、節拍器與生命週期清理。
- `app/domain/`：不依賴 Vue 的樂理與時間軸規則。
- `app/services/`：client-only Web Audio 與 localStorage。
- `app/assets/css/main.css`：主題、元件與響應式樣式。
- `tests/unit/`、`tests/e2e/`：Vitest 領域測試與 Playwright 瀏覽器流程。

## 環境需求

- Node.js 22.22.2 以上或相容的新版 LTS。
- pnpm 11.3.0。
- 支援 Web Audio API 的現代瀏覽器。

> 專案必須透過 Nuxt 開發伺服器或靜態輸出開啟，不支援 `file://`。

## 啟動專案

在專案根目錄執行：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

接著用瀏覽器開啟：

```text
http://127.0.0.1:3000/
```

停止伺服器時，在執行指令的終端機按下 `Control + C`。

### 驗證與靜態輸出

```bash
pnpm test
pnpm typecheck
pnpm test:e2e
pnpm generate
```

### 環境變數

複製 `.env.example` 為 `.env` 後可調整：

- `NUXT_HOST`、`NUXT_PORT`：本機 Nuxt host 與 port。
- `NUXT_APP_BASE_URL`：靜態部署的 base URL。
- `PLAYWRIGHT_HOST`、`PLAYWRIGHT_PORT`：E2E 測試伺服器位置。

BPM、拍號、主題等使用者偏好屬產品狀態，保存在 localStorage，不由環境變數控制。

## 靜態部署

執行 `pnpm generate` 後，部署 `.output/public`。GitHub Pages 子路徑可透過 `NUXT_APP_BASE_URL=/music-coach/` 產生。

部署後至少確認：

1. 網站以 HTTP 或 HTTPS 開啟。
2. `_nuxt/` 靜態資源沒有 404。
3. 子路徑部署的 base URL 正確。
4. 瀏覽器允許使用 Web Audio API。

## 本機資料

使用者設定儲存在瀏覽器 localStorage，不會上傳至伺服器：

- `chordcraft-progression`
- `chordroom-practice`
- `chordroom-theme`
- `chordroom-guitar-theme`

清除網站資料或使用不同瀏覽器、不同網域時，原有設定不會自動同步。

## 維護與貢獻

自動化開發代理及維護者在修改專案前，請先閱讀 [AGENTS.md](./AGENTS.md)。其中記錄模組責任、架構邊界、相容性要求、驗證原則及 Git 規範。
