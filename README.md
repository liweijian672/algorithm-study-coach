# 算法学习教练

面向牛客平台 C++ 刷题用户的学习效率工具。浏览器插件自动记录你的提交过程，本地后端根据刷题历史计算各算法知识点的掌握度，看板给出薄弱点诊断、题目推荐，并为单道题提供讲解、渐进提示和多解 C++ 代码。

## 一键启动

双击根目录的 `start.bat`，脚本会：

1. 检查 Python 与 Node.js。
2. 按需安装后端、看板、扩展依赖。
3. 构建浏览器扩展到 `extension/dist`。
4. 启动后端和看板。
5. 打开看板页面。

## 手动启动

### 后端

```powershell
cd backend
python -m pip install -e ".[dev]"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

后端默认监听 `http://localhost:8000`，数据保存在 `backend/coach.db`。

### 看板

```powershell
cd dashboard
npm install
npm run dev
```

浏览器打开 Vite 输出的地址，通常为 `http://localhost:5173`。

### 浏览器扩展

1. 在 `extension` 目录运行 `npm install`。
2. 运行 `npm run build`，生成 `extension/dist`。
3. 打开 Chrome 或 Edge 的扩展管理页。
4. 开启开发者模式，选择“加载已解压的扩展程序”。
5. 选择 `extension/dist` 目录。
6. 在牛客题目页完成提交后，点击扩展图标，选择“同步到看板”。

## 配置大模型

在 `backend/.env` 中配置 OpenAI 兼容接口，本项目默认使用 DeepSeek：

```text
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=your-deepseek-api-key
LLM_MODEL=deepseek-chat
```

可以复制 `backend/.env.example` 为 `backend/.env` 后填入真实 Key。未配置时看板仍可运行，但讲解、提示和多解内容会返回占位内容。

## 配置后端地址

- 看板：复制 `dashboard/.env.example` 为 `dashboard/.env`，修改 `VITE_API_BASE_URL`。
- 扩展：点击扩展图标，在“后端地址”输入框中填写并保存。

## 演示流程

如果还没有刷题历史，可以先在看板点击“导入演示数据”，写入一组包含题目、知识点和提交记录的样本数据，然后：

1. 看板首页展示各知识点掌握度图。
2. “薄弱知识点”列出掌握度最低的方向。
3. “推荐题目”给出下一步练习建议。
4. 点击某道题进入讲解页，查看讲解、提示和多解 C++ 代码。

## 项目结构

- `backend/`：FastAPI 后端，使用 SQLite 保存数据。
- `extension/`：Chrome/Edge 浏览器扩展，抓取牛客页面并提交到本地。
- `dashboard/`：React 看板，展示掌握度和学习建议。
- `outputs/`：作品说明、演示脚本和路演 PPT。

## 测试与构建

```powershell
python -m pytest backend/tests -v
cd extension; npm test -- --run; npm run build
cd dashboard; npm test -- --run; npm run build
```
