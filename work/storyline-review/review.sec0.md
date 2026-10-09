# 《第0篇 地球与生命》审阅问题清单

审阅范围：sec0_full.md 全文（第1–4卷，P0–P57，共 339 句，0-based 坐标）。
说明：本材料为词汇学习叙事文本，段落围绕词汇覆盖切换场景属正常设计，不作为问题；以下仅列可在文本内部验证的问题。

---

### Q1｜[0.45.0]｜类型：B 人物（译名不一）｜严重度：中
- **原文**：`ZH: 周六早晨，里奥在大门口见到了一位和善的动物学家……`（EN 为 `Leo joined a kind zoologist…`）
- **问题**：主角 `Leo` 的中译名在第四卷（P45 起）由「利奥」改成了「里奥」。前文 [0.1.1]、[0.20.0]、[0.28.0]、[0.36.3]、[0.44.1] 等均作「利奥」，[0.45.0] 起全部作「里奥」，同一人物译名前后不一致。
- **建议**：统一为同一译名（推荐沿用前文出现更多的「利奥」），全局替换第四卷的「里奥」。

### Q2｜[0.16.0]｜类型：A 时间线（时态前后矛盾）｜严重度：中
- **原文**：`EN: Early in the morning, Mina sprinkles sugar into her tea and takes a quick shower before the climb.`（[0.16.1] `it is already twenty-five degrees…`、[0.18.2] `Sam wipes dirt…`、[0.19.1] `Maya investigates…`）
- **问题**：全篇主体叙事为过去时（P0–P15、P20 及之后均为 past），但 P16–P19 整段切换到一般现在时叙述（sprinkles / is / promises / stands / knows / leads / wipes / stands / investigates / drops 等），时态与上下文冲突。更突出的是 P17 段内混用：[0.17.0]–[0.17.2]、[0.17.4] 为现在时，而 [0.17.3] `his grandmother hung…`、[0.17.5] `Last April, when she found… Ana said` 为过去时。
- **建议**：将 P16–P19 统一改为过去时叙事；若确为“人物常态介绍”，可改为 `usually / every…` 的常态句并明确与主线时间的关系，避免与前后卷的过去时叙事打架。

### Q3｜[0.8.2]｜类型：A 时间线（时态前后矛盾）｜严重度：低
- **原文**：`EN: Old tents degrade fast in such cold, so the team upgrades theirs with thick, warm linings.`
- **问题**：所在段落（P8）其余各句均为过去时（[0.8.0] `prowled`、[0.8.1] `began`、[0.8.4] `dreamed`），唯此句用现在时 `degrade / upgrades`，与上下文时态不一致。同类零星现在时句还有 [0.36.3] `Leo holds… Sam pulls…`、[0.46.5] `Nobody here is allowed…`。
- **建议**：改为 `Old tents degraded fast in such cold, so the team upgraded theirs…`，并同样核对 [0.36.3]、[0.46.5] 的时态。

### Q4｜[0.14.5]｜类型：A 故事线（情节顺序矛盾）｜严重度：高
- **原文**：`[0.14.5] He tied the boat fast and hurried toward the warm harbour lights.` 紧接 `[0.15.0] Suddenly bright lightning tore the sky above his small boat.` / `[0.15.1] The stormy waves tossed the boat against the harbour wall.` / `[0.15.2] A sudden downpour drenched him while he pulled the last rope.`
- **问题**：[0.14.5] 已交代拉尔斯把船系牢、然后快步走向港灯（即已离开船）；但下一段 [0.15.0]–[0.15.2] 又写他仍在小船旁、海浪把船抛向堤墙、他还在拉最后一根绳索，动作顺序自相矛盾（先“系好走人”又“正在系最后一根绳”）。
- **建议**：调整 [0.14.5] 为“正要系船”或把该句移到 [0.15.2] 之后，使“系船—遇暴风雨—最终系牢离开”的动作链连贯。

### Q5｜[0.50.5]｜类型：C 细节（语法错误）｜严重度：高
- **原文**：`EN: The quiet milk cattle stood in line while a strong brown oxen pulled a dray.`
- **问题**：`oxen` 是 `ox` 的复数形式，不能说 `a strong brown oxen`（数词与复数形式冲突），系明确语法错误。
- **建议**：改为 `a strong brown ox`（或 `strong brown oxen` 去掉冠词 `a`）。

