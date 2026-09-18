# 日笺 Dayleaf 软件检查报告

检查日期：2026-09-17。对象：3.4.1 当前工作区，包括检查开始时已存在的未提交改动。

## 范围与结论

检查涵盖源码、生产构建、单元测试、Electron UI 测试、浅色/深色/500px 窄窗口截图，以及临时日记上的保存、导入失败、导出、搜索、目录迁移和主题切换实验。未修改产品代码；运行实验使用独立临时数据。没有实际验证 Windows/Linux 安装包、签名发布、系统睡眠恢复、真实跨磁盘迁移和多年大数据性能。

总体判断：基础写作体验已有较好的结构，自动保存失败重试、关闭前保存、弹窗焦点管理等基础机制有效；当前优先事项是数据操作一致性、功能正确性和设计系统收敛，再做视觉精修。

## 检查结果

| 检查                           | 结果                                            |
| ------------------------------ | ----------------------------------------------- |
| Jest                           | 8 个测试套件、30 项测试全部通过                 |
| TypeScript                     | 不通过，UI 测试大量 Playwright matcher 类型错误 |
| TS / CSS lint                  | 通过；ESLint 有一项规则弃用提示                 |
| 格式检查                       | 6 个文件不符合格式配置                          |
| 生产构建                       | 成功，8 项警告，主要为 Sass 弃用与资源大小      |
| 标准 UI 命令                   | 测试收集失败，Playwright 版本冲突               |
| 使用 @playwright/test 自身 CLI | 24 项中 22 项通过、2 项失败                     |

本地安装的 playwright 为 1.62.1，@playwright/test 为 1.63.0。package.json 对前者固定版本、对后者使用范围版本。两个失败用例分别为：搜索截图基线预期 40px、实际和几何断言均为 36px；标题用例点击第 2 个日历按钮，实际点击的是年月选择器而非下一月。用正确按钮实际往返切月，标题保留正常。

## 第一优先级：数据可靠性与安全边界

### 1. 移动日记目录后，重启无法自动找到日记【实测确认】

- 复现：创建并保存日记，移动到新目录，重启相同用户数据实例。
- 结果：主进程路径恢复为原 userData，fileExists 为 false；原文件仍在新目录，属于路径丢失而非文件被删除。
- 原因：移动和选择目录仅改变 DiaryService.directory，没有持久化；启动也没有从设置恢复目录。
- 位置：`src/main/services/diaryService.ts:72-102`、`src/main/ipcMain/listeners.ts:170-189`、`src/renderer/components/overlays/pref-overlay/file-dir-pref/FileDirPref.tsx:25-49`。
- 建议：移动成功后持久化目录，并在首次 fileExists 前恢复；处理路径不可访问、文件已存在及跨卷 EXDEV。当前直接 fs.rename，跨卷移动存在失败风险。

### 2. 导入写盘失败时仍关闭弹窗，保存状态具有误导性【故障注入确认】

- 将 diary:replace-entries 设置为延迟失败后导入：导入窗口关闭，页脚仍显示“已自动保存”；重新读取磁盘仍是旧内容。
- 原因：mergeUpdateFile 未 await/return dispatch(replaceEntries(entries))；内部错误又被吞入 encryptStatus。导入没有接入统一保存状态。
- 位置：`src/renderer/store/file/actionCreators.ts:130-139,208-215`、`src/renderer/store/import/actionCreators.ts:80-84`。
- 建议：将导入解析、冲突确认、持久化和界面提交串成完整事务；失败时保留明确错误和重试入口；成功必须等待落盘确认。

### 3. 输入后立即导出会遗漏最新草稿【实测确认】

- 输入新正文后立即触发菜单导出，导出的 Markdown 仍为上一版正文。
- 原因：导出直接读取 Redux entries，未 flush 编辑器 debounce 草稿。
- 位置：`src/renderer/store/export/actionCreators.ts:40-48,70-78`。
- 建议：导出所有格式前统一 await flushPersistence；写盘失败时明确说明导出的内容版本或阻止误导性导出。

