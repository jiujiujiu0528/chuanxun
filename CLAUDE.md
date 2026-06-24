# 传讯 · 新篇章 - 开发文档

## 项目概述
情侣向全栈前端应用。纯 HTML/CSS/JS + localStorage，单页多视图架构。

## 文件结构
```
index.html          — 主HTML，所有视图div + 脚本引用
css/main.css        — 全部样式
js/
  config.js         — 常量 & DEFAULT_SETTINGS
  utils.js          — showNotification, escapeHtml, cropImageToSquare, showModal/hideModal
  view-manager.js   — showView(viewId), goBack(), bindBackButtons()
  app.js            — 主入口 DOMContentLoaded，全局变量，throttledSaveData, loadData, generateHomeGrid
  chat.js           — 聊天核心：messages, renderMessages, sendMessage, addMessage, 分页, 引用回复, 收藏, 批量, 音效, 表情互动, 视频通话
  replies.js        — 回复库：字卡/分组, 拍一拍, 状态, 格言, 开场动画, 表情包(myStickers/partnerStickers)
  multi-session.js  — 多会话管理：创建/切换/删除会话，独立消息存储
  daily-greeting.js — 每日公告：日期/心情/天气/字卡/签到/天数统计
  mood-calendar.js  — 心情日历：月历视图，对方心情自动生成，我方心情选择
  checkin.js        — 报备：双人时间轴，活动库管理，时间感知随机活动
  anniversaries.js  — 重要日：倒数日/正数日，主视图网格展示
  draw-board.js     — 图画板：随机生成 + 手绘模式，Canvas绘制
  ai-settings.js    — 场外援助设置：API Key/地址/模型/提示词/占卜解牌提示词
  ai-chat.js        — 场外援助对话：DeepSeek API，打字机效果，上下文管理
  gomoku.js         — 五子棋：Canvas 15×15，AI对手（白方），悔棋，状态保存
  memory-game.js    — 翻牌记忆：4×3/4×4/4×6，3D翻转动画，计时+步数
  fortune.js        — 占卜：雷诺曼36张 + 塔罗78张，图标装饰，AI辅助解牌
  appearance.js     — 外观主题：配色/深色/字体/聊天背景/主视图背景/图标外观/图标框/头像框/唱片装饰/素材库
  chat-settings.js  — 聊天设置：回复速度/已读回执/已读不回/连发条数/主动发送等
  data-manager.js   — 数据管理：全量备份/回复库导入导出/按日期导出
  music.js, sound-settings.js, custom-settings.js, other-settings.js
  sleep.js, whisper.js, envelope.js, decision.js, stats.js
```

## 存储键一览
| Key | 内容 |
|-----|------|
| chat_messages_{sessionId} | 各会话消息 |
| chat_sessions | 会话列表 |
| chat_active_session | 当前活跃会话ID |
| chat_settings | 聊天设置 |
| custom_replies | 回复库(含myStickers/partnerStickers) |
| daily_greeting_data | 每日公告 |
| mood_calendar_data | 心情日历 |
| checkin_data / checkin_activities | 报备数据/活动库 |
| anniversaries_data | 重要日 |
| ai_settings / ai_chat_messages | AI设置/对话 |
| gomoku_state | 五子棋状态 |
| home_custom_bg / chat_background | 主视图/聊天背景 |
| icon_radius / opacity / border / border_color | 图标外观 |
| icon_frame / avatar_frame_my / avatar_frame_partner | 图标框/头像框 |
| record_preset / record_custom | 唱片装饰 |
| custom_materials | 素材库 |
| splash_image / avatar_my / avatar_partner | 启动图/头像 |
| app_theme / dark_mode / font_size / bubble_style | 外观设置 |
| sound_enabled / sound_volume / sound_preset_* | 音效 |
| songList / playMode / musicVolume / musicCover | 音乐 |
| sleep_history / whisper_* / envelope_* | 睡眠/碎碎念/信封 |

## 架构模式
- 新增视图：HTML view div → CSS → JS模块 → `<script>`标签 → `app.js`中`generateHomeGrid()`加网格项 + `init*()`调用
- 视图切换：`showView(viewId)` (view-manager.js)
- 通知：`showNotification(msg, type, duration)`
- 模态框：`showModal(el)` / `hideModal(el)`
- localStorage：直接读写，JSON序列化

## 最近完成的功能（本轮对话）
- 对方输入中指示器持久化（独立元素，不受renderMessages影响）
- 拍一拍→表情互动面板（表情包+拍一拍预设+自定义）
- 让对方继续说加入延迟和输入提示
- 视频通话（CSS动画模拟，来电/接听/挂断/超时/计时/最小化悬浮窗）
- 聊天设置：对方连发最大条数（1-10）
- 涂鸦板手绘模式（鼠标/触摸绘制，颜色/画笔/橡皮/清除）
- 雷诺曼卡片装饰图标（36个emoji）
- 占卜AI解牌接入（DeepSeek API，一次性无记忆）
- 五子棋（15×15 Canvas，AI对手，悔棋）
- 翻牌记忆（emoji配对，3D翻转，3档难度）
- 聊天背景修复（chat-container透明+毛玻璃气泡）
- 图标外观自定义（圆角/透明度/边框粗细/边框颜色）
- 图标框+头像框（上传自定义装饰图包裹）
- 唱片装饰（5个CSS预设+自定义上传，播放时旋转）
- 素材库（上传管理自定义装饰素材）
- 主视图背景可在外观设置中更换
- AI助手→场外援助重命名
- AI打字机效果（逐字显示+闪烁光标）
- 去除重复多会话入口

## 用户偏好
- 素材图建议尺寸：框类150px↑，背景类1000px，唱片200×200px
- 唱片预设图圆心必须在正中央（circle at 50% 50%）