### Q6｜[0.15.4]｜类型：A 故事线（前后设定打架）｜严重度：中
- **原文**：`[0.15.3] He later learned that the evening's rainfall had broken the village record.` / `[0.15.4] Back home, he marked the date in red on the wall, hoping the seasonal rains would return.`
- **问题**：前一句刚交代当晚降雨破了村里纪录（雨量极大），后一句却写他“盼着季节性的雨季再来”，语义上自相矛盾——既然刚下了破纪录的大雨，正常预期不会是“盼雨回来”。
- **建议**：明确 [0.15.4] 的动机，如改为盼“不再来得这么猛/来得更规律”，或把“破纪录”改为“这场雨迟迟不来、是久旱后的第一场”，使“盼雨”成立。

### Q7｜[0.18.1]｜类型：C 细节（代词指代混乱）｜严重度：中
- **原文**：`[0.18.0] The slow river carries thick sediment while soft silt settles among the roots.` / `[0.18.1] After storms the bank turns soft and muddy, so she moulds the damp clay into small bricks to show her class.`
- **问题**：[0.18.1] 的 `she` 在本段内没有任何女性先行词（上一段末的女性人物是 P17 的 Ana，且她身份是研究者，此处又出现 `her class` 暗示是教师），指代对象不清。
- **建议**：直接补出主语（如 `Ana moulds…` / `their teacher moulds…`），或在 P18 开头明确人物，避免跨段悬空指代。

### Q8｜[0.47.1]｜类型：C 细节（逻辑/歧义）｜严重度：中
- **原文**：`EN: An old photo showed an ancestor of the gibbon with its happy descendant beside it.`
- **问题**：一张“老照片”里出现“祖先”，却又有“后代”在其旁边——“照片中的祖先”与“现实中的后代”不能并排出现在同一画面里，句意逻辑不通（ZH 亦为“祖先和它快乐的后代并排站着”）。
- **建议**：改写为可成立的表述，如“照片里是长臂猿的祖先，而它快乐的后代就站在墙上的照片旁”，明确“照片内”与“照片外”的空间关系。

### Q9｜[0.54.1]｜类型：C 细节（表述不清/翻译腔）｜严重度：中
- **原文**：`EN: A vet explained basic bird anatomy charts and warned them about the year of the poultry epidemic.`
- **问题**：`warned them about the year of the poultry epidemic` 表意残缺——“提醒他们那一年的家禽疫情”到底要提醒什么（提防复现？记录？）没有说清，属明显翻译腔/歧义。
- **建议**：改为可落地的语义，如 `warned them that a poultry epidemic had broken out that year and could return`。

### Q10｜[0.7.4]｜类型：C 细节（专有名词前后不一）｜严重度：低
- **原文**：`[0.7.4] EN: White bears roam the frozen Arctic ice in the north.` 对比 `[0.8.0] EN: A hungry polar bear prowled nearby…`
- **问题**：同一动物（北极熊）在相邻两段分别用 `White bears` 与 `polar bear` 两种说法，术语不统一（`white bear` 亦非英语中该动物的通用名）。
- **建议**：统一为 `polar bears`，[0.7.4] 改为 `Polar bears roam the frozen Arctic ice in the north.`

### Q11｜[0.56.0]｜类型：D 冗余｜严重度：低
- **原文**：`EN: Many bats are busy and nocturnal at night, while toads stay sleepy and dormant by day.`
- **问题**：`nocturnal` 本身即“夜间活动的”，`nocturnal at night` 语义重复冗余。
- **建议**：删去 `at night`，改为 `Many bats are busy and nocturnal, while toads stay sleepy and dormant by day.`

### Q12｜[0.50.0]｜类型：C/D（冗余 + 时态跳脱）｜严重度：低
- **原文**：`EN: A jumping kangaroo ate fresh leaves while traders once stole white ivory for money.`
- **问题**：① `white ivory` 语义重复（象牙本身就是白色）；② 同一句内前半为现场叙事过去时 `ate`，后半 `traders once stole` 又跳到“往昔交易”的时空，场景与时间切换突兀。
- **建议**：删去 `white` 改为 `ivory`；并把后半句独立成句或加上明确时间标记（如 `Long ago, traders had…`）以区分两个时空。

### Q13｜[0.10.5]｜类型：C 细节（前后设定不一）｜严重度：低
- **原文**：`[0.10.2] At the end of the path they rented a small dry flat.` 对比 `[0.10.5] Behind the house, a dry sandy path climbed toward the far hills.`
- **问题**：[0.10.2] 说租的是公寓（flat），[0.10.5] 却称其为 `the house`（房子），同一住处在相邻句里被当作两种居所类型。
- **建议**：统一措辞，如 [0.10.5] 改为 `Behind the flat…`，或 [0.10.2] 改为 `a small dry house`。