### 4. 同一天多条导入记录合并时，空字段导致后续内容丢失【函数实测确认】

- mergeEntries({title:"",text:""}, {title:"新标题",text:"新内容"}) 返回的标题和正文仍为空。
- 原因：只处理旧字段非空时的拼接，缺失旧字段为空时的赋值。
- 位置：`src/renderer/files/import/mergeEntries.ts:9-18`。
- 建议：分别处理双方为空、单方为空、双方非空，并正确更新格式与时间元数据。

### 5. Markdown 图片预览允许 HTML 属性注入【DOM 注入确认，脚本执行被 CSP 阻止】

- 图片 alt 中的双引号能够突破属性边界，实际 DOM 可出现 onerror 属性。
- 现有 CSP 的 script-src 'self' 阻止了此次内联事件脚本执行，不能将本结果表述为已实现脚本执行或任意代码执行。
- 原因：仅转义 &、<、>，随后把未进行属性编码的文本拼进 `<img alt="...">`。
- 位置：`src/renderer/utils/markdownExtras.ts:35-42`、`src/renderer/components/elements/editor/editor/Editor.tsx:233-240`。
- 建议：采用成熟 Markdown AST 渲染与 HTML 白名单净化，或以 React 元素生成图片；保留 CSP，给注入边界增加回归验证。

### 6. 导入同日期记录覆盖已有内容，缺少逐项冲突决策【源码确认】

- `mergeUpdateFile` 直接 `{...existing, ...incoming}`；导入页面没有逐项对比或合并选择。
- 位置：`src/renderer/store/file/actionCreators.ts:211`、`src/renderer/components/overlays/import-overlay/ImportOverlay.tsx:77-97`。
- 建议：先显示新增/冲突数量，并提供跳过、替换、合并；替换前保留可恢复的加密快照。

## 第二优先级：功能与交互正确性

### 7. 快速清空搜索后旧搜索重新生效【实测确认】

- 输入搜索词后立即点清空，等待 650ms：输入框为空，旧结果仍在，日历未恢复。
- 原因：clearSearchKey 未取消 pending debounce。
- 位置：`src/renderer/components/elements/sidebar/search-bar/SearchBar.tsx:39-56`。
- 建议：清空和组件卸载时 cancel；统一输入值与已提交查询状态。

### 8. “自动”主题不会实时跟随系统【实测确认】

- 设置自动主题后，将 Chromium prefers-color-scheme 改为 dark，应用仍保持 theme-light。
- getThemeFromPref 仅即时读取 matchMedia；代码没有 change 订阅，也没有主进程 theme-change 发送方。
- 位置：`src/renderer/utils/native-theme.ts:7-11`、`src/preload/preload.ts:74`。
- 建议：订阅 matchMedia change 或 nativeTheme updated，仅在 preference=auto 时同步。

### 9. 最长连续写作统计错误【实测确认】

- 连续三天分别写日记，当前连续显示 3，历史最长只显示 1。
- 原因：循环只在连续段中断时更新 longestStreak，最后一段未结算。
- 位置：`src/renderer/components/overlays/stats-overlay/StatsOverlay.tsx:39-88`。
- 建议：补齐最后一段、空日记、未来日期的统计规则；字数按可见正文计算，避免 Markdown 符号/图片 base64 污染统计。

### 10. 高级 Markdown 预览不完整【混合表格实测，其他项源码确认】

- 标题 + 表格 + 正文，表格直接显示竖线源码；表格解析只在文档首部匹配，且后续正文可能被当成表格行。
- Mermaid 和公式仅套上 pre/div 样式，并没有真正的图形或公式排版。
- 图片只支持特定 data URL；检测到扩展语法时整篇进入只读预览，普通正文也不能直接编辑。
- 位置：`src/renderer/utils/markdownExtras.ts:14-49`、`src/renderer/components/elements/editor/editor/Editor.tsx:65-66,219-249`。
- 建议：统一 Markdown 解析器与能力清单；明确区分编辑和预览，避免用片段正则解析整篇文档。

