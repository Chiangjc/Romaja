# 韓文羅馬拼音輸入法

用英文鍵盤打出來的羅馬拼音，自動轉成韓文——不用背두벌식鍵盤位置。

```
annyeonghaseyo jeoneun haksaengibnida
        ↓
    안녕하세요 저는 학생입니다
```

完整的產品規劃、設計決策、演算法細節見 [claude.md](claude.md)；上線與擴展規劃見 [plan.md](plan.md)。

## 現況

- **Phase 1 引擎**：完成。字母對照表、Hangul 組字器、Parser、排序規則。全域對拍 11,172 個音節 round-trip 全過，黃金測試集正確率約 77%。
- **Phase 2 InputState**：完成。候選列（↓／數字鍵切換）、連字號與大寫字母強制切法、點擊已確定的詞重選候選。
- **Phase 3 前端**：完成。中文為主、英文為輔（`/` 與 `/en/`）兩個語言版本，桌機與手機排版皆可用。
- **鼻音化猜測**：小範圍支援照發音打的常見情況（例如 `hamnida` 也能找到 `합니다`）。

已知限制：預設正確率約八成，遇到轉錯的字要用候選列手動挑；只支援桌機鍵盤輸入，不保證手機觸控輸入體驗。詳見 [claude.md 第 5 節](claude.md#5-已知限制)。

## 套件結構

```
packages/
  engine/        羅馬字 ↔ 韓文核心轉換邏輯，純函式、不依賴 UI
  input-state/   組字狀態機（候選、鍵位、連字號），包裝 engine
  web/           前端頁面（Vite + TypeScript，中/英雙語）
```

`engine` 與 `input-state` 各自獨立可測試，`web` 是目前唯一的介面層，之後要換框架或包 Chrome 擴充功能都不需要動前兩層。

## 開發

```bash
pnpm install

# 跑全部測試
pnpm -r test

# 啟動前端開發伺服器
pnpm --filter @romanization/web dev

# 命令列互動試打（不用開瀏覽器）
pnpm --filter @romanization/engine try
```

## 授權

尚未決定，上線前會補上（建議 MIT，見 [plan.md](plan.md) 上線檢查清單）。
