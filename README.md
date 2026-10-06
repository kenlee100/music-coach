# Chordroom

Chordroom 是一個以瀏覽器原生 HTML、CSS、JavaScript 與 Web Audio API 製作的吉他和弦練習工具。它提供和弦查詢、吉他指板定位、相容音階、和弦行進與節拍器練習。

## 專案特色

- 標準調弦吉他指板，顯示第 1–22 格。
- 和弦組成音、相容音階及常用指型提示。
- 電吉他與木吉他指板配色。
- 跟隨系統、淺色及深色主題。
- 40–240 BPM、3/4 與 4/4 拍號。
- 四分、八分、十六分及 Swing 節奏。
- 預備拍、獨立節拍器、和弦行進及循環播放。
- 將練習設定與和弦行進保存在目前瀏覽器。
- 匯出和弦行進為純文字檔。

完整操作方式請參閱 [USAGE.md](./USAGE.md)。

## 技術架構

本專案使用瀏覽器原生 ES Modules，不需要 Vite、React、Vue、npm 安裝或建置步驟。

主要模組：

- `app.js`：啟動、狀態與事件協調。
- `theory.js`：和弦、音階、指型與樂理資料。
- `audio-engine.js`：Web Audio 聲音產生。
- `transport.js`：節拍器、預備拍與行進排程。
- `storage.js`：瀏覽器儲存、驗證與資料遷移。
- `views.js`：介面渲染。
- `styles.css`：主題、元件與響應式樣式。

## 環境需求

- 支援 ES Modules 與 Web Audio API 的現代瀏覽器。
- 任一個本機 HTTP 靜態伺服器。
- 若採用下方預設啟動方式，需要 Python 3。

> 原生 ES Modules 應透過 HTTP 開啟。不要直接雙擊 `index.html` 或使用 `file://` 網址。

## 啟動專案

在專案根目錄執行：

```bash
python3 -m http.server 4173
```

接著用瀏覽器開啟：

```text
http://127.0.0.1:4173/
```

停止伺服器時，在執行指令的終端機按下 `Control + C`。

### 使用其他靜態伺服器

如果電腦已有其他靜態伺服器，也可以直接使用；網站根目錄必須指向本專案，且需以 HTTP 提供 `.js` 模組。

本專案目前沒有 `package.json`，不需要執行 `npm install`、`npm run dev` 或 `npm run build`。

## 靜態部署

可將專案檔案直接部署至 GitHub Pages 或一般靜態網站主機。請保留目前的相對路徑與所有 JavaScript 模組，不需要產生 `dist`。

部署後至少確認：

1. 網站以 HTTP 或 HTTPS 開啟。
2. `app.js` 與其相依模組沒有 404。
3. 伺服器以 JavaScript MIME type 提供 `.js` 檔案。
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