### 11. PDF 导出实际打印 Markdown 原文【源码确认】

- 主进程仅 HTML 转义 Markdown，再以 white-space:pre-wrap 打印；不会渲染标题、列表、图片与表格。
- 位置：`src/main/ipcMain/listeners.ts:151-162`。
- 建议：复用安全预览渲染器并提供打印样式；等待图片/字体加载；为图片 base64、长代码和跨页表格设置专门规则。

### 12. 密码操作反馈不足【源码确认】

- 修改密码后立即清空输入，未等待完成；失败信息写入 encryptStatus，但该设置组件不显示。
- 解锁失败统一提示“密码错误”，文件损坏、不支持的格式等错误同样落入该文案。
- 位置：`src/renderer/components/overlays/pref-overlay/password-pref/PasswordPref.tsx:27-34`、`src/renderer/components/pages/start-page/password-prompt/PasswordPrompt.tsx:89-92`。
- 建议：显示处理中、成功和失败状态，错误分类；密码变更在主进程采用成功后替换 session 的事务方式。

### 13. 重置/崩溃关闭存在待验证竞态【源码风险，非已复现】

- 重置按钮连续调用异步 resetDiary 和 testFileExists，没有等待顺序；本次正常重置成功，但慢磁盘下结果可能不同。
- 关闭时完全等待 renderer 的 prepare-close 回执，没有渲染进程崩溃/无响应的回退流程。
- 位置：`src/renderer/components/overlays/pref-overlay/file-dir-pref/diary-reset-button/DiaryResetButton.tsx:30-32`、`src/main/main.ts:45-66`。
- 建议：明确 await 顺序，覆盖慢磁盘及 render-process-gone；崩溃回退须区分已落盘内容与不可恢复草稿。

## UI 与交互设计

### 已有优点

- 侧栏与写作区分工明确，正文排版、留白和浅深主题基本框架一致。
- 已有自动保存状态、失败重试和关闭前保存机制；相关 UI 测试通过。
- 设置弹窗具备焦点限制、Escape 关闭和焦点返回，相关测试通过。
- 中文子串搜索、源码空白与光标保持、Markdown 快捷输入已有测试覆盖。

### 优化事项

| 问题 | 证据/位置 | 建议 |
| --- | --- | --- |
| 段落样式下拉框只剩箭头，当前选项不可读 | 浅/深色截图；`_redesign.scss:519-526` 固定 36px 栅格，`FormattingButtons.tsx:124-149` 放入 select | 样式下拉单独给 88–112px 宽度，图标按钮继续使用 36px |
| 搜索框存在双层边框/焦点样式 | 截图；`_redesign.scss:199-210,229-238,661-672` 外层和内层同时设置，后面的全局 important 覆盖局部规则 | 边框与焦点环只由 wrapper 管理 |
| “回到今天”按钮被隐藏 | `_redesign.scss:241-243` | 恢复可见入口，减少查看旧日记后的返回成本 |
| 窄窗口需要滚动才能操作底部工具栏 | 500px 截图，editor min-height 500px | 将写作工具栏设为可见的 sticky 区域；侧栏采用抽屉或紧凑展开 |
| 工具栏横向滚动没有明显提示 | `_redesign.scss:534-546` 隐藏滚动条 | 低频操作放入“更多”；溢出区添加渐隐和滚动提示 |
| 插入图片藏在 Markdown 帮助里 | `MarkdownHelp.tsx:72-83` | 放到明确的插入菜单；帮助仅承载说明，复制动作增加完成反馈 |
| 设置面板长，普通配置与高风险操作混放 | 设置截图、`FileDirPref.tsx` | 分为外观/编辑/数据/安全；重置使用独立危险区，不与普通按钮同等蓝色强调 |
| 长标题可能溢出固定高度 | `_redesign.scss:472-481` 固定 height 46px；contentEditable 可换行 | 使用 min-height、自适应高度和换行策略，检查多行粘贴 |
| 中文界面统计标签仍为英文 | 实测统计内容 | 补齐翻译；年月选择器的硬编码中文也应纳入 i18n |
| 键盘与辅助技术状态不足 | `ThemePref.tsx` 每个 radio 的 name 不同；格式/模式按钮无 aria-pressed；帮助/年月弹层无 Escape 逻辑 | 同组 radio 共享 name；暴露选中状态；统一轻量弹层键盘约定 |

