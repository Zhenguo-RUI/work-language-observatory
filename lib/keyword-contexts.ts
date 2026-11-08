import type {Bi} from "./observatory-types";

/** Model-drafted explanations and teaching illustrations, not additional JD facts.
 * The original archive paraphrases and counts remain in public-study.json.
 */
export type KeywordContextExample = {
  sourceRoleZh: string;
  reviewStatus: "model_draft" | "author_reviewed" | "revised";
  task: Bi;
  expertTake: Bi;
  scenario: Bi;
  deliverable: Bi;
};
export type KeywordContextEntry = {group: KeywordGroup; summary: Bi; examples: KeywordContextExample[]};

/** Navigation groups mirror research/config/terms.yaml; they are not measured senses. */
export const keywordGroups = {
  "品质与工作方式": {zh: "品质与工作方式", en: "Qualities and ways of working"},
  "协作与服务": {zh: "协作与服务", en: "Working with others"},
  "技能与工具": {zh: "技能与工具", en: "Skills and tools"},
  "管理用语": {zh: "管理用语", en: "Management language"},
} satisfies Record<string, Bi>;
export type KeywordGroup = keyof typeof keywordGroups;

export const keywordContexts: Record<string, KeywordContextEntry> = {
  "沟通": {
    "group": "协作与服务",
    "summary": {
      "zh": "试模要交清现场问题，采购要谈清交易条件，活动支持要把安排落实到人。比较沟通要求时，先问信息交给谁、要促成什么动作、出现分歧由谁定案。",
      "en": "The mould-trial lead passes on a usable fault record; procurement settles commercial terms; the HR intern turns plans into practical arrangements. Ask who needs the information, what they should do next, and who resolves a disagreement."
    },
    "examples": [
      {
        "task": {
          "zh": "把试模异常讲清楚",
          "en": "Explain a mould-trial fault clearly"
        },
        "expertTake": {
          "zh": "沟通要把现场看到的异常和试过的调整说清，让下一位处理者知道从哪里接手。",
          "en": "Communication connects the observed defect with the adjustments already tried, so the next person knows where to start."
        },
        "scenario": {
          "zh": "某次试模后零件出现缺陷，可以把缺陷位置、当时参数和调整前后的结果放在一起，再与接手处理的人核对，避免每次都从头排查。",
          "en": "Suppose a trial produces defective parts. Put the defect location, machine settings and before-and-after results together, then review them with whoever takes the issue forward rather than restarting the investigation."
        },
        "deliverable": {
          "zh": "带参数、缺陷位置和试验结果的异常记录",
          "en": "A fault record with settings, defect location and trial results"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "试模领班"
      },
      {
        "task": {
          "zh": "把采购条件谈到能执行",
          "en": "Turn terms into a workable purchase"
        },
        "expertTake": {
          "zh": "采购沟通要同时处理价格、质量和到货安排，让供应商承诺能接上用料需求。",
          "en": "Procurement communication brings price, quality and delivery into an agreement that fits the material requirement."
        },
        "scenario": {
          "zh": "供应商报价便宜但交期偏晚，可以把报价、到货日期与生产缺料风险列在同一张表里，和供应商核实替代方案，再确认各项条件由谁决定。",
          "en": "If a cheaper supplier would deliver late, compare price, delivery dates and the risk of a material shortage. Check alternatives with the supplier, then clarify who decides each part of the trade-off."
        },
        "deliverable": {
          "zh": "包含报价、交期和待确认条件的采购比较表",
          "en": "A purchasing comparison with prices, delivery dates and open terms"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "采购主管"
      },
      {
        "task": {
          "zh": "让活动安排落实到人",
          "en": "Make event arrangements clear"
        },
        "expertTake": {
          "zh": "这里的沟通围绕活动执行，把时间、地点、参与者和现场安排传达到位。",
          "en": "Here, communication makes an event plan usable by the people attending and running it."
        },
        "scenario": {
          "zh": "活动临时换场地时，可以更新通知、签到位置和现场分工，分别确认参与者与负责现场的人收到了同一版安排，再记录还没解决的问题。",
          "en": "If the venue changes, update the invitation, check-in location and on-site assignments. Confirm that participants and event staff have the same version and record anything still unresolved."
        },
        "deliverable": {
          "zh": "更新后的活动通知、分工表与待办清单",
          "en": "An updated event notice, responsibility list and open-action list"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "人力资源实习生"
      }
    ]
  },
  "分析": {
    "group": "技能与工具",
    "summary": {
      "zh": "会计分析要能核对账目，技术销售分析要能安排市场行动，机器人分析要经模型与测试检查。判断分析能力时，先看结论交给谁，以及对方凭什么接受它。",
      "en": "An accountant's conclusion must reconcile with records; a technical salesperson's must inform market action; a robotics engineer's must stand up to modelling and tests. Ask who uses the conclusion and what makes it acceptable."
    },
    "examples": [
      {
        "task": {
          "zh": "找出账款差异的来处",
          "en": "Trace a receivables discrepancy"
        },
        "expertTake": {
          "zh": "分析围绕应收账款和收入展开，要把报表中的差异对应回具体交易与核对材料。",
          "en": "Analysis connects receivables and revenue figures back to the transactions and records that explain a discrepancy."
        },
        "scenario": {
          "zh": "一笔应收款长期未结清，可以对照合同、开票与收款记录，分清尚未收款和记录未匹配的情况，再把仍需业务方确认的事项单独列出。",
          "en": "For an old outstanding balance, compare the contract, invoice and receipt records. Separate an unpaid amount from a receipt that has not been matched, then list the points requiring confirmation from the business team."
        },
        "deliverable": {
          "zh": "应收账龄表及逐项差异说明",
          "en": "A receivables ageing schedule with itemized explanations"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "会计"
      },
      {
        "task": {
          "zh": "把市场判断变成行动",
          "en": "Turn market evidence into a plan"
        },
        "expertTake": {
          "zh": "这里分析市场和产品特点，是为了选择推广方向，并讲清选择的依据。",
          "en": "Market and product analysis supports a choice of promotional direction and an explanation for that choice."
        },
        "scenario": {
          "zh": "两类客户关注的产品优势不同时，可以整理客户问题、竞品卖点与自身产品特点，分别提出推广内容和接触路径，再说明优先尝试哪一类。",
          "en": "If two customer groups value different features, compare their questions, competitor claims and your product's strengths. Propose a message and outreach approach for each, explaining which to try first."
        },
        "deliverable": {
          "zh": "客户需求对照与推广方案建议",
          "en": "A customer-needs comparison and proposed marketing plan"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "技术销售代表"
      },
      {
        "task": {
          "zh": "用模型解释机械臂表现",
          "en": "Explain robot-arm performance"
        },
        "expertTake": {
          "zh": "分析要把机械臂的运动表现转成模型、参数和可检查的仿真结果。",
          "en": "Analysis turns robot-arm behaviour into models, parameters and simulation results that can be examined."
        },
        "scenario": {
          "zh": "机械臂到达同一位置时反复出现偏差，可以比较目标轨迹与仿真轨迹，检查模型参数的影响，整理哪些条件下偏差更明显，供后续测试核对。",
          "en": "If the arm repeatedly misses a target position, compare the target and simulated trajectories, examine parameter effects and record the conditions associated with larger errors for subsequent testing."
        },
        "deliverable": {
          "zh": "轨迹对照、参数记录与仿真结果说明",
          "en": "A trajectory comparison, parameter record and simulation note"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "机器人算法工程师"
      }
    ]
  },
  "数据": {
    "group": "技能与工具",
    "summary": {
      "zh": "实验中的数据要记录得可比较，招聘数据用来定位流程卡点，客诉数据要形成可处理的问题。看到数据能力要求，可以问：这份工作需要记录什么、解释什么，结论交给谁使用？",
      "en": "Test data need comparable records; recruitment data help locate delays; complaint data help identify problems to investigate. Ask what you would record, what you would explain, and who would use your findings."
    },
    "examples": [
      {
        "task": {
          "zh": "把测试观察记成可比记录",
          "en": "Make test observations comparable"
        },
        "expertTake": {
          "zh": "数据来自打印测试，重点是把配方表现与测试条件对应起来，供下一轮验证使用。",
          "en": "The data come from printing tests: formulation performance needs to stay connected to the conditions under which it was observed."
        },
        "scenario": {
          "zh": "比较两种墨水的干燥表现时，可以在相同纸张和测试条件下分别记录干燥、颜色与牢度表现，保留条件差异，避免把测试方式不同看成配方差异。",
          "en": "When comparing two inks, record drying, colour and fastness under comparable paper and test conditions. Preserve any differences in setup so a test-method difference is not mistaken for a formulation effect."
        },
        "deliverable": {
          "zh": "带测试条件的配方表现记录表",
          "en": "A formulation test record with the test conditions attached"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "化学工程师"
      },
      {
        "task": {
          "zh": "找出招聘流程卡在哪里",
          "en": "Locate a hiring bottleneck"
        },
        "expertTake": {
          "zh": "招聘数据要连回筛选、面试和入职步骤，解释效率与候选人体验出了什么问题。",
          "en": "Recruitment data link back to screening, interviews and onboarding to explain problems with speed or candidate experience."
        },
        "scenario": {
          "zh": "候选人进入面试后流失增多时，可以按环节查看等待时间与退出原因，分别核对排期、沟通和岗位预期，再提出需要优先调整的步骤。",
          "en": "If more candidates leave after reaching interview, inspect waiting times and withdrawal reasons by stage. Check scheduling, communication and role expectations before recommending a process change."
        },
        "deliverable": {
          "zh": "分环节招聘看板与流程改进建议",
          "en": "A stage-by-stage hiring view and process recommendations"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "招聘主管"
      },
      {
        "task": {
          "zh": "把客诉整理成改进问题",
          "en": "Turn complaints into fixable issues"
        },
        "expertTake": {
          "zh": "数据工作把分散的客诉归类、找出重复问题，再让技术部门看懂需要改什么。",
          "en": "The work groups complaints, identifies recurring issues and gives the technical team enough detail to investigate them."
        },
        "scenario": {
          "zh": "多位客户都说产品不好用时，可以把描述拆成不同问题，整理出现条件、影响和复现线索，附上代表案例，避免把所有反馈都放进一个模糊类别。",
          "en": "When customers describe a product as difficult to use, separate the underlying issues. Record conditions, impact and reproduction clues, with representative cases, instead of putting every complaint into one vague category."
        },
        "deliverable": {
          "zh": "客诉分类表、代表案例与质量问题报告",
          "en": "A complaint taxonomy, representative cases and quality report"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "售后客服"
      }
    ]
  },
  "协调": {
    "group": "协作与服务",
    "summary": {
      "zh": "成本协调处理方案与产线的冲突，设备协调连接采购和维护，渠道协调衔接统一政策与地方执行。先确认冲突发生在哪里，再问你负责传递、促成一致，还是有权改方案。",
      "en": "Cost coordination reconciles proposals with production constraints; equipment coordination connects purchasing and maintenance; channel coordination connects company policy with local execution. Ask where conflicts arise and whether the role relays, negotiates or decides."
    },
    "examples": [
      {
        "task": {
          "zh": "让成本方案接上生产",
          "en": "Make a cost proposal work in production"
        },
        "expertTake": {
          "zh": "协调要把成本改善放回制造现场，核对方案能否在现有物料和工序中实施。",
          "en": "Coordination tests a cost-improvement proposal against the materials and processes used in production."
        },
        "scenario": {
          "zh": "某项降本方案会改变用料时，可以和制造方核对物料需求、工序影响和系统记录，列出需要验证的问题，再把可行方案与未解决限制一起交回。",
          "en": "If a cost proposal changes a material, review the material requirement, process impact and system records with manufacturing. Return the feasible option together with the constraints that still need validation."
        },
        "deliverable": {
          "zh": "降本方案、生产影响与待验证事项表",
          "en": "A cost proposal with production impacts and validation questions"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "成本工程师"
      },
      {
        "task": {
          "zh": "接好设备采购与维护",
          "en": "Connect purchasing with maintenance"
        },
        "expertTake": {
          "zh": "设备协调贯穿立项、采购、登记和保养，关键是每一步的信息能交到下一步。",
          "en": "Equipment coordination carries information through project setup, purchasing, asset registration and maintenance."
        },
        "scenario": {
          "zh": "一台设备需要维修时，可以先核对资产信息与故障记录，再把维修需求、可能涉及的采购事项和使用安排汇总，分别确认下一步由谁处理。",
          "en": "When equipment needs repair, check the asset and fault records, then consolidate the repair need, any purchasing requirement and the usage schedule. Confirm who takes each next step."
        },
        "deliverable": {
          "zh": "设备事项跟踪表与采购维护交接记录",
          "en": "An equipment action tracker and purchasing–maintenance handover"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "设备管理岗"
      },
      {
        "task": {
          "zh": "让渠道能执行销售政策",
          "en": "Make sales policy workable for channels"
        },
        "expertTake": {
          "zh": "协调发生在公司销售政策与区域渠道之间，需要把执行疑问与反馈整理清楚。",
          "en": "Coordination links company sales policy with regional channels by clarifying implementation questions and feedback."
        },
        "scenario": {
          "zh": "渠道反馈某项促销难执行时，可以记录受影响的门店、具体条件和替代建议，把共同问题汇总给政策负责人，再将确认后的安排传回渠道。",
          "en": "If channels struggle to run a promotion, record the affected outlets, the specific conditions and proposed alternatives. Consolidate shared issues for the policy owner and relay the confirmed arrangement."
        },
        "deliverable": {
          "zh": "渠道执行问题清单与政策答复记录",
          "en": "A channel implementation issue list and policy-response log"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "渠道业务经理"
      }
    ]
  },
  "熟练": {
    "group": "技能与工具",
    "summary": {
      "zh": "前台的熟练表现为流程准确，公关的熟练要产出可用传播材料，财经视频还要把内容处理与合规核对接上。准备技能证明时，用一份完整产物说明自己做到了哪一步。",
      "en": "Reception proficiency means reliable handling; PR proficiency produces usable communications; financial-video work also connects production with compliance checks. Demonstrate the skill through a finished item and explain exactly which parts you handled."
    },
    "examples": [
      {
        "task": {
          "zh": "把来访登记与接待做好",
          "en": "Keep reception work accurate"
        },
        "expertTake": {
          "zh": "办公软件在这里服务于来访登记、等候和引导，熟练体现在信息准确、安排清楚。",
          "en": "Office software supports visitor registration, waiting and directions. Proficiency means keeping the information and arrangements accurate."
        },
        "scenario": {
          "zh": "同一时段有多组来访时，可以核对预约、接待人和会议地点，及时更新到访状态，把变更同步给接待人，避免重复安排或把客人引错地方。",
          "en": "With several groups arriving together, check bookings, hosts and meeting locations, update arrival status and pass changes to the hosts. The useful outcome is an accurate reception flow without conflicting arrangements."
        },
        "deliverable": {
          "zh": "准确的来访登记与接待安排表",
          "en": "An accurate visitor register and reception schedule"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "商务前台"
      },
      {
        "task": {
          "zh": "用工具做出传播材料",
          "en": "Use tools to produce usable communications"
        },
        "expertTake": {
          "zh": "AI 与剪辑工具的熟练度，要落到传播内容的制作、修改和交付上。",
          "en": "Fluency with AI and editing tools matters when it supports producing, revising and handing over communications material."
        },
        "scenario": {
          "zh": "为一次活动制作短视频时，可以先整理素材与文字，完成剪辑初稿，再核对名称、时间和画面内容，把待确认的信息标出来交给审核者。",
          "en": "For an event video, organize the footage and copy, assemble a first edit, then check names, dates and visual content. Flag anything needing confirmation before sending it for review."
        },
        "deliverable": {
          "zh": "可供审核的视频初稿与信息核对表",
          "en": "A review-ready video draft and information checklist"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "市场公关实习生"
      },
      {
        "task": {
          "zh": "把财经信息做成可核内容",
          "en": "Produce financial content that can be checked"
        },
        "expertTake": {
          "zh": "这里把剪辑、PPT 与商业合规放在一起，产物既要能看懂，也要能核对其表达。",
          "en": "Editing, presentation work and commercial compliance meet in material that needs to be understandable and checkable."
        },
        "scenario": {
          "zh": "把一组财报信息制作成视频时，可以保留数字来源，核对字幕和图表的统计范围，并标出需要合规确认的表达，避免画面更新后解说仍沿用旧数字。",
          "en": "When turning financial-report information into a video, retain the sources, align captions and chart definitions and flag wording for compliance review. Check that narration is updated when figures change."
        },
        "deliverable": {
          "zh": "附数字来源与待审核项的视频或演示稿",
          "en": "A video or slide draft with figure sources and review points"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "财经视频运营"
      }
    ]
  },
  "独立": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "三例都要求自己推进一段工作：检验零件、完成辅助财务工作，或处理分配的案件。具体分水岭是做到哪一步、交给谁复核，以及哪些决定需要另外确认。",
      "en": "All three roles ask someone to take work forward: inspect parts, complete supporting finance tasks or handle assigned cases. Ask where the task ends, who reviews it, and which decisions the role can make."
    },
    "examples": [
      {
        "task": {
          "zh": "自己完成零件检验",
          "en": "Complete the parts inspection"
        },
        "expertTake": {
          "zh": "这里的独立指自己完成零件检验，同时协助主管管理品质；是否有处置决定权，需要另行确认。",
          "en": "Here, working independently means completing the parts inspection while assisting the supervisor with quality management. Who decides what happens to defective parts still needs clarification."
        },
        "scenario": {
          "zh": "发现一批零件尺寸异常时，可以记录测量值、数量和批次，整理需要处理的异常项；是否隔离、返工或放行，再确认由谁决定。",
          "en": "If a batch shows dimensional discrepancies, record measurements, quantities and batch details and compile the exceptions. Confirm separately who decides on quarantine, rework or release."
        },
        "deliverable": {
          "zh": "可对应批次与测量结果的检验记录",
          "en": "An inspection record tied to batches and measurements"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "五金品质组长"
      },
      {
        "task": {
          "zh": "自行整理，交人复核",
          "en": "Prepare the work for review"
        },
        "expertTake": {
          "zh": "这里强调自己安排学习和工作，具体核算、审核与归档仍以协助身份参与。",
          "en": "The role emphasizes organizing your own learning and work while contributing to accounting, review and filing in a supporting capacity."
        },
        "scenario": {
          "zh": "协助核对一组财务材料时，可以先按清单整理文件、核对记录并标出差异，再把资料和问题一并交给负责复核的人，避免只交一摞未整理的材料。",
          "en": "When helping check financial records, organize the documents, reconcile the entries and flag discrepancies. Hand over the evidence with the open questions so the reviewer can follow your work."
        },
        "deliverable": {
          "zh": "整理后的核对表、差异项与归档材料",
          "en": "An organized reconciliation, exception list and filing set"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "财务实习生"
      },
      {
        "task": {
          "zh": "推进分配到的案件",
          "en": "Move assigned cases forward"
        },
        "expertTake": {
          "zh": "独立办案落在专业处理能力上，案件分配与跨部门配合仍然是工作的一部分。",
          "en": "Independent case handling concerns professional execution within a workflow that also includes case allocation and cross-department coordination."
        },
        "scenario": {
          "zh": "接到一项待处理的催收案件时，可以整理现有材料、沟通记录和待补信息，提出下一步处理方案；涉及诉讼策略或和解条件时，确认决策权限。",
          "en": "For an assigned recovery case, organize the available documents, contact history and missing information, then propose a next step. Confirm the authority for litigation strategy or settlement terms."
        },
        "deliverable": {
          "zh": "案件进度记录、材料清单与处理方案",
          "en": "A case progress record, document checklist and proposed next steps"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "法务经理"
      }
    ]
  },
  "协作": {
    "group": "协作与服务",
    "summary": {
      "zh": "工艺协作让方法进入产线，销售协作连接承诺与交付，招聘协作把需求与评估标准对上。读到协作时，找出各方交接的东西，再问标准不一致时怎样解决。",
      "en": "Process collaboration gets a method onto the production line; sales collaboration connects promises with delivery; recruitment collaboration aligns requirements and assessment. Identify what passes between the parties and how mismatched expectations are resolved."
    },
    "examples": [
      {
        "task": {
          "zh": "让新工艺在现场用起来",
          "en": "Put a process change into practice"
        },
        "expertTake": {
          "zh": "协作连接工艺文件、现场操作和培训，让改进后的做法能够被共同理解和执行。",
          "en": "Collaboration connects process documentation, shop-floor practice and training so an improvement can be understood and used."
        },
        "scenario": {
          "zh": "某道工序更新后，可以和现场使用者逐项核对操作变化，记录试做中不清楚的步骤，再更新说明与培训材料，把纸面做法和实际操作对齐。",
          "en": "After a process change, review the changed steps with the people using it, note ambiguities found during a trial and update the instructions and training material to match workable practice."
        },
        "deliverable": {
          "zh": "修订后的工艺说明、试做反馈与培训材料",
          "en": "Revised process instructions, trial feedback and training material"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "工艺工程师"
      },
      {
        "task": {
          "zh": "把销售承诺接上交付",
          "en": "Connect the sales promise to delivery"
        },
        "expertTake": {
          "zh": "机器人销售需要和实施团队配合，把客户承诺转成可以推进的项目事项。",
          "en": "Robotics sales works with implementation teams to turn customer commitments into specific delivery tasks."
        },
        "scenario": {
          "zh": "客户希望增加一项功能时，可以先整理使用场景，与实施团队核对范围和条件，再把能做、待确认和需调整的内容反馈给客户及内部负责人。",
          "en": "When a customer requests another feature, capture the use case and check scope and conditions with implementation. Feed back what is feasible, what is unresolved and what needs a revised commitment."
        },
        "deliverable": {
          "zh": "客户需求、交付范围与待确认事项对照表",
          "en": "A comparison of customer needs, delivery scope and open issues"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "机器人销售经理"
      },
      {
        "task": {
          "zh": "把招聘需求对成同一标准",
          "en": "Align the hiring criteria"
        },
        "expertTake": {
          "zh": "招聘协作把用人团队的需求、人才寻访和评估连接起来，减少各说各的标准。",
          "en": "Recruitment collaboration connects hiring needs, talent sourcing and assessment so the parties are working with compatible criteria."
        },
        "scenario": {
          "zh": "用人方希望候选人懂某项技术时，可以追问实际要完成的任务，整理可观察的经验和评估问题，再用候选人案例核对双方对要求的理解。",
          "en": "If a hiring team asks for expertise in a technology, clarify the work it supports, define observable experience and assessment questions, then use candidate examples to check that both sides mean the same thing."
        },
        "deliverable": {
          "zh": "岗位要求、人才画像与评估问题的对照记录",
          "en": "A record linking role requirements, candidate profiles and assessment questions"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "招聘专家"
      }
    ]
  },
  "抗压": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "直播例把抗压与多项现场任务并列，招聘例写出紧急补编和多方协作，需求分析例明确提到投标加班。可以据此追问：任务撞在一起时怎样分工，延期或超时怎样处理？",
      "en": "The live-session example pairs pressure with concurrent tasks; the recruitment example describes urgent hiring and coordination; the systems role explicitly mentions bid-related overtime. Ask how competing tasks, delays and extra hours are handled."
    },
    "examples": [
      {
        "task": {
          "zh": "现场多件事同时接住",
          "en": "Keep several live tasks moving"
        },
        "expertTake": {
          "zh": "抗压出现在控场、观众回应和物料准备旁边，指向实时互动中不断切换任务的要求。",
          "en": "Pressure sits beside live-session control, audience responses and prop preparation, pointing to switching between tasks in real time."
        },
        "scenario": {
          "zh": "直播中观众追问商品细节、下一件样品又没准备好时，可以先核对信息，和主播及现场协作者同步处理顺序，把未解答的问题记下来继续跟进。",
          "en": "If viewers ask product questions while the next sample is not ready, verify the information, coordinate the order of actions with the host and others on site, and keep track of questions still awaiting an answer."
        },
        "deliverable": {
          "zh": "直播执行记录与现场问题跟进清单",
          "en": "A session execution record and follow-up list for live issues"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "直播助播"
      },
      {
        "task": {
          "zh": "紧急招聘里盯住多方进度",
          "en": "Track dependencies in urgent hiring"
        },
        "expertTake": {
          "zh": "招聘时限要靠寻访、面试、谈薪与入职多个步骤配合，推进结果受多方安排影响。",
          "en": "An urgent hire depends on sourcing, interviews, offer discussions and onboarding, with progress affected by several parties' schedules."
        },
        "scenario": {
          "zh": "候选人和面试官都临时改时间时，可以更新排期、标出会影响入职的节点，并同步可替代安排，向用人团队说明哪些进度已经变化。",
          "en": "If both the candidate and interviewer change availability, update the schedule, identify the implications for the intended start and communicate alternative arrangements and the changed timeline to the hiring team."
        },
        "deliverable": {
          "zh": "候选人进度表、排期变更与阻碍事项",
          "en": "A candidate tracker with scheduling changes and blockers"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "技术招聘负责人"
      },
      {
        "task": {
          "zh": "把投标节点和需求对清",
          "en": "Align requirements with the bid schedule"
        },
        "expertTake": {
          "zh": "这例既要求跟进需求评审和研发，也明确提到投标加班，时间安排应单独核实。",
          "en": "This example combines requirements reviews and development follow-up with explicitly stated bid-related overtime, making the time arrangements a concrete question."
        },
        "scenario": {
          "zh": "投标前需求还在变化时，可以记录新增内容、依赖的研发答复和材料缺口，提出处理顺序，并在面试中追问这种集中加班的频率与安排。",
          "en": "If requirements change before a bid, record the additions, the answers needed from development and gaps in the materials, then propose an order of work. Ask how often such overtime occurs and how it is arranged."
        },
        "deliverable": {
          "zh": "需求变更、研发待答与投标材料缺口清单",
          "en": "A list of requirements changes, development questions and bid-material gaps"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "人力数字化需求分析师"
      }
    ]
  },
  "责任心": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "门店责任心围绕货品与交接，活动运营围绕发布准确，渠道管理围绕关系维护和策略执行。把品质词落到具体错误与检查动作，才能说明自己负责什么、完成如何被看见。",
      "en": "Retail responsibility concerns stock and handovers; campaign operations concerns publishing accurately; channel management concerns relationships and execution. Connect the quality to specific errors and checks so responsibility has a visible object and completion point."
    },
    "examples": [
      {
        "task": {
          "zh": "把货品和交接核对清楚",
          "en": "Keep stock and handovers clear"
        },
        "expertTake": {
          "zh": "责任心连接接待、整理、收银与盘点，体现为日常记录和交接能被核对。",
          "en": "Responsibility links service, stock handling, checkout and stocktaking through daily records and handovers that others can check."
        },
        "scenario": {
          "zh": "交班时发现货架数量和记录不一致，可以先核对销售、退换与移位情况，把未查清的差异记进交接单，交给负责核对的人继续处理。",
          "en": "If shelf stock differs from the record at handover, check sales, returns and stock movements. Put unresolved differences in the handover note for the person responsible for reconciliation."
        },
        "deliverable": {
          "zh": "货品核对表与未结事项交接单",
          "en": "A stock check and handover note for unresolved items"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "服装门店兼职"
      },
      {
        "task": {
          "zh": "发布前把内容再核一遍",
          "en": "Check the details before publication"
        },
        "expertTake": {
          "zh": "这里的责任心有具体落点：活动文案、页面和临时配置需要一致，测试问题要留下记录。",
          "en": "Responsibility has a concrete object here: campaign copy, pages and temporary configurations need to agree, with test issues recorded."
        },
        "scenario": {
          "zh": "活动临时改时间时，可以逐项核对页面文案、链接和配置里的日期，检查修改后的展示，再把仍需最终审核的内容交给负责发布的人。",
          "en": "When an event date changes, check the copy, links and configured dates, inspect the updated display and send anything needing final review to the person responsible for publication."
        },
        "deliverable": {
          "zh": "上线核对清单、测试记录与待审核项",
          "en": "A publication checklist, test record and review points"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "频道运营实习生"
      },
      {
        "task": {
          "zh": "跟进区域策略的执行情况",
          "en": "Track regional strategy implementation"
        },
        "expertTake": {
          "zh": "渠道责任围绕市场维护、策略落实和政策传达，需要持续记录执行情况与反馈。",
          "en": "Channel responsibility covers market relationships, strategy execution and policy communication, with ongoing attention to progress and feedback."
        },
        "scenario": {
          "zh": "某项区域销售安排没有按计划推进时，可以核对渠道收到的政策、已完成的工作和具体阻碍，整理需要公司确认的事项，再跟踪答复是否传达到位。",
          "en": "If a regional sales initiative stalls, check what each channel received, what it has done and what is blocking progress. Consolidate questions for the company and track whether the answers reach the channels."
        },
        "deliverable": {
          "zh": "渠道执行跟踪表与政策问题答复记录",
          "en": "A channel execution tracker and policy question log"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "区域渠道经理"
      }
    ]
  },
  "适应": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "施工适应的是作业环境，人力伙伴适应的是任务节奏，医疗销售适应的是跨地点工作。别只回答自己能吃苦，分别确认环境与防护、优先级安排，以及出差频率和费用。",
      "en": "The site role adapts to working conditions, the HR partner to changing demands, and the sales role to travel. Clarify protection and site conditions, how priorities are set, and the frequency and cost arrangements of travel."
    },
    "examples": [
      {
        "task": {
          "zh": "在工地条件下完成作业",
          "en": "Work within site conditions"
        },
        "expertTake": {
          "zh": "适应工地对应测量、验收和工序交接，重点是现场条件怎样影响这些工作。",
          "en": "Adapting to the site concerns measurement, inspection and process handovers under the conditions where those tasks take place."
        },
        "scenario": {
          "zh": "现场条件影响材料验收时，可以记录作业条件和未完成的检查项，向负责现场安排的人说明影响，再核对后续验收与工序交接如何衔接。",
          "en": "If site conditions affect a material inspection, record the conditions and outstanding checks, explain the impact to the person coordinating the site and clarify the inspection and handover arrangements."
        },
        "deliverable": {
          "zh": "现场检查记录与工序交接事项表",
          "en": "A site inspection record and process-handover list"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "工程施工员"
      },
      {
        "task": {
          "zh": "在变化需求里排清先后",
          "en": "Prioritize changing business requests"
        },
        "expertTake": {
          "zh": "适应快节奏落在组织与人才工作的多项需求上，需要不断明确先做哪件事。",
          "en": "Adapting to pace concerns multiple organization and talent requests, with repeated clarification of what should happen first."
        },
        "scenario": {
          "zh": "业务团队同时提出招聘与组织调整需求时，可以列出每项的时点、所需信息和依赖，带着冲突去确认优先级，再向各方同步调整后的安排。",
          "en": "If a team requests hiring support and an organizational change at the same time, list the timing, information and dependencies for each. Take the conflict to a priority discussion and communicate the agreed sequence."
        },
        "deliverable": {
          "zh": "需求优先级、依赖事项与进度安排",
          "en": "A prioritized request list with dependencies and timing"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "人力业务伙伴"
      },
      {
        "task": {
          "zh": "把区域工作排进出差行程",
          "en": "Plan regional work around travel"
        },
        "expertTake": {
          "zh": "适应在这里有明确地点维度：销售、回款和推广活动伴随频繁出差。",
          "en": "Adaptation has a geographic dimension here: sales, collections and professional promotion involve frequent travel."
        },
        "scenario": {
          "zh": "同一区域有客户拜访、回款跟进与推广活动时，可以整理地点、预约和所需材料，形成可衔接的行程；具体出差频率和报销条件需另行确认。",
          "en": "When a region needs customer visits, collection follow-up and promotional activity, organize locations, appointments and materials into a workable itinerary. Confirm the actual travel frequency and expense arrangements separately."
        },
        "deliverable": {
          "zh": "客户事项、行程与拜访后跟进记录",
          "en": "A client-action itinerary and post-visit follow-up record"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "医疗器械销售代表"
      }
    ]
  },
  "目标": {
    "group": "管理用语",
    "summary": {
      "zh": "目标可能对准一次服务中的销售、多家门店的经营，或一笔融资业务的推进。先看哪些结果算在自己名下，再问质量、进度和收入发生冲突时怎样评价。",
      "en": "Targets may concern sales within a service encounter, performance across stores, or progress on a financing transaction. Establish which outcomes belong to the role, then ask how quality, timing and revenue are assessed when they conflict."
    },
    "examples": [
      {
        "task": {
          "zh": "把护理和销售分别做好",
          "en": "Deliver care and support product sales"
        },
        "expertTake": {
          "zh": "这份工作同时提供护理服务和推荐产品，需要兼顾顾客的服务体验与销售结果。",
          "en": "The role combines care services with product recommendations, bringing the customer experience and sales results into the same job."
        },
        "scenario": {
          "zh": "顾客做完护理后询问产品，可以说明产品信息，并把服务反馈与购买情况分别记录，便于看清问题出在服务还是销售环节。",
          "en": "A customer asks about a product after a session. Explain the product information and record service feedback separately from any purchase, so the two parts of the encounter can be reviewed."
        },
        "deliverable": {
          "zh": "服务反馈记录与产品销售记录",
          "en": "A service-feedback record and a separate product-sales record"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "足疗技师"
      },
      {
        "task": {
          "zh": "把多店经营情况放在一起看",
          "en": "Review performance across stores"
        },
        "expertTake": {
          "zh": "片区销售、建店和培训都在职责内，需要分别整理各店的经营进展、待办和问题。",
          "en": "The role covers regional sales, store openings and training. It involves keeping track of each store's progress, outstanding tasks and problems."
        },
        "scenario": {
          "zh": "一间店销售下降，另一间店正在筹备开业，可以分别整理销售变化、开店待办和培训缺口，让团队看清哪些事项需要先推进。",
          "en": "One store has falling sales while another is preparing to open. Separate the sales changes, opening tasks and training gaps so the team can see what needs attention."
        },
        "deliverable": {
          "zh": "片区经营汇总与分店行动清单",
          "en": "A regional operating review with an action list for each store"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "体验店运营代表"
      },
      {
        "task": {
          "zh": "把渠道线索推进成融资业务",
          "en": "Move channel leads toward financing"
        },
        "expertTake": {
          "zh": "渠道开发的结果要接到具体客户的融资办理，工作需要衔接厂商、客户信息与业务进度。",
          "en": "Channel development connects equipment vendors with specific customer financing needs, linking contact information to transaction progress."
        },
        "scenario": {
          "zh": "设备厂商转来一个有融资需求的客户，可以先整理需求和已有材料，再跟进缺失信息与办理进展，说明业务目前卡在哪一步。",
          "en": "An equipment vendor refers a customer seeking financing. Organize the request and available documents, follow up missing information, and show where the transaction currently stands."
        },
        "deliverable": {
          "zh": "客户融资需求摘要与业务进度表",
          "en": "A customer financing brief and a transaction-progress tracker"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "融资渠道经理"
      }
    ]
  },
  "服务": {
    "group": "协作与服务",
    "summary": {
      "zh": "服务的对象可能是制造现场、进店顾客，也可能是远程使用产品的客户。对应的完成标准分别落在技术可用、接待体验和故障处理上：谁来确认服务已完成？",
      "en": "Service may support a manufacturing team, a store visitor or a remote product user. Completion therefore concerns technical usability, the customer experience or fault resolution. Ask who confirms that the service has achieved its purpose."
    },
    "examples": [
      {
        "task": {
          "zh": "让设计文件支持现场制造",
          "en": "Make design information usable in production"
        },
        "expertTake": {
          "zh": "这里的服务是把设计与技术说明交给制造环节，使现场能据此理解结构、处理技术问题。",
          "en": "Here, service means supplying designs and technical explanations that manufacturing teams can use to understand the structure and address technical questions."
        },
        "scenario": {
          "zh": "装配人员发现图纸与现场理解不一致，可以核对相关设计，整理差异和说明，让制造方清楚下一步应依据哪个版本继续沟通。",
          "en": "An assembly team interprets a drawing differently from the design intent. Check the relevant material and document the discrepancy, making the version under discussion clear to manufacturing."
        },
        "deliverable": {
          "zh": "设计疑问清单与技术说明记录",
          "en": "A design-query list and a record of technical clarifications"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "结构工程师"
      },
      {
        "task": {
          "zh": "把接待要求教给店员",
          "en": "Turn service expectations into staff practice"
        },
        "expertTake": {
          "zh": "副店长要把消费者体验转成店员可以学习、练习和改进的接待做法。",
          "en": "The deputy manager translates the desired customer experience into reception practices that staff can learn, rehearse and improve."
        },
        "scenario": {
          "zh": "顾客进店后反复等待指引，可以梳理从迎接到介绍产品的步骤，用实际情境带店员演练，再记录哪里仍容易让顾客等候。",
          "en": "Visitors repeatedly wait for guidance. Map the steps from greeting to product introduction, rehearse a typical encounter with staff, and note where customers are still left waiting."
        },
        "deliverable": {
          "zh": "接待演练清单与服务改进记录",
          "en": "A service-rehearsal checklist and a record of improvements"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "体验店副店长"
      },
      {
        "task": {
          "zh": "解决故障，也收回使用反馈",
          "en": "Resolve faults and collect user feedback"
        },
        "expertTake": {
          "zh": "售后支持要在线协助客户排障，再把处理情况和满意度反馈给交付团队。",
          "en": "After-sales support helps customers troubleshoot remotely and feeds both the resolution record and satisfaction feedback back to the delivery team."
        },
        "scenario": {
          "zh": "海外客户反馈设备无法正常使用，可以先整理现象和排查经过；恢复使用后再记录客户反馈，把尚未解决的问题一并转给交付团队。",
          "en": "An overseas customer reports that a device is not working properly. Record the symptoms and troubleshooting steps; after use resumes, collect feedback and pass any unresolved issues to delivery."
        },
        "deliverable": {
          "zh": "故障处理记录与客户反馈摘要",
          "en": "A troubleshooting record and a customer-feedback summary"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "售后技术支持"
      }
    ]
  },
  "逻辑": {
    "group": "技能与工具",
    "summary": {
      "zh": "逻辑分别落在账务规则、程序运行和业务解释上。三者都需要让别人看懂推导过程，但检查方式不同：对单据、跑程序，还是核对数据的统计范围和计算方法？",
      "en": "Logic is applied to accounting rules, program behaviour and business explanations. Each requires a traceable line of reasoning, but the check differs: reconcile documents, run the program, or verify the analytical definitions."
    },
    "examples": [
      {
        "task": {
          "zh": "把贸易业务对应到账务规则",
          "en": "Connect trade transactions to accounting rules"
        },
        "expertTake": {
          "zh": "外贸会计需要把交易、外币金额和往来记录对应起来，理解各项业务怎样进入账务处理。",
          "en": "A trade accountant connects transactions, foreign-currency amounts and account records, understanding how the underlying business enters the books."
        },
        "scenario": {
          "zh": "一笔外币收款与台账金额对不上，可以把相关业务记录、币种和计算依据列在一起，区分是登记差异还是需要进一步核对的事项。",
          "en": "A foreign-currency receipt does not match the ledger. Bring together the transaction record, currency and calculation basis, distinguishing recording differences from items requiring further checks."
        },
        "deliverable": {
          "zh": "外币往来核对表与差异说明",
          "en": "A foreign-currency reconciliation with explanations of differences"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "外贸会计"
      },
      {
        "task": {
          "zh": "把功能拆成可运行的步骤",
          "en": "Break a feature into executable steps"
        },
        "expertTake": {
          "zh": "软件岗位的逻辑要体现在模块怎样接收输入、处理不同情况并输出结果。",
          "en": "In software development, reasoning appears in how a module accepts inputs, handles different cases and produces a result."
        },
        "scenario": {
          "zh": "一个表单偶尔提交失败，可以梳理输入、校验和保存的过程，找出哪种情况会中断，再用对应测试确认修改后流程能够走通。",
          "en": "A form sometimes fails to submit. Trace input, validation and saving to identify the failing case, then test that case to check whether the change fixes the flow."
        },
        "deliverable": {
          "zh": "功能流程说明与测试用例记录",
          "en": "A feature-flow description and a set of test-case results"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "软件开发工程师"
      },
      {
        "task": {
          "zh": "把营收变化解释清楚",
          "en": "Explain changes in revenue"
        },
        "expertTake": {
          "zh": "运营分析需要把客户和营收的变化连接起来，说明异常出在哪里，并提出有依据的改进方向。",
          "en": "Operations analysis connects changes in customers and revenue, locates the anomaly and develops a supported direction for improvement."
        },
        "scenario": {
          "zh": "营收下滑但客户数没有减少，可以拆看客户购买金额，并检查两期数据是否采用相同的统计范围和计算方法，再整理值得继续追查的客户或业务环节。",
          "en": "Revenue falls while customer numbers stay steady. Examine spending and the reporting scope, check for changed definitions, then identify customers or activities that warrant further investigation."
        },
        "deliverable": {
          "zh": "营收变化拆解与待验证原因清单",
          "en": "A revenue-change breakdown and a list of explanations to test"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "运营分析专员"
      }
    ]
  },
  "学习": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "学习可能是掌握现场操作、更新设计方法，或理解招聘业务。成果也不同：能完成任务、能改进作品、能讲清岗位。可以追问：学到什么程度，由谁通过什么成果确认？",
      "en": "Learning may mean acquiring production skills, updating design methods or understanding a hiring business. The result could be completing a task, improving a design or explaining a role. Ask what demonstrates learning and who reviews that evidence."
    },
    "examples": [
      {
        "task": {
          "zh": "边学生产技术边辅助现场",
          "en": "Learn production techniques through support work"
        },
        "expertTake": {
          "zh": "生产实习把技术学习与现场辅助放在一起，需要把学到的要求用于当下的生产和整理工作。",
          "en": "This internship combines technical learning with production support, applying what is learned to current shop-floor tasks and workplace organization."
        },
        "scenario": {
          "zh": "刚接触一道生产工序时，可以先记录操作步骤和注意事项，再对照辅助任务整理疑问；同时确认由谁答疑、哪些操作需要指导后才能进行。",
          "en": "When introduced to a production step, note the procedure and points requiring attention. Compare those notes with the support task, then ask who can answer questions and which operations require guidance first."
        },
        "deliverable": {
          "zh": "工序学习记录与现场问题清单",
          "en": "A process-learning log and a list of shop-floor questions"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "生产实习生"
      },
      {
        "task": {
          "zh": "把新方法用进品牌设计",
          "en": "Apply new methods to brand design"
        },
        "expertTake": {
          "zh": "设计经理的学习要服务于视觉体系与传播制作，让方法更新在具体作品上体现出来。",
          "en": "For a design manager, learning supports the visual system and communications work, with updated methods demonstrated through actual designs."
        },
        "scenario": {
          "zh": "同一品牌在不同渠道的画面不够统一，可以对照现有作品找出差异，试做一组新版样稿，并说明新方法改善了哪些表达问题。",
          "en": "A brand looks inconsistent across channels. Compare existing work, identify the differences, and produce a revised sample set that shows what the new approach improves."
        },
        "deliverable": {
          "zh": "视觉对照样稿与方法改进说明",
          "en": "Comparative visual samples and an explanation of the revised approach"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "品牌设计经理"
      },
      {
        "task": {
          "zh": "学懂业务，再向候选人说明",
          "en": "Understand the business before explaining the role"
        },
        "expertTake": {
          "zh": "招聘专员需要把业务知识转成能理解岗位、沟通候选人的内容，并用于海内外招聘。",
          "en": "The recruiter turns business knowledge into an understanding of roles and explanations that can be used with candidates in domestic and overseas hiring."
        },
        "scenario": {
          "zh": "接到一个陌生业务的岗位后，可以先整理产品、团队和工作任务，再把不懂的术语列给用人方确认，形成能向候选人讲清楚的介绍。",
          "en": "For an unfamiliar business role, outline the product, team and tasks. Take unclear terms back to the hiring team, then prepare an explanation a candidate can understand."
        },
        "deliverable": {
          "zh": "岗位业务说明与候选人沟通提纲",
          "en": "A role-and-business brief with a candidate-conversation outline"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "海外招聘专员"
      }
    ]
  },
  "统筹": {
    "group": "协作与服务",
    "summary": {
      "zh": "统筹可能串起连续工序，也可能同时照看多个项目，或安排跨项目的人力需求。先辨认自己协调的是流程还是资源，再问：冲突出现时，谁确定优先次序？",
      "en": "Coordination may connect production stages, oversee several projects or organize staffing needs across projects. Identify whether the role coordinates a process or allocates resources, then ask who sets priorities when demands conflict."
    },
    "examples": [
      {
        "task": {
          "zh": "让各道工序对齐颜色要求",
          "en": "Keep production stages aligned on colour"
        },
        "expertTake": {
          "zh": "染色工程师需要贯通首样批色、过程监控与调整，让颜色要求在生产过程中持续可检查。",
          "en": "The dyeing engineer connects initial sample approval, process monitoring and adjustments so colour requirements remain checkable throughout production."
        },
        "scenario": {
          "zh": "首样与后续批次出现色差时，可以整理各阶段样品和过程记录，标出差异从哪里出现，再跟进相关调整后颜色是否达到要求。",
          "en": "Later batches differ in colour from the initial sample. Compare samples and process records to locate where the difference emerged, then check the colour after the relevant adjustments."
        },
        "deliverable": {
          "zh": "颜色监控记录与调整跟踪表",
          "en": "A colour-monitoring record and an adjustment tracker"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "染色工程师"
      },
      {
        "task": {
          "zh": "把项目和外部协作排在一起",
          "en": "Coordinate projects and external commitments"
        },
        "expertTake": {
          "zh": "区域项目经理同时处理项目交付和政企协作，需要把不同事项的节点、依赖与进展理清。",
          "en": "The regional manager handles both project delivery and government or enterprise relationships, organizing milestones, dependencies and progress across these commitments."
        },
        "scenario": {
          "zh": "一个项目等交付材料，另一个项目要准备对接活动，可以列清两边的节点、待办和所需协作，把时间冲突及影响范围提交讨论。",
          "en": "One project needs delivery materials while another is preparing a stakeholder event. List the milestones, tasks and coordination needed, then bring scheduling conflicts and their consequences into discussion."
        },
        "deliverable": {
          "zh": "多项目进度表与协作事项清单",
          "en": "A multi-project schedule and a list of coordination tasks"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "区域项目经理"
      },
      {
        "task": {
          "zh": "让美术资源对应项目优先级",
          "en": "Match art resources to project priorities"
        },
        "expertTake": {
          "zh": "美术资源管理要把内部人才、外包能力和项目需求放在一起，为资源调度建立可比较的依据。",
          "en": "Art-resource management brings together internal talent, outsourcing capacity and project needs to provide a basis for comparing allocation options."
        },
        "scenario": {
          "zh": "两个项目同时需要同类美术能力，可以先整理需求时间、工作量和可用人选，再列出不同安排的影响，供资源调度时讨论取舍。",
          "en": "Two projects need the same art specialization. Gather timing, workload and available talent, then show how different assignments would affect each project so the trade-offs can be discussed."
        },
        "deliverable": {
          "zh": "美术需求排期与资源调配方案",
          "en": "An art-demand schedule and resource-allocation options"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "游戏美术资源经理"
      }
    ]
  },
  "主动": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "主动可以是先获取市场信息、先跟进客户，也可以是先把订单问题报出来。值得问清的是：哪些事需要主动发现，能自行推进到哪一步，什么时候需要交接？",
      "en": "Initiative may mean gathering market information, following up with a customer or flagging an order problem. Ask what you are expected to notice, what you can handle yourself, and when to involve someone else."
    },
    "examples": [
      {
        "task": {
          "zh": "把渠道反馈带回产品讨论",
          "en": "Bring channel feedback into product discussions"
        },
        "expertTake": {
          "zh": "金融渠道工作中的主动，落实在接触渠道、收集市场信息，并把客户反馈整理成可讨论的问题。",
          "en": "Initiative in financial channels means engaging contacts, collecting market information and turning customer feedback into questions the business can discuss."
        },
        "scenario": {
          "zh": "渠道反复提到客户看不懂某项产品说明，可以整理具体疑问与出现情境，汇总给业务团队，跟进是否需要补充解释材料。",
          "en": "Channel contacts repeatedly report that customers struggle with part of a product explanation. Gather the actual questions and contexts, share them with the business team, and follow up on explanatory material."
        },
        "deliverable": {
          "zh": "渠道反馈摘要与问题跟进记录",
          "en": "A channel-feedback summary and an issue-follow-up log"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "金融渠道经理"
      },
      {
        "task": {
          "zh": "围绕购车需求持续跟进",
          "en": "Follow through on a customer’s buying needs"
        },
        "expertTake": {
          "zh": "汽车销售的主动需要围绕客户需求推进咨询和后续联系，并与实际销售流程衔接。",
          "en": "In car sales, initiative means moving the conversation and follow-up forward around the customer’s needs within the sales process."
        },
        "scenario": {
          "zh": "客户看过车后仍在比较，可以整理其用途、关注点和未解答的问题，约定下一次沟通内容，再记录后续反馈和需求变化。",
          "en": "After a visit, a customer is still comparing cars. Record their intended use, priorities and unanswered questions, agree on the next conversation, and update the notes as their needs become clearer."
        },
        "deliverable": {
          "zh": "客户需求记录与后续跟进清单",
          "en": "A customer-needs record and a follow-up list"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "汽车销售"
      },
      {
        "task": {
          "zh": "提前发现订单卡点并反馈",
          "en": "Flag order problems before they escalate"
        },
        "expertTake": {
          "zh": "跟单岗位的主动，是在订单、出货和回款之间持续检查进展，把问题及时送到相关处理环节。",
          "en": "For an order coordinator, initiative means monitoring orders, dispatch and payments, then getting emerging problems to the relevant part of the process."
        },
        "scenario": {
          "zh": "发现出货信息与客户约定不一致时，可以先核对订单和当前进展，再把差异及可能影响反馈出去，持续记录后续处理与客户回复。",
          "en": "Dispatch information differs from the customer agreement. Check the order and current progress, report the discrepancy and its potential impact, then track the response and the customer’s reply."
        },
        "deliverable": {
          "zh": "订单异常清单与客户沟通记录",
          "en": "An order-exception list and a customer-communication log"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "客户跟单专员"
      }
    ]
  },
  "英语": {
    "group": "技能与工具",
    "summary": {
      "zh": "英语可能用于读懂监管要求、写清技术问题，也可能贯穿采购谈判与对账。准备时应拿对应任务来练；面试可以问：日常最常读、写或说的材料分别是什么？",
      "en": "English may be used to interpret registration requirements, document technical issues, or conduct procurement discussions and reconciliations. Practise the relevant task, and ask which materials and conversations are most common in the role."
    },
    "examples": [
      {
        "task": {
          "zh": "把注册要求读懂并回应清楚",
          "en": "Understand and respond to registration requirements"
        },
        "expertTake": {
          "zh": "海外注册需要用英语读专业要求、组织申报材料，并与审核机构和客户说明相关问题。",
          "en": "Overseas registration uses English to read technical requirements, organize submission materials and discuss related questions with reviewers and customers."
        },
        "scenario": {
          "zh": "审核方要求补充一项材料时，可以读清问题指向，找到已有资料中的对应部分，整理待补内容，再写明准备回应的要点。",
          "en": "A reviewer requests additional material. Identify precisely what is being asked, locate the relevant existing information, list what is missing, and draft the points the response needs to cover."
        },
        "deliverable": {
          "zh": "补充材料清单与英文回应提纲",
          "en": "A supplemental-material checklist and an English response outline"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "医疗器械海外注册"
      },
      {
        "task": {
          "zh": "读技术资料，写清测试问题",
          "en": "Read technical material and document test issues"
        },
        "expertTake": {
          "zh": "系统工程师的英语读写要能支持技术文档、测试用例和问题说明，使技术信息准确传递。",
          "en": "English reading and writing support technical documentation, test cases and issue explanations, allowing technical information to be communicated accurately."
        },
        "scenario": {
          "zh": "阅读一段英文接口说明后，可以把关键限制写进测试用例；若测试失败，再用清楚的英文描述输入条件、复现步骤和观察到的结果。",
          "en": "After reading an English interface specification, carry its key constraints into a test case. If the test fails, describe the inputs, reproduction steps and observed result clearly in English."
        },
        "deliverable": {
          "zh": "英文测试用例与问题复现说明",
          "en": "English test cases and an issue-reproduction note"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "自动驾驶系统工程师"
      },
      {
        "task": {
          "zh": "用英语谈条件并核对履约",
          "en": "Discuss terms and check fulfilment in English"
        },
        "expertTake": {
          "zh": "海外采购把英语用于询价、谈判和物流对账，需要把口头沟通落成可核对的商务信息。",
          "en": "Overseas procurement uses English for quotations, negotiations and logistics reconciliation, translating conversations into business information that can be checked."
        },
        "scenario": {
          "zh": "供应商报价与后来提供的运输费用不一致，可以把报价条件、货物信息和费用项列清，再用英语逐项询问并记录对方确认的内容。",
          "en": "A supplier’s quotation differs from the subsequent freight charges. Set out the quoted terms, shipment information and charges, then query each item in English and record the supplier’s clarification."
        },
        "deliverable": {
          "zh": "英文询价记录与费用核对表",
          "en": "An English quotation record and a cost-reconciliation sheet"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "海外采购工程师"
      }
    ]
  },
  "严谨": {
    "group": "品质与工作方式",
    "summary": {
      "zh": "严谨在这里分别保护试样过程、采购约定和财务报表的可追溯性。关键不只是少犯错，还要让别人找到依据。可以问：哪些变更必须留痕，最终由谁复核？",
      "en": "Rigor preserves traceability in sample trials, purchasing commitments and financial reporting. It means not only avoiding errors but leaving evidence others can follow. Ask which changes must be recorded and who performs the final review."
    },
    "examples": [
      {
        "task": {
          "zh": "让每次试样都有迹可查",
          "en": "Make each sample trial traceable"
        },
        "expertTake": {
          "zh": "工艺工程师需要把样品变化、过程数据与客户技术档案对应起来，方便后续核对和继续调整。",
          "en": "The process engineer connects sample changes, process data and customer technical records so subsequent checks and adjustments have a traceable basis."
        },
        "scenario": {
          "zh": "调整工艺后样品表现发生变化，可以保留调整前后的参数、样品标识和观察结果，避免下一轮只记得效果，却找不到对应做法。",
          "en": "A process adjustment changes a sample’s performance. Retain the before-and-after parameters, sample identifiers and observations so the next trial can connect the result to the method used."
        },
        "deliverable": {
          "zh": "试样参数对照与技术档案更新",
          "en": "A trial-parameter comparison and updated technical records"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "涂料工艺工程师"
      },
      {
        "task": {
          "zh": "让采购单据和约定一致",
          "en": "Keep purchasing records aligned with agreed terms"
        },
        "expertTake": {
          "zh": "采购中的严谨，要把供应商条件、合同和系统流程相互核对，减少同一事项出现不同版本。",
          "en": "Rigor in procurement means checking supplier terms, contracts and system records against one another so the same commitment is represented consistently."
        },
        "scenario": {
          "zh": "供应商改了交期，但采购系统仍是旧日期，可以核对双方确认的内容，标出哪些合同或订单记录需要同步，留下变更的依据。",
          "en": "A supplier changes the delivery date while the purchasing system still shows the old one. Check what was confirmed, identify the affected contract or order records, and retain the basis for the change."
        },
        "deliverable": {
          "zh": "采购变更核对表与确认记录",
          "en": "A purchasing-change checklist and confirmation record"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "采购主管"
      },
      {
        "task": {
          "zh": "让报表数字能追溯到依据",
          "en": "Make reported figures traceable to their basis"
        },
        "expertTake": {
          "zh": "总账工作需要把成本、合并报表和相关资料连起来，让复核人员能追查数字及调整的来由。",
          "en": "General-ledger work connects costs, consolidated statements and supporting material so reviewers can trace reported figures and adjustments."
        },
        "scenario": {
          "zh": "合并报表出现一项难以解释的差额，可以回到明细和调整记录逐项核对，整理差异来源及待确认事项，供后续复核处理。",
          "en": "An unexplained difference appears in a consolidated statement. Work back through the details and adjustment records, then document the sources of the difference and the items still requiring review."
        },
        "deliverable": {
          "zh": "报表勾稽核对表与调整说明",
          "en": "A statement-reconciliation worksheet and adjustment notes"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "总账会计"
      }
    ]
  },
  "闭环": {
    "group": "管理用语",
    "summary": {
      "zh": "闭环可能指追完一次生产异常、把现场问题送进模型改进，或建设技术数据回路。先认清它围绕什么对象运转，再问：什么证据才算完成，谁来确认？",
      "en": "A closed loop may mean following a production issue through, feeding field problems into model improvement, or supporting a technical data cycle. Identify the object of the loop, then ask what evidence establishes completion and who confirms it."
    },
    "examples": [
      {
        "task": {
          "zh": "跟进异常，直到结果可核对",
          "en": "Follow a production issue through to a checkable result"
        },
        "expertTake": {
          "zh": "班组长要把生产异常从记录带到改善跟进，让问题的后续处理和结果能够被核对。",
          "en": "The shift lead carries a production issue from its initial record into improvement follow-up, keeping the response and eventual result available for checking."
        },
        "scenario": {
          "zh": "生产中反复出现同类异常，可以先整理发生环节和处理记录，跟进改善事项，再对照后续记录检查问题是否仍在重复出现。",
          "en": "The same problem recurs in production. Gather where it occurs and how it has been handled, follow the improvement actions, then check later records to see whether it continues to recur."
        },
        "deliverable": {
          "zh": "生产异常记录与改善跟踪表",
          "en": "A production-issue record and improvement tracker"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "生产班组长"
      },
      {
        "task": {
          "zh": "把现场失败变成改进线索",
          "en": "Turn field failures into useful model feedback"
        },
        "expertTake": {
          "zh": "AI 交付运营要把接管和失败案例整理成模型团队能够定位的问题，再跟进后续表现。",
          "en": "AI delivery operations organizes interventions and failures into problems the model team can investigate, then follows subsequent performance."
        },
        "scenario": {
          "zh": "现场同一类任务多次需要人工接管，可以整理任务条件、失败表现和接管原因，将相似案例放在一起，便于模型团队检查改进方向。",
          "en": "A type of field task repeatedly needs human intervention. Collect the task conditions, failure behaviour and reason for intervention, then group similar cases for the model team to investigate."
        },
        "deliverable": {
          "zh": "任务失败案例集与模型改进需求摘要",
          "en": "A task-failure case set and a model-improvement brief"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "AI 交付技术运营"
      },
      {
        "task": {
          "zh": "让压缩规格服务数据回传",
          "en": "Align compression specifications with data return needs"
        },
        "expertTake": {
          "zh": "算法工程师要把数据回路的需求转成压缩规格，并同时检查功耗、性能和面积约束。",
          "en": "The algorithm engineer translates data-cycle needs into compression specifications while checking power, performance and area constraints."
        },
        "scenario": {
          "zh": "某种压缩设置减少了数据量，却丢失后续使用需要的画面信息，可以比较不同设置的保留效果和资源开销，说明可选方案的取舍。",
          "en": "A compression setting reduces data volume but loses visual information needed later. Compare information retention and resource costs across settings, then explain the trade-offs between the options."
        },
        "deliverable": {
          "zh": "压缩方案对比与工程约束验证记录",
          "en": "A compression-option comparison and engineering-constraint checks"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "AI 视频压缩算法工程师"
      }
    ]
  },
  "执行力": {
    "group": "管理用语",
    "summary": {
      "zh": "执行可能是把商户方案落实、把设备诊断推进到改善，或按既定流程处理城市业务。要看从什么动作开始、以什么结果结束，再问：遇到例外时能调整哪些步骤？",
      "en": "Execution may put a merchant plan into practice, carry equipment diagnosis into improvement, or apply an established city-operations procedure. Identify the starting action and end result, then ask which steps can change when an exception arises."
    },
    "examples": [
      {
        "task": {
          "zh": "让商户营销方案落到动作",
          "en": "Turn a merchant plan into concrete actions"
        },
        "expertTake": {
          "zh": "本地生活运营需要围绕商户情况制定营销方案，再把方案变成可以逐项推进的工作。",
          "en": "Local-services operations develops a marketing plan around a merchant’s situation and turns it into actions that can be followed through."
        },
        "scenario": {
          "zh": "商户认可了活动方向，却还没有准备好上线材料，可以列清待办、信息缺口和需要配合的人，把方案推进到具体准备与执行步骤。",
          "en": "A merchant agrees with the campaign direction but has not prepared the launch material. Identify tasks, missing information and people whose input is needed, then move the plan into preparation and delivery."
        },
        "deliverable": {
          "zh": "商户活动执行清单与进度记录",
          "en": "A merchant-campaign action list and progress record"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "本地生活运营"
      },
      {
        "task": {
          "zh": "把设备异常推进到改善",
          "en": "Carry equipment diagnosis into improvement"
        },
        "expertTake": {
          "zh": "设备工程师的执行，包含处理异常、提出预防措施，并跟进机台表现是否得到改善。",
          "en": "Execution for an equipment engineer includes handling faults, proposing preventive measures and tracking whether machine performance improves."
        },
        "scenario": {
          "zh": "一台设备反复出现同类告警，可以整理发生条件与处理经过，提出可检查的预防措施，再对照后续运行记录跟踪异常是否减少。",
          "en": "A machine repeatedly raises the same alarm. Document the conditions and responses, propose preventive measures that can be checked, then follow later operating records to see whether the problem recurs less often."
        },
        "deliverable": {
          "zh": "设备异常分析与预防措施跟踪表",
          "en": "An equipment-issue analysis and preventive-action tracker"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "半导体设备工程师"
      },
      {
        "task": {
          "zh": "按流程推进订单与安全事项",
          "en": "Apply procedures to orders and vehicle safety"
        },
        "expertTake": {
          "zh": "城市业务主管要把订单、车辆质量安全等事务放进既定 SOP 和对接流程中处理。",
          "en": "The city operations supervisor handles orders and vehicle quality or safety matters through established procedures and external coordination processes."
        },
        "scenario": {
          "zh": "订单处理中出现车辆质量反馈，可以按现有流程整理订单、车辆情况和处理进度，标记尚未解决的事项，方便后续岗位继续跟进。",
          "en": "A vehicle-quality concern arises while an order is being handled. Follow the existing procedure to organize the order details, vehicle information and progress, marking unresolved items for subsequent follow-up."
        },
        "deliverable": {
          "zh": "订单与车辆问题记录及流程跟踪表",
          "en": "An order-and-vehicle issue record with procedural follow-up"
        },
        "reviewStatus": "model_draft",
        "sourceRoleZh": "城市业务主管"
      }
    ]
  }
};
