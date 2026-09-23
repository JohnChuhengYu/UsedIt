# UsedIt 服务启动与数据库配置完全指南

本指南详细说明 UsedIt 的各个服务组件（后端 API、数据库、AI 本地大模型、前端）的启动方式与工作原理。

> 🧠 **想深入了解向量数据库与 AI 核心技术？** 
> 请参阅深度解析文档：[**docs/BACKEND_AND_AI_TECH_CN.md**](./BACKEND_AND_AI_TECH_CN.md)（英文原版：[English Doc](./BACKEND_AND_AI_TECH.md)），全面剖析 ChromaDB 原理、RAG 造句改写、双温度解耦、防偏见标定与级联评判管线。

---

## 🧭 服务与架构总览

在启动之前，请先了解各组件的运行方式与端口：

| 服务组件 | 类型 | 端口 / 存放路径 | 是否需要单独启动？ | 启动命令 / 机制 |
| :--- | :--- | :--- | :--- | :--- |
| **FastAPI 后端** | Web API 框架 | `http://localhost:8000` | **需要** | `./venv/bin/uvicorn app.main:app --reload --port 8000` |
| **SQLite 数据库** | 关系型关系数据库 | 文件：`backend/data/dev.db` | ❌ **无需单独启动** | **随后端启动自动创建并初始化** |
| **ChromaDB** | 向量数据库 | 本地目录：`backend/data/` | ❌ **无需单独启动** | 嵌入式 Python 库，在后端进程内直接运行 |
| **Ollama (LLM)** | 本地大模型服务 | `http://localhost:11434` | **需要** | `ollama run llama3.1:8b` |
| **React 前端** | Web SPA 界面 | `http://localhost:5173` | **需要** | `cd frontend && npm run dev` |

---

## 💡 关于数据库启动的常见疑问（重点）

> **为什么找不到数据库启动命令？数据库到底怎么启动？**

1. **关系型数据库 (SQLite)**：
   - 本项目使用轻量、自包含的 **SQLite**（配合 SQLModel / SQLAlchemy ORM）。
   - 它**不是**像 MySQL 或 PostgreSQL 那样的独立常驻后台进程，**不需要** `brew services start`、Docker 容器或启动外部 DB 守护进程。
   - **自动初始化**：当你启动 FastAPI 后端（`uvicorn app.main:app`）时，系统生命周期钩子（`lifespan`）会自动调用 `create_db_and_tables()`：
     - 若 `backend/data/dev.db` 不存在，会自动创建该数据库文件；
     - 自动依据模型定义创建所有的表结构（`User`, `Dictionary`, `UserWord`, `PracticeSession` 等）。

2. **向量数据库 (ChromaDB)**：
   - 同样采用**嵌入式模式 (Embedded Mode)** 运行在 Python 进程中，数据直接持久化保存在本地 `backend/data/chroma_db/` 目录；
   - 同样**无需**启动任何独立的向量数据库服务。

---

## 🚀 完整启动步骤 (Step-by-Step)

推荐按以下顺序启动各服务：

### 第一步：启动本地大模型 (Ollama)

UsedIt 依赖本地 Ollama 提供动态例句生成与批改反馈：

