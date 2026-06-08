# 图书馆座位管理系统

本项目是《信息系统分析与设计》课程设计项目，目标是实现一个完整但简单的图书馆座位预约与管理系统，采用前后端分离架构。

## 项目简介

系统支持普通用户预约座位、签到、暂离、返回、释放座位和查看个人学习报告；管理员可以管理座位、查看统计数据、管理用户、处理违约记录，并配置开放时间规则。

## 技术栈

前端：

- React
- Vite
- Axios
- Ant Design
- ECharts

后端：

- Python 3
- Flask
- Flask-CORS
- Flask-SQLAlchemy

数据库：

- SQLite

## 项目结构

```text
backend/
  controller/
  service/
  dao/
  model/
  utils/
  app.py
  init_db.py
  reset_db.py

frontend/
  src/
  package.json
```

## 实际项目类图

当前代码对应的实际项目类图已整理在：

[docs/actual-class-diagram.md](docs/actual-class-diagram.md)

该文档包含：

- 分层类图
- 实体类图
- 页面与接口对应关系图

## 数据库初始化命令

首次运行、修改模型后、或需要恢复演示数据时执行：

```powershell
cd /d "当前目录\backend"
.\.venv\Scripts\python.exe reset_db.py
```

初始化后会生成：

- 1 个默认普通用户
- 1 个默认管理员
- 30 个座位
- 若干预约记录
- 若干学习记录
- 若干违约记录

## 后端启动命令

```powershell
cd /d "当前目录\backend"
.\.venv\Scripts\python.exe app.py
```

后端地址：

```text
http://127.0.0.1:5000
```

## 前端启动命令

PS 的 npm 可能有执行策略限制，建议使用 cmd 的 npm：

```powershell
cd /d "当前目录\frontend"
cmd /c npm run dev
```

前端地址：

```text
http://127.0.0.1:5173
```

## 默认测试账号

普通用户：

```text
用户名：student
密码：123456
```

管理员：

```text
用户名：admin
密码：admin123
```

额外演示用户：

```text
student2 / 123456
student3 / 123456
student4 / 123456
```

## 座位编号对应图

演示数据中的座位编号规则：

```text
Area A：A-001 至 A-010
Area B：B-001 至 B-010
Area C：C-001 至 C-010
```

前端“座位地图”页面中也提供了“座位编号对应图”，说明座位区域、排号和列号的对应关系。

## 核心演示流程

1. 使用 `student / 123456` 登录。
2. 打开“座位地图”，查看座位状态和座位编号对应图。
3. 点击空闲座位，选择当天预约开始时间和结束时间。
4. 进入“我的预约”，在预约开始前 5 分钟内或开始后进行签到。
5. 进入“当前座位”。
6. 点击“暂离”。
7. 点击“返回座位”。
8. 点击“释放座位”。
9. 打开“学习报告”，查看个人学习统计。
10. 使用 `admin / admin123` 登录。
11. 打开“管理统计”，查看系统统计数据。
12. 打开“座位管理”，新增、编辑、启用、停用或删除座位。
13. 打开“用户管理”，封禁或解封普通用户。
14. 打开“违约管理”，将违约记录标记为已处理。
15. 打开“开放时间”，修改开放规则或手动检查超时。

关闭项目时建议先关闭前端，再关闭后端。
