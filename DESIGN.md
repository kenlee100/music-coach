---
version: alpha
name: Chordroom
description: 現有吉他練習室介面的設計規範；深色為預設主題，亮色與指板材質為獨立變體。
colors:
  primary: "#60a5fa"
  secondary: "#a78bfa"
  dark-primary-hover: "#93c5fd"
  dark-page: "#0b1020"
  dark-surface: "#111a2d"
  dark-surface-raised: "#17223a"
  dark-surface-control: "#202d49"
  dark-text: "#f5f7ff"
  dark-text-muted: "#aab6cc"
  dark-border: "#344463"
  dark-border-strong: "#607397"
  dark-action-text: "#0b1020"
  dark-note-text: "#07111f"
  dark-secondary-text: "#111827"
  dark-focus: "#22d3ee"
  dark-hero-text: "#dbe5f6"
  dark-soft-fill: "rgba(96, 165, 250, 0.1)"
  dark-card: "#0e1729"
  dark-field: "#0c1426"
  dark-sequence: "#080e1c"
  dark-paper: "#eef3ff"
  dark-note-root: "color-mix(in srgb, #60a5fa 82%, white)"
  dark-note-tone: "color-mix(in srgb, #a78bfa 78%, white)"
  dark-note-ring: "color-mix(in srgb, #60a5fa 72%, white)"
  dark-inactive-note: "#cbd5e1"
  dark-inactive-note-text: "#475569"
  dark-search-placeholder: "#77746d"
  dark-chord-card-fill: "#ffffff05"
  light-primary: "#2563eb"
  light-primary-hover: "#1d4ed8"
  light-secondary: "#7c3aed"
  light-page: "#f6f8fc"
  light-surface: "#ffffff"
  light-surface-raised: "#edf2fa"
  light-surface-control: "#e2e9f5"
  light-text: "#111827"
  light-text-muted: "#59657a"
  light-border: "#cbd5e1"
  light-border-strong: "#8796b1"
  light-action-text: "#f8faff"
  light-secondary-text: "#ffffff"
  light-focus: "#0891b2"
  light-hero-text: "#334155"
  light-soft-fill: "rgba(37, 99, 235, 0.09)"
  light-card: "#f4f7fc"
  light-field: "#f8faff"
  light-sequence: "#e8eef8"
  light-paper: "#18233a"
  light-note-root: "#1d4ed8"
  light-note-tone: "#6d28d9"
  light-note-ring: "#b7d0ff"
  light-inactive-note: "#d8dee9"
  light-inactive-note-text: "#475569"
  light-search-placeholder: "#77746d"
  light-chord-card-fill: "#ffffff05"
typography:
  hero-title-min:
    fontFamily: Fraunces
    fontSize: 58px
    fontWeight: 700
    lineHeight: 0.81
    letterSpacing: -0.076em
  panel-title:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: 600
  body:
    fontFamily: Noto Sans TC
    fontSize: 16px
    fontWeight: 400
  body-small:
    fontFamily: Noto Sans TC
    fontSize: 14px
    fontWeight: 400
  technical-label:
    fontFamily: DM Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.3
  note:
    fontFamily: DM Mono
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
rounded:
  none: 0px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
components:
  panel-dark:
    backgroundColor: "{colors.dark-surface}"
    rounded: "{rounded.none}"
  panel-light:
    backgroundColor: "{colors.light-surface}"
    rounded: "{rounded.none}"
  button-primary-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.dark-action-text}"
    rounded: "{rounded.none}"
    height: 46px
  button-primary-light:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.light-action-text}"
    rounded: "{rounded.none}"
    height: 46px
  button-secondary-dark:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.dark-secondary-text}"
    rounded: "{rounded.none}"
  button-secondary-light:
    backgroundColor: "{colors.light-secondary}"
    textColor: "{colors.light-secondary-text}"
    rounded: "{rounded.none}"
  note-root-dark:
    backgroundColor: "{colors.dark-note-root}"
    textColor: "{colors.dark-note-text}"
    size: 34px
  note-root-light:
    backgroundColor: "{colors.light-note-root}"
    textColor: "{colors.light-secondary-text}"
    size: 34px
  note-tone-dark:
    backgroundColor: "{colors.dark-note-tone}"
    textColor: "{colors.dark-secondary-text}"
    size: 34px
  note-tone-light:
    backgroundColor: "{colors.light-note-tone}"
    textColor: "{colors.light-secondary-text}"
    size: 34px
---

## Overview

Chordroom 是用於搜尋和弦、閱讀吉他指板、試聽與節拍練習的單頁工具。視覺語言採深色控制台、鮮明的藍色根音與紫色組成音，並提供既有的亮色主題。`DESIGN.md` 的 token 是規範值；[`styles.css`](./styles.css) 是瀏覽器實際執行值。修改風格時須同步更新兩者，不應只改文件或只改 CSS。

## Colors

