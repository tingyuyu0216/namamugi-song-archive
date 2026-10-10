# ナマムギ Song Archive

靜態歌曲網站，網站本身不需要 Node.js、資料庫或建置。

- `index.html`：頁面結構
- `styles.css`：樣式
- `app.js`：搜尋、分類、分頁及隨機推薦
- `songs.json`：歌曲資料
- `scripts/import_songs.py`：Excel 驗證與匯入

## 啟動網站

在專案根目錄執行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

請透過 HTTP 伺服器開啟頁面；直接雙擊 HTML 可能無法讀取 JSON。
部署時，請一併部署 `index.html`、`styles.css`、`app.js`、`songs.json`，例如使用 GitHub Pages。

## 從 Excel 新增或更新歌曲

第一次先安裝匯入工具相依套件：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

沿用 `NAMAMUGI歌單.xlsx` 的欄位名稱，第一列為標題：

| Excel 欄位 | 用途 | 必填 |
| --- | --- | --- |
| `title` | 曲名 | 是 |
| `artist` | 歌手 | 是 |
| `title_en` | 英文曲名 | 否 |
| `title_zh` | 中文曲名 | 否 |
| `instagram_url` | HTTPS Instagram 貼文連結 | 是 |
| `post_date` | Excel 日期或 YYYY-MM-DD | 否 |
| `source_work` | 作品名稱 | 否 |

先預覽，再寫入：

```bash
.venv/bin/python scripts/import_songs.py "歌單.xlsx" --dry-run
.venv/bin/python scripts/import_songs.py "歌單.xlsx"
```

預設讀取第一張工作表，可用 `--sheet "工作表1"` 指定。依 Instagram 貼文連結識別歌曲：新連結新增、相同連結更新。既有歌曲不會因為未出現在 Excel 裡而被刪除。同一首歌的不同貼文可以分別保留。

Excel 未提供的欄位會保留原資料；有提供欄位但儲存格空白時，會清除該欄位。Excel 內重複貼文、無效日期、缺少必要資料或公式會中止匯入，不會改寫歌單。工具不執行儲存格中的指令或公式。

你也可以在 Codex 對話上傳 Excel，要求使用這個工具匯入。這不等於在公開網站上傳檔案：公開網站沒有管理後台，匯入後仍須提交並部署更新的 `songs.json`。

## 驗證

```bash
.venv/bin/python -m unittest discover -s tests -v
```

網站可在 Chromium 等瀏覽器驗證歌手分類、作品分類、中日英搜尋、分頁、投稿順序及隨機歌曲。