1. 确保已安装 [Ollama](https://ollama.com/)。
2. 在终端启动并加载默认的 Llama 3.1 8B 模型：
   ```bash
   ollama run llama3.1:8b
   ```
   *提示：如果后台已常驻 `ollama serve`，该命令会直接连接并就绪。*
3. 验证 Ollama 运行状态：
   ```bash
   curl http://localhost:11434/api/tags
   ```

---

### 第二步：配置并启动后端与数据库 (Backend)

进入 `backend` 目录：

```bash
cd backend
```

#### 1. 创建并激活虚拟环境

- **macOS / Linux**:
  ```bash
  # 如果尚未创建虚拟环境
  python3 -m venv venv
  
  # 激活虚拟环境
  source venv/bin/activate
  ```

- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```

- **Windows (CMD)**:
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```

#### 2. 安装依赖

确保虚拟环境已激活，安装所需第三方库：
```bash
pip install -r requirements.txt
```

#### 3. 环境变量配置 (`.env`)

可以直接复制预设模板文件生成 `.env`：
```bash
cp .env.example .env
```

`backend/.env` 包含以下核心配置项：
```env
# 允许跨域的前端地址
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Ollama 本地推理服务
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# 安全密钥（JWT 签名和 Session 必须配置）
SESSION_SECRET=usedit_session_dev_secret_key_change_in_production
JWT_SECRET_KEY=usedit_jwt_dev_secret_key_change_in_production

# 可选：Google OAuth 登录（如不使用 Google 登录可留空）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

#### 4. 启动 FastAPI 后端服务

使用 `uvicorn` 启动服务器（`--reload` 开启代码修改热重载）：

```bash
# 方式 A：已激活 venv 时
uvicorn app.main:app --reload --port 8000

# 方式 B：未激活 venv 时直接通过虚拟环境路径执行（推荐，绝对不会报错）
./venv/bin/uvicorn app.main:app --reload --port 8000
# Windows 对应: .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

#### 5. 验证后端与数据库状态

启动成功后，控制台会输出：
```text
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```
- **API 根路径**：[http://localhost:8000/](http://localhost:8000/)（返回 `{"message": "UsedIt API is running", "docs": "/docs"}`）
- **Swagger 交互式文档**：[http://localhost:8000/docs](http://localhost:8000/docs)
- **数据库文件**：此时检查 `backend/data/` 目录，可以看到 `dev.db` 已自动生成。

---

### 第三步：启动前端 (Frontend)

新开一个终端窗口，进入 `frontend` 目录：

```bash
cd frontend

# 1. 复制前端环境变量（指定后端 API 请求地址）
cp .env.example .env

# 2. 安装前端依赖（首次运行需要）
npm install

# 3. 启动 Vite 开发服务器
npm run dev
```

启动完成后，终端会显示前端访问地址：
- 浏览器打开：👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🏛️ 核心数据架构与设计理念

本项目采用创新的 **“全局词典共享 + 个人学习状态隔离”** 两级数据模型设计：

```text
[Dictionary (全局词典条目)] ── (1:N) ── [UserWord (用户词条关联)]
  - 单词全量元数据（仅存一份）               - user_id (所属用户)
  - 释义、音标、发音音频                      - status (NEW / PRACTICING / MASTERED)
  - 难度分级、词源、助记口诀                  - 学习时间戳
  - 近义词、反义词、语调情感                        │ (1:N)
                                             ▼
                                    [PracticeSession (练习记录)]
                                      - 生成的语境情景 (Scene)
                                      - 用户输入的造句
                                      - AI 判卷反馈与错误纠正
                                      - 是否通过 (passed: true/false)
```

1. **`User` (用户表)**：支持常规账号密码注册登录以及 Google OAuth 第三方登录，记录用户的批改严格程度偏好 (`grading_strictness`: `Lenient` / `Normal` / `Strict`)。
2. **`Dictionary` (词典库)**：同一个英文单词在全库仅保留一条记录。首次被任何用户添加时，后端通过内置逻辑与词典库完成自动丰富（Enrichment），后续其他用户学习该词直接复用，极大节约存储与算力。
3. **`UserWord` (学习记录表)**：保存用户个人的学习进度状态，支持轻量列表高效分页。
4. **`PracticeSession` (会话日志)**：完整归档用户的每次造句互动与 AI 教师给出的批改理由。

---

## 📡 后端 API 接口速查

启动后端后可直接在 **[http://localhost:8000/docs](http://localhost:8000/docs)** 体验全部接口：

| 模块 | 方法 | 端点 | 认证要求 | 功能描述 |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | 无 | 用户名密码注册新账号 |
| | `POST` | `/auth/login` | 无 | 登录获取 JWT Access Token |
| | `GET` | `/auth/me` | Bearer Token | 获取当前登录用户的个人信息及设置 |
| | `PATCH` | `/auth/me` | Bearer Token | 更新批改严格度设置 (`Lenient`/`Normal`/`Strict`) |
| | `GET` | `/auth/google` | 无 | 发起 Google OAuth 授权跳转 |
| **Words** | `GET` | `/words` | Bearer Token | 分页获取当前用户的单词列表（支持按状态筛选） |
| | `POST` | `/words` | Bearer Token | 添加新单词（自动触发 Dictionary 条目丰富） |
| | `GET` | `/words/stats` | Bearer Token | 获取掌握/练习中/新词的统计数字 |
| | `GET` | `/words/{id}` | Bearer Token | 获取单词全量详情（释义、词源、搭配例句、历史练习） |
| | `DELETE` | `/words/{id}` | Bearer Token | 从用户词表中移除该词（保留全局 Dictionary） |
| **Practice** | `GET` | `/practice/{word_id}/scene` | Bearer Token | 结合 ChromaDB 真实语料与 Ollama 动态生成真实交际场景 |
| | `POST` | `/practice/{word_id}/judge` | Bearer Token | 对用户提交的造句进行语法、语义与地道度双重智能评判 |
| **Sessions** | `GET` | `/sessions` | Bearer Token | 列出当前用户所有的历史造句与 AI 反馈记录 |
| | `POST` | `/sessions` | Bearer Token | 保存一次完成的练习会话记录 |
| | `GET` | `/sessions/stats` | Bearer Token | 获取练习总数、通过次数及综合正确率 |

---

## 👤 用户注册与登录

1. 打开浏览器进入前端页面 [http://localhost:5173](http://localhost:5173)；
2. 页面默认会展示登录框，点击 **Register**（注册）切换到注册模式；
3. 输入任意你喜欢的用户名和密码（例如 `myuser` / `123456`）即可完成注册并直接登录进入主面板。

---

## 🗄️ 数据库常用运维与重置

### 1. 如何重置数据库？
如果需要清空所有测试数据重新开始：
```bash
# 停止后端服务 (Ctrl + C)
rm backend/data/dev.db

# 重新启动后端服务，表结构会自动重新建好
./backend/venv/bin/uvicorn app.main:app --reload --port 8000
```

### 2. 向量数据库管理脚本
在 `backend/scripts/` 中提供了若干实用工具。

> **⚠️ 注意运行路径与 Python 环境**：
> 如果当前终端已经在 `backend` 目录下，直接使用虚拟环境中的 Python 运行：
> ```bash
> # 方式一（推荐，在 backend 目录下直接使用 venv）：
> ./venv/bin/python scripts/read_chromadb.py
> 
> # 方式二（先激活虚拟环境）：
> source venv/bin/activate
> python scripts/read_chromadb.py
> ```
> 如果当前终端在项目根目录（`UsedIt`），命令则为：
> ```bash
> ./backend/venv/bin/python backend/scripts/read_chromadb.py
> ```

- **查看向量库已收录的例句**：
  ```bash
  ./venv/bin/python scripts/read_chromadb.py
  ```
- **手动测试 ChromaDB 初始化并写入样本**：
  ```bash
  ./venv/bin/python scripts/setup_chroma.py
  ```

---

## ❓ 常见问题排查 (FAQ)

### Q1: 运行 `uvicorn` 提示 `command not found`？
- **原因**：当前终端未激活 Python 虚拟环境，或者全局 Python 没有安装 uvicorn。
- **解决办法**：
  - 执行 `source venv/bin/activate`（Windows: `venv\Scripts\activate`）；
  - 或直接使用完整路径运行：`./venv/bin/uvicorn app.main:app --reload --port 8000`。

### Q2: 提示端口 `8000` 或 `5173` 已被占用？
- **macOS / Linux 排查与释放**：
  ```bash
  # 查看占用 8000 端口的进程
  lsof -i :8000
  # 终止进程
  kill -9 <PID>
  ```
- **或者更换启动端口**：
  ```bash
  uvicorn app.main:app --reload --port 8001
  ```
  *(注：如果修改了后端端口，需同步修改前端 API 请求地址及后端 `.env` 的 CORS 设置)*

### Q3: 练习界面生成例句很慢或报错 500？
- **检查 Ollama 状态**：
  - 确认 Ollama 正在运行：`curl http://localhost:11434`
  - 确认模型已拉取：`ollama list` 是否包含 `llama3.1:8b`。如果缺失，运行 `ollama pull llama3.1:8b`。