建议保留目前简洁结构，把重点放在可读性、操作可见性和一致反馈。视觉风格偏通用工具界面，如要加强“个人日记”氛围，可在保持对比度的前提下适度使用暖中性色，降低大面积选中蓝色，增加字体/行宽/专注模式偏好。

## 色彩管理

当前 Sass `$themes` 与 `_redesign.scss` CSS 变量重复定义主题；语法高亮又有独立硬编码颜色。应收敛为一个语义 token 源，由组件消费。

依据当前实色值计算 WCAG 对比度：

| 配色                                | 对比度 | 评估                                            |
| ----------------------------------- | ------ | ----------------------------------------------- |
| 次要文字 #909399 / 白色             | 3.08:1 | 当前 12–13px 次要文字低于普通文字 4.5:1 目标    |
| 白色 / 主色 #409eff                 | 2.78:1 | 按钮与选中日期数字不足；大字号最低 3:1 也未达到 |
| 错误红 #f56c6c / 白色               | 2.90:1 | 用作小字错误提示不足，需区分文字色与装饰色      |
| 代码数字 #986801 / 深背景 #1d2129   | 3.32:1 | 深色代码文字不足                                |
| 代码关键字 #a626a4 / 深背景 #1d2129 | 2.64:1 | 深色代码文字不足                                |

建议拆分 accent-fill、accent-text、text-secondary、text-placeholder、border、focus-ring、danger-text、danger-bg 等语义变量；浅深主题分别校准，不能只替换背景。代码语法高亮需要独立浅/深方案。原生复选框/单选框使用统一 accent-color，并正确设置 color-scheme。保存、错误、选中状态同时使用文字/图形与颜色表达。

## 工程与性能优化

- 对齐 @playwright/test 和 playwright 版本，统一依赖安装与锁文件策略；修复类型检查和过期快照/选择器。
- 测试需要覆盖本报告发现的事务边界，而非仅覆盖正常输入与 IPC 返回值。
- 日记每次保存会 JSON.stringify 全部条目并重新加密整个文件；图片又以内联 base64 进入正文，长期使用有明显 I/O、内存和主进程阻塞风险。当前未做大数据压测，不将此表述为已发生卡顿。
- 中文搜索保底分支每次遍历全部文档，结果硬截断为 100 条。建议提示总数/截断，测量多年日记后再考虑分词、worker 或分页。
- 锁定仅清理 Redux entries，搜索模块的 documents/index 没有销毁流程；建议锁定时清理明文搜索缓存，并评估睡眠/闲置自动锁定。
- 当前保存有原子 rename，但没有可见的版本备份恢复流程。建议增加加密轮转快照和恢复验证，优先保护误覆盖、导入错误和磁盘异常场景。
- Sass @import/map-get 弃用需要渐进迁移；\_redesign.scss 大量覆盖与 important 应收敛到组件样式。包体警告优先级低于真实数据问题。

## 推荐实施顺序

1. 数据正确性：目录持久化、导入完整事务、导出草稿屏障、合并空字段、冲突恢复、预览属性编码。
2. 功能修复：搜索清空、统计、系统主题同步、混合 Markdown/PDF、密码反馈。
3. 设计系统：统一色彩 token/对比度、工具栏、搜索框、窄屏写作区和设置分组。
4. 长期质量：修复测试基础设施、补充高风险回归、备份恢复、跨平台和大数据性能验证。

本报告区分了实测、源码确认和待验证风险；通过现有测试不代表完整软件无缺陷，失败的测试也需要先排除基线和选择器问题。