- YAML `colors` 使用平面名稱：未加前綴的 `primary`、`secondary` 是預設深色主題；`dark-*`、`light-*` 分別對應 CSS 的 `:root[data-theme="dark"]`、`:root[data-theme="light"]`。目前 CSS 的 `--bg`、`--surface`、`--surface-2`、`--surface-3`、`--ink`、`--muted`、`--line`、`--line-strong`、`--primary`、`--secondary`、`--focus` 即為這些語意角色的執行時別名。
- `--panel-bg`／`--panel-border`、`--control-bg`／`--control-border`／`--control-text`、`--action-bg`／`--action-text`、`--selected-bg`／`--selected-text` 是跨元件角色，透過目前主題變數解析。面板、選單、主要操作與選取狀態應使用角色，不直接指定單一主題的顏色。
- `--note-root-bg`、`--note-tone-bg`、`--note-root-ring` 與對應文字色維持各主題自己的對比；根音和組成音還有不同邊框／外圈，不以顏色作為唯一辨識方式。既有色值原樣保留，日後若變更配色，兩種主題均須重新檢查對比。
- `--search-placeholder`、`--chord-card-fill` 仍維持目前畫面值。指板木紋、金屬琴格、六條琴弦的材質色是指板專屬，不是一般介面色盤。

## Typography

- Fraunces 用於大標題、和弦名稱及卡片標題；Noto Sans TC 用於敘述；DM Mono 用於技術標籤、數值、指板音名。實際字體堆疊在 CSS `--display`、`--body`、`--mono`，字體載入設定在 [`index.html`](./index.html)。
- 頁面基準內文字級為 16px。共用字級 `--font-size-caption`、`--font-size-small`、`--font-size-detail`、`--font-size-body` 分別為 11、12、13、14px；不得將既有小於 11px 的字級帶回。YAML 的 `hero-title-min` 是大型標題的最小值；實際 `clamp()` 與特定標題大小仍保留元件規則，以免破壞響應式排版。
- 指板音符固定為 34px 圓點與 14px 字，六弦標籤及琴格號碼維持現有字級。不要以全域 `button` 或 `small` 規則覆蓋它們。

## Layout

- CSS `--space-1`／`--space-2`／`--space-3`／`--space-4`／`--space-6`／`--space-8` 對應 YAML 的 `xs`／`sm`／`md`／`lg`／`xl`／`xxl`。只有跨元件反覆使用的距離進入共用級距；指板音符、琴格或裝飾的定位值留在元件內。
- 桌面工作區為左側和弦選單、右側指板。左側與右側等高，清單填滿剩餘高度且可獨立捲動；900px 以下改為上下排列並維持 260px 清單；600px 以下清單單欄。
- 指板維持六弦、1–22 格、上方高音 E 到下方低音 E。弦粗、格距、44px 弦名欄及 1144px 最小寬度屬樂器幾何，不納入全站 spacing token。

## Elevation & Depth

主內容以表面色與細邊框建立層次，焦點使用主題 `--focus` 與共用 `--focus-width`。指板木紋、內陰影與弦線高光只用於樂器示意，不套到一般卡片。共用動態時間為 `--motion-fast`、`--motion-medium`、`--motion-theme`、`--motion-toast`；`prefers-reduced-motion` 仍停用非必要過渡。

## Shapes

一般面板、按鈕與選單維持方角。圓形僅用於音符、弦圖例、琴格標記與背景裝飾，CSS 使用 `--radius-round`；YAML 的 `rounded.full` 是同一造型意圖，不要求將每個圓形改成 9999px。線寬與控制項基本高度由 `--border-width`、`--control-height` 提供。

## Components

- `panel-*` 對應和弦、指板與行進三個主要面板；`button-primary-*` 對應「加入行進」及播放行進等主要操作；`button-secondary-*` 對應播放和弦與已選取的節拍控制。`dark`／`light` 是主題變體，不是新的操作模式。
- `note-root-*`、`note-tone-*` 對應指板根音與組成音；`sounding`、`hinted` 是播放與預覽狀態，必須保留既有可辨識的圈線與鍵盤焦點。和弦卡片、預設行進、拖曳目標的 `active`、`playing`、`dragging`、`drop-target` 也都是既有互動掛點，不得只更名 CSS 而漏掉 JS 建立的節點。
- 網站主題由根元素 `data-theme` 控制，指板材質由指板上的 `.acoustic` 控制，兩者各自儲存；改動其中一者不得重置另一者。瀏覽器工具列用的 `theme-color` 在 CSS 載入前設定，須與頁面背景 token 同步。

## Do's and Don'ts

- 使用共用語意與元件角色 token 設計新元件，並同步更新文件與 CSS；保留必要的結構／狀態 selector，不為「零 class」犧牲語意或可維護性。
- 不把木紋、琴格、弦粗或 22 格比例當作全站 spacing／border token；不修改已確認的 34px／14px 指板音符尺寸。
- 修改色彩或互動狀態時，同時檢查深／淺色與電／木吉他組合、文字對比、焦點、桌面與窄螢幕版面。不要以 CSS 靜態檢查取代瀏覽器操作驗證。