### Q14｜[0.9.1]｜类型：C 细节（逻辑连接不当）｜严重度：低
- **原文**：`EN: The skipper trusted satellite navigation even in thick fog, until they sheltered in a wide, calm gulf.`
- **问题**：`trusted… until they sheltered` 之间缺乏逻辑关系（信任导航与驶入海湾躲避之间无因果/转折），`until` 使用不当，句意含混。
- **建议**：拆分为两句或改用恰当连接，如 `The skipper trusted satellite navigation even in thick fog, and at last they sheltered in a wide, calm gulf.`

### Q15｜[0.7.0]｜类型：A 故事线（地理/场景矛盾）｜严重度：低
- **原文**：`EN: Below the ice they waded through a warm swamp and reached the green river delta.`
- **问题**：上一段 [0.6.x] 他们还在北陆边缘的冰川、雪原扎营，此处却说“冰层之下蹚过温暖的沼泽”，冰下紧邻温暖沼泽在地理上自相矛盾。
- **建议**：改为空间可成立的说法（如 `Leaving the ice behind, they waded through a warm swamp…`），弱化“冰下/冰内”的空间断言。

### Q16｜[0.14.2]｜类型：D 冗余｜严重度：低
- **原文**：`[0.14.1] …the puddles on the pier began to freeze.` / `[0.14.2] Old Lars faced frigid winds on the frozen northern pier.`
- **问题**：相邻两句重复使用 `pier` 交代同一地点，信息冗余。
- **建议**：合并或改写，如 [0.14.2] 用 `there` 回指：`Old Lars faced the frigid winds there.`

### Q17｜[0.55.1]｜类型：C 细节（搭配不当）｜严重度：低
- **原文**：`EN: A hungry chick will quickly devour its meal, guided by sharp night instinct.`
- **问题**：雏鸟白天觅食，`night instinct`（夜间本能）与“饥饿雏鸟进食”的常识不搭，疑为生硬塞入“夜间”类词汇所致。
- **建议**：改为 `guided by sharp instinct` 或换用与雏鸟习性相符的词（如 `keen feeding instinct`）。

### Q18｜[0.8.1]｜类型：C 细节（搭配不当）｜严重度：低
- **原文**：`EN: The thin springtime air began to deteriorate, and every icy wind would aggravate their frostbite.`
- **问题**：`air began to deteriorate`（空气开始恶化）搭配不自然，通常说“天气/状况”恶化；且 `would aggravate their frostbite` 暗示此前已存在冻伤，但前文并未交代他们受过冻伤。
- **建议**：改为 `The thin springtime air grew worse`（或改“天气恶化”），并在此前补一句交代冻伤由来，或改为 `would give them frostbite`。

### Q19｜[0.45.0]｜类型：C/D（人物易混，待确认）｜严重度：低
- **原文**：`[0.16.0] …Mina sprinkles sugar into her tea…` 对比 `[0.31.2] Mia took a small sample of soil…`
- **问题**：`Mina`（P16）与 `Mia`（P31/P33/P36）两个名字高度形近、分处不同段落群，读者极易误认为同一人被误写。此处彼此关系**待确认**（二者可能本就是两个不同角色）。
- **建议**：若为两人，可在首次出现时各给一个区分性身份标签；若本为一人，则统一拼写。请与作者确认。

### Q20｜简介行｜类型：D 冗余遗漏（标题不一致）｜严重度：低
- **原文**：`简介：地理社四卷：远行归来、星空菜园、动物救助站，210+347词。`
- **问题**：正文实际分卷标题为「第一卷·远行」「第二卷·归来」「第三卷·星空菜园」「第四卷·动物救助站」共四卷，简介却把前两卷并写为「远行归来」，与正文卷名不一致，易生歧义。
- **建议**：简介改为与正文一致的「远行、归来、星空菜园、动物救助站」。

---

## 统计

- 总问题数：**20**
- 按类型计数（每条只计其主类型，避免重复计数）：
  - A 故事线/时间线：5（Q2、Q3、Q4、Q6、Q15）
  - B 人物：1（Q1）
  - C 细节：11（Q5、Q7、Q8、Q9、Q10、Q12、Q13、Q14、Q17、Q18、Q19）
  - D 冗余遗漏：3（Q11、Q16、Q20）
  - 合计 5+1+11+3 = 20
  - 说明：Q2/Q3 同属“时态前后矛盾”，按 A 归入；Q12 兼“冗余”与“时态跳脱”，按主类型 C 归入。
- 按严重度计数：
  - 高：2（Q4、Q5）
  - 中：6（Q1、Q2、Q6、Q7、Q8、Q9）
  - 低：12（Q3、Q10、Q11、Q12、Q13、Q14、Q15、Q16、Q17、Q18、Q19、Q20）
