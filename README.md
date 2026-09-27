# 算法学习教练

面向牛客平台 C++ 刷题用户的学习效率工具。浏览器插件自动记录你的提交过程，
本地后端根据刷题历史计算各算法知识点的掌握度，看板给出薄弱点诊断、题目推荐，
并为单道题提供讲解、渐进提示和多解 C++ 代码。

## 项目结构

- `backend/`：FastAPI 后端，使用 SQLite 保存数据。
- `extension/`：Chrome/Edge 浏览器插件，抓取牛客页面并提交本地。
- `dashboard/`：React 看板，展示掌握度和学习建议。

## 环境要求

- Python 3.11 或更高版本。
- Node.js 18 或更高版本。
- Chromium 内核浏览器，例如 Chrome 或 Edge。

## 启动后端

```powershell
python -m pip install -e "backend[dev]"
python -m uvicorn app.main:app --reload --port 8000
```

后端默认监听 `http://localhost:8000`。数据库文件默认在
`backend/coach.db`，已通过 `.gitignore` 忽略。

## 配置大模型

通过环境变量配置 OpenAI 兼容接口。未配置时，看板仍可运行，但讲解和解法会
返回占位内容。

```powershell
$env:LLM_BASE_URL="https://your-provider.example.com/v1"
$env:LLM_API_KEY="your-api-key"
$env:LLM_MODEL="your-model-name"
```

## 启动看板

```powershell
cd dashboard
npm install
npm run dev
```

浏览器打开 Vite 输出的本地地址，通常为 `http://localhost:5173`。

## 加载浏览器插件

1. 在 `extension` 目录运行 `npm install`。
2. 打开 Chrome 或 Edge 的扩展管理页面。
3. 开启开发者模式，选择“加载已解压的扩展程序”。
4. 选择 `extension` 目录。
5. 在牛客题目页完成提交后，点击插件图标并选择“同步到本地看板”。

## 演示流程

如果还没有刷题历史，可以先在看板点击“导入演示数据”，它会写入一组包含题目、
知识点和提交记录的样本数据，然后：

1. 看板首页展示各知识点掌握度图。
2. “薄弱知识点”列出掌握度最低的方向。
3. “推荐题目”给出下一步练习建议。
4. 点击某道题进入讲解页，查看讲解、提示和多解 C++ 代码。

## 测试与构建

```powershell
python -m pytest backend/tests -v
cd extension; npm test -- --run; npm run build
cd dashboard; npm test -- --run; npm run build
```
