const STORAGE_KEY = "lighthouse-attention-state-v1";

const DEFAULT_GOALS = [
  {
    id: "goal_primary",
    title: "履约陪伴 Agent 从方案设计到灰度上线的闭环推进",
    priority: 1
  },
  {
    id: "goal_sop",
    title: "Agent SOP 标准化沉淀工具",
    priority: 2
  },
  {
    id: "goal_strategy",
    title: "协商方案能力与延期场景验证",
    priority: 3
  }
];

const CATEGORY_DEFINITIONS = [
  {
    id: "strategy",
    title: "协商方案能力与延期场景",
    keywords: ["协商", "延期", "资格", "金额", "策略", "通知卡片", "方案"]
  },
  {
    id: "sop",
    title: "Agent SOP 标准化与效率工具",
    keywords: ["sop", "SOP", "模板", "流程图", "沉淀", "标准化", "skill", "效率"]
  },
  {
    id: "case",
    title: "线上 case 回流与评测",
    keywords: ["case", "Case", "bad case", "评测", "L2", "L3", "红线", "初筛", "字段核对"]
  },
  {
    id: "touch",
    title: "IVR 语音提醒与多渠道触达",
    keywords: ["IVR", "ivr", "触达", "外呼", "语音", "提醒", "队列", "话术"]
  },
  {
    id: "alignment",
    title: "汇报材料与跨团队对齐",
    keywords: ["汇报", "PPT", "ppt", "对齐", "研发", "客服", "合作团队", "电催", "会议", "说明文档"]
  },
  {
    id: "management",
    title: "管理、答疑与带新人",
    keywords: ["新同学", "答疑", "请教", "带新人", "1on1", "周报", "审批"]
  }
];

const LOW_JUDGMENT_KEYWORDS = ["核对", "初筛", "字段", "同步", "整理", "普通 case", "材料同步"];

const SAMPLE_RECORDS = [
  {
    id: "sample_wecom_1",
    source: "wecom",
    sourceTitle: "履约陪伴 Agent 主线群",
    content: "推进履约陪伴 Agent 灰度上线边界确认、问题归因和工作流编排",
    messageCount: 16,
    activeReplies: 7,
    durationMinutes: 35
  },
  {
    id: "sample_wecom_2",
    source: "wecom",
    sourceTitle: "协商方案需求群",
    content: "确认延期能力、多方案通知卡片、资格校验和金额调整策略",
    messageCount: 26,
    activeReplies: 9,
    durationMinutes: 45
  },
  {
    id: "sample_wecom_3",
    source: "wecom",
    sourceTitle: "case 回流与评测群",
    content: "同步 bad case 修复、L2 L3 评测标准、红线规则和普通 case 初筛",
    messageCount: 24,
    activeReplies: 8,
    durationMinutes: 40
  },
  {
    id: "sample_wecom_4",
    source: "wecom",
    sourceTitle: "跨团队对齐群",
    content: "客服团队要新政策说明文档，合作团队和电催团队要预估进线数据",
    messageCount: 30,
    activeReplies: 12,
    durationMinutes: 55
  },
  {
    id: "sample_wecom_5",
    source: "wecom",
    sourceTitle: "IVR 触达联调群",
    content: "确认 IVR 语音提醒、外呼合作、字段队列映射和触达话术",
    messageCount: 18,
    activeReplies: 6,
    durationMinutes: 25
  },
  {
    id: "sample_feishu_1",
    source: "feishu",
    sourceTitle: "履约陪伴流程图文档",
    content: "编辑履约陪伴 Agent 流程图、灰度上线说明和风险兜底方案",
    documentEdits: 11,
    durationMinutes: 70
  },
  {
    id: "sample_feishu_2",
    source: "feishu",
    sourceTitle: "Agent SOP 标准化工具文档",
    content: "沉淀 SOP 生成模板、流程图转文档、人工确认和版本溯源说明",
    documentEdits: 9,
    durationMinutes: 60
  },
  {
    id: "sample_feishu_3",
    source: "feishu",
    sourceTitle: "周五汇报 PPT",
    content: "临时修改周五汇报 PPT，补充灰度问题、协商策略和跨团队进展",
    documentEdits: 7,
    durationMinutes: 35
  }
];

export function createLocalApi(options = {}) {
  const storage = options.storage ?? globalThis.localStorage;
  const now = options.now || (() => new Date());
  let memoryState = readStoredState(storage) || createInitialState(now());

  function save(nextState) {
    memoryState = {
      ...nextState,
      updatedAt: now().toISOString()
    };
    writeStoredState(storage, memoryState);
    return memoryState;
  }

  return async function localApi(path, request = {}) {
    const method = request.method || "GET";

    if (method === "GET" && path === "/api/state") {
      return { ok: true, state: memoryState };
    }

    if (method === "POST" && path === "/api/reset") {
      return { ok: true, state: save(createInitialState(now())) };
    }

    if (method === "POST" && path === "/api/goals") {
      const body = request.body || {};
      const timestamp = now().toISOString();
      const goals = (body.goals || [])
        .map((goal) => String(goal || "").trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((title, index) => ({
          id: `goal_${index + 1}`,
          title,
          priority: index + 1,
          periodId: memoryState.currentPeriod.id,
          createdAt: memoryState.goals[index]?.createdAt || timestamp,
          updatedAt: timestamp
        }));

      if (goals.length === 0) {
        throw new Error("请至少填写一个本周目标。");
      }

      const state = save({
        ...memoryState,
        currentPeriod: {
          ...memoryState.currentPeriod,
          targetFocusPercent: clamp(Number(body.targetFocusPercent), 30, 90, 60)
        },
        goals
      });
      return { ok: true, state };
    }

    if (method === "POST" && path === "/api/sync") {
      const body = request.body || {};
      const source = String(body.source || "manual");
      const traces = (Array.isArray(body.records) ? body.records : []).map((record) =>
        normalizeTrace(record, source, now())
      );
      const state = save({
        ...memoryState,
        traces: mergeTraces(memoryState.traces, traces)
      });
      return { ok: true, imported: traces.length, state };
    }

    if (method === "POST" && path === "/api/sample") {
      const traces = SAMPLE_RECORDS.map((record, index) =>
        normalizeTrace(
          {
            ...record,
            timestamp: sampleTimestamp(memoryState.currentPeriod, index)
          },
          record.source,
          now()
        )
      );
      const state = save({
        ...memoryState,
        traces: mergeTraces(memoryState.traces, traces)
      });
      return { ok: true, imported: traces.length, state };
    }

    if (method === "POST" && path === "/api/analyze") {
      const review = analyzeState(memoryState, now());
      const state = save(upsertReview(memoryState, review));
      return { ok: true, review, state };
    }

    throw new Error(`不支持的操作：${method} ${path}`);
  };
}

function createInitialState(now) {
  const period = currentWeekPeriod(now);
  const timestamp = now.toISOString();

  return {
    version: 1,
    settings: {
      periodType: "week",
      cloudSync: { enabled: false, lastResult: null }
    },
    currentPeriod: {
      ...period,
      targetFocusPercent: 60
    },
    goals: DEFAULT_GOALS.map((goal) => ({
      ...goal,
      periodId: period.id,
      createdAt: timestamp,
      updatedAt: timestamp
    })),
    traces: [],
    reviews: [],
    growthRecords: [],
    updatedAt: timestamp
  };
}

function analyzeState(state, now) {
  const period = state.currentPeriod;
  const goals = state.goals.filter((goal) => goal.periodId === period.id);
  const traces = state.traces.filter((trace) => isWithinPeriod(trace.timestamp, period));
  const allocation = buildAllocation(traces, goals, period.targetFocusPercent);
  const diagnosis = buildDiagnosis(allocation, traces, goals, period);
  const recommendations = buildRecommendations(allocation, traces, period);

  return {
    id: `review_${period.id}_${now.getTime()}`,
    periodId: period.id,
    periodLabel: period.label,
    targetFocusPercent: period.targetFocusPercent,
    createdAt: now.toISOString(),
    allocation,
    diagnosis,
    recommendations,
    growthRecords: buildGrowthRecords(state, allocation, diagnosis, now),
    evidenceCount: traces.length,
    summary: buildSummary(allocation, diagnosis)
  };
}

function upsertReview(state, review) {
  const reviews = state.reviews.filter((item) => item.periodId !== review.periodId);
  reviews.unshift(review);
  return {
    ...state,
    reviews,
    growthRecords: mergeGrowthRecords(state.growthRecords, review.growthRecords)
  };
}

function buildAllocation(traces, goals, targetFocusPercent) {
  const buckets = new Map();
  const goalKeywords = extractGoalKeywords(goals);

  buckets.set("northstar", {
    id: "northstar",
    title: "重点任务合计",
    kind: "northstar",
    relatedGoalIds: goals.map((goal) => goal.id),
    score: 0,
    evidence: []
  });

  traces.forEach((trace) => {
    const text = traceText(trace);
    const score = attentionScore(trace);
    const goalMatch = scoreKeywords(text, goalKeywords) > 0;
    const category = goalMatch ? { id: "northstar" } : classifyTrace(text);
    const bucket = buckets.get(category.id) || {
      id: category.id,
      title: category.title,
      kind: "support",
      relatedGoalIds: [],
      score: 0,
      evidence: []
    };

    bucket.score += score;
    bucket.evidence.push({
      source: trace.source,
      sourceTitle: trace.sourceTitle,
      content: trace.content,
      timestamp: trace.timestamp,
      score: round(score, 1)
    });
    buckets.set(category.id, bucket);
  });

  const items = Array.from(buckets.values()).filter((bucket) => bucket.score > 0 || bucket.id === "northstar");
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  if (totalScore <= 0) {
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      percent: 0,
      targetPercent: item.id === "northstar" ? targetFocusPercent : null,
      relatedGoalIds: item.relatedGoalIds,
      confidence: confidenceFor(item),
      evidence: [],
      reason: reasonFor(item)
    }));
  }

  return normalizePercentages(
    items.map((item) => ({
      ...item,
      rawPercent: (item.score / totalScore) * 100
    }))
  )
    .map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      percent: item.percent,
      targetPercent: item.id === "northstar" ? targetFocusPercent : null,
      relatedGoalIds: item.relatedGoalIds,
      confidence: confidenceFor(item),
      evidence: item.evidence.slice(0, 5),
      reason: reasonFor(item)
    }))
    .sort((a, b) => {
      if (a.id === "northstar") return -1;
      if (b.id === "northstar") return 1;
      return b.percent - a.percent;
    });
}

function buildDiagnosis(allocation, traces, goals, period) {
  const northstar = allocation.find((item) => item.id === "northstar");
  const supportPercent = allocation
    .filter((item) => item.id !== "northstar")
    .reduce((sum, item) => sum + item.percent, 0);
  const gap = Math.max(0, period.targetFocusPercent - (northstar?.percent || 0));
  const fragmented = traces.filter((trace) => ["wecom", "feishu"].includes(trace.source)).length >= 4;
  const lowJudgmentCount = traces.filter((trace) => containsAny(traceText(trace), LOW_JUDGMENT_KEYWORDS)).length;

  return {
    target: {
      title: gap > 0 ? "主线投入低于目标" : "主线投入达到目标",
      detail:
        gap > 0
          ? `重点任务实际投入 ${northstar?.percent || 0}%，比本周目标低 ${gap}%。`
          : `重点任务实际投入 ${northstar?.percent || 0}%，已达到本周目标。`
    },
    focus: {
      title: fragmented ? "连续推进窗口被支线穿插" : "连续推进窗口相对稳定",
      detail: fragmented
        ? `本周识别到 ${traces.length} 条工作痕迹，支线任务合计 ${supportPercent}%，主线容易被多次切开。`
        : "工作痕迹较集中，暂未发现明显的高频切换。"
    },
    ownership: {
      title: lowJudgmentCount > 0 ? "低判断成本工作仍由本人承接" : "责任归属暂未发现明显异常",
      detail:
        lowJudgmentCount > 0
          ? `核对、初筛、字段和材料同步类痕迹出现 ${lowJudgmentCount} 次，适合拆成首次把关和后续转交。`
          : "暂未发现大量重复核对或低判断成本工作。"
    },
    growth: {
      title: "重复支线需要继续沉淀",
      detail: "如果同类分流在多周内重复出现，应进入成长记录，观察是否逐步形成稳定方法。"
    },
    conclusion: buildConclusion(northstar?.percent || 0, period.targetFocusPercent, supportPercent, goals)
  };
}

function buildRecommendations(allocation, traces, period) {
  const recommendations = [];
  const northstar = allocation.find((item) => item.id === "northstar");
  const gap = period.targetFocusPercent - (northstar?.percent || 0);
  const hasAlignmentLoad = allocation.some((item) => ["alignment", "case", "touch"].includes(item.id) && item.percent >= 8);
  const hasSopOpportunity = allocation.some((item) => ["sop", "case", "strategy"].includes(item.id) && item.percent >= 10);
  const lowJudgmentCount = traces.filter((trace) => containsAny(traceText(trace), LOW_JUDGMENT_KEYWORDS)).length;

  if (gap > 0) {
    recommendations.push({
      id: "protect_morning",
      type: "保护主线",
      title: "把上午 9:00-11:30 设为主线深度工作块",
      reason: "主线投入低于目标时，优先保护没有强制会议的上午时段，把需要连续思考的主线任务放进去。",
      steps: [
        "上午只保留北极星主线相关通知",
        "9:00 用 10 分钟浏览并标记消息，不立即展开处理",
        "把灰度归因、策略判断和关键材料固定放入上午窗口"
      ],
      expectedOutcome: `优先补回 ${Math.max(5, gap)}% 的主线投入差口。`
    });
  }

  if (hasAlignmentLoad) {
    recommendations.push({
      id: "fixed_buffer",
      type: "固定缓冲",
      title: "为穿插任务建立 16:00-17:00 固定缓冲区",
      reason: "协作、case、触达和跨团队对齐都需要处理，但多数不需要即时响应；集中处理能减少全天切换。",
      steps: [
        "普通协作统一移入下午缓冲区",
        "真正阻塞交付的事项通过 @ 或电话升级",
        "同类任务批量回复，避免反复进入同一上下文"
      ],
      expectedOutcome: "必要支线仍被完成，但主线不再被每条消息重复中断。"
    });
  }

  if (hasSopOpportunity || lowJudgmentCount > 0) {
    recommendations.push({
      id: "sop_delegate",
      type: "沉淀 / 转交",
      title: "把重复核对拆成“首次把关 + 后续转交”",
      reason: "重复 case、字段核对、材料同步和规则确认适合沉淀为清单或模板，减少本人重复投入。",
      steps: [
        "本人只负责首次定义成功标准、异常类型和红线规则",
        "常规核对交给协作者或工具承接",
        "每次只把新增边界补充进统一清单"
      ],
      expectedOutcome: "从每次亲自做，变成建立机制并处理异常。"
    });
  }

  return recommendations.slice(0, 3);
}

function buildGrowthRecords(state, allocation, diagnosis, now) {
  const previous = state.reviews.find((review) => review.periodId !== state.currentPeriod.id);
  const northstar = allocation.find((item) => item.id === "northstar");
  const previousNorthstar = previous?.allocation?.find((item) => item.id === "northstar");
  const records = [];

  if (previousNorthstar) {
    const delta = (northstar?.percent || 0) - previousNorthstar.percent;
    records.push({
      id: `growth_focus_${now.getTime()}`,
      periodId: state.currentPeriod.id,
      growthPattern: delta >= 0 ? "重点任务投入占比提升" : "重点任务投入占比下降",
      behaviorChange: `本周 ${northstar?.percent || 0}%，上次 ${previousNorthstar.percent}%，变化 ${delta >= 0 ? "+" : ""}${delta}%。`,
      evidence: diagnosis.target.detail,
      status: delta > 0 ? "已出现改善" : "仍需观察"
    });
  }

  records.push({
    id: `growth_method_${now.getTime()}`,
    periodId: state.currentPeriod.id,
    growthPattern: "工作方式校准",
    behaviorChange: diagnosis.growth.detail,
    evidence: diagnosis.conclusion,
    status: "仍需观察"
  });
  return records;
}

function buildSummary(allocation, diagnosis) {
  const northstar = allocation.find((item) => item.id === "northstar");
  const topSupport = allocation.find((item) => item.id !== "northstar");
  const supportText = topSupport ? `主要分流来自「${topSupport.title}」，占 ${topSupport.percent}%。` : "暂未识别明显分流。";
  return `${diagnosis.target.detail}${supportText}${
    northstar?.percent ? "方向成立，但需要继续把主线推进收口。" : "本周缺少主线推进证据，需要先补齐目标相关工作痕迹。"
  }`;
}

function buildConclusion(mainPercent, targetPercent, supportPercent, goals) {
  const goalText = goals.map((goal) => goal.title).join("、");
  if (mainPercent >= targetPercent) {
    return `本周重点任务「${goalText}」获得了足够投入，支线占比 ${supportPercent}%，可以继续观察哪些方法值得沉淀。`;
  }
  return `本周重点任务「${goalText}」方向仍然成立，但实际投入 ${mainPercent}% 低于目标 ${targetPercent}%；需要识别支线分流，并把可重复事项沉淀为机制。`;
}

function normalizeTrace(raw, forcedSource, now) {
  const source = forcedSource || raw.source || "manual";
  const timestamp = raw.timestamp || raw.createdAt || raw.created_at || raw.time || now.toISOString();
  const sourceTitle = raw.sourceTitle || raw.source_title || raw.chatName || raw.groupName || raw.title || source;
  const content = raw.content || raw.text || raw.summary || raw.message || "";

  return {
    id: raw.id || `${source}_${hash(`${sourceTitle}:${content}:${timestamp}`)}`,
    source,
    sourceTitle,
    content,
    timestamp,
    signals: {
      messageCount: toNumber(raw.messageCount ?? raw.message_count ?? raw.messages_count, 0),
      activeReplies: toNumber(raw.activeReplies ?? raw.active_replies ?? raw.replies, 0),
      tokenCount: toNumber(raw.tokenCount ?? raw.token_count ?? raw.tokens, 0),
      aiTurns: toNumber(raw.aiTurns ?? raw.ai_turns ?? raw.turns, 0),
      documentEdits: toNumber(raw.documentEdits ?? raw.document_edits ?? raw.edits, 0),
      durationMinutes: toNumber(raw.durationMinutes ?? raw.duration_minutes ?? raw.minutes, 0)
    },
    importedAt: now.toISOString(),
    rawType: raw.rawType || raw.type || "work_trace"
  };
}

function mergeTraces(existing, incoming) {
  const byId = new Map(existing.map((trace) => [trace.id, trace]));
  incoming.forEach((trace) => byId.set(trace.id, trace));
  return Array.from(byId.values()).sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

function currentWeekPeriod(input) {
  const start = startOfWeek(input);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return {
    id: `${start.getFullYear()}-W${weekNumber(start)}`,
    type: "week",
    label: `${start.getMonth() + 1}.${start.getDate()}-${end.getMonth() + 1}.${end.getDate()}`,
    start: toIsoDate(start),
    end: toIsoDate(end)
  };
}

function startOfWeek(input) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date;
}

function weekNumber(date) {
  const firstDay = new Date(Date.UTC(date.getFullYear(), 0, 1));
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const days = Math.floor((current - firstDay) / 86400000);
  return String(Math.ceil((days + firstDay.getUTCDay() + 1) / 7)).padStart(2, "0");
}

function sampleTimestamp(period, index) {
  const date = new Date(`${period.start}T09:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + (index % 5));
  date.setUTCHours(9 + (index % 7));
  return date.toISOString();
}

function isWithinPeriod(timestamp, period) {
  if (!timestamp) return true;
  const time = new Date(timestamp).getTime();
  const start = new Date(`${period.start}T00:00:00.000Z`).getTime();
  const end = new Date(`${period.end}T23:59:59.999Z`).getTime();
  return Number.isFinite(time) && time >= start && time <= end;
}

function classifyTrace(text) {
  let best = null;
  let bestScore = 0;
  CATEGORY_DEFINITIONS.forEach((category) => {
    const score = scoreKeywords(text, category.keywords);
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  });
  return best || { id: "other", title: "其他工作痕迹" };
}

function extractGoalKeywords(goals) {
  const base = goals.flatMap((goal) => splitTerms(goal.title));
  return Array.from(new Set([...base, "履约", "陪伴", "Agent", "agent", "灰度", "上线", "协商", "SOP"]));
}

function splitTerms(text) {
  const latin = String(text).match(/[A-Za-z0-9_+-]+/g) || [];
  const cjk = String(text)
    .replace(/[A-Za-z0-9_+-]+/g, " ")
    .split(/[，。、“”：《》：\s/()（）-]+/)
    .filter((term) => term.length >= 2);
  return [...latin, ...cjk];
}

function traceText(trace) {
  return `${trace.sourceTitle || ""} ${trace.content || ""}`;
}

function scoreKeywords(text, keywords) {
  return keywords.reduce((score, keyword) => {
    if (!keyword) return score;
    return text.includes(keyword) ? score + Math.max(1, keyword.length / 2) : score;
  }, 0);
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function attentionScore(trace) {
  const signals = trace.signals || {};
  return Math.max(
    5,
    (signals.durationMinutes || 0) * 2 +
      (signals.messageCount || 0) * 1.2 +
      (signals.activeReplies || 0) * 2 +
      (signals.tokenCount || 0) / 300 +
      (signals.aiTurns || 0) * 3 +
      (signals.documentEdits || 0) * 4
  );
}

function normalizePercentages(items) {
  if (items.length === 0) return [];
  const floored = items.map((item) => ({
    ...item,
    percent: Math.floor(item.rawPercent),
    remainder: item.rawPercent - Math.floor(item.rawPercent)
  }));
  let remaining = 100 - floored.reduce((sum, item) => sum + item.percent, 0);
  const sorted = [...floored].sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; remaining > 0 && sorted.length > 0; index += 1) {
    sorted[index % sorted.length].percent += 1;
    remaining -= 1;
  }
  return floored;
}

function confidenceFor(item) {
  if (item.evidence.length >= 3) return 0.82;
  if (item.evidence.length === 2) return 0.72;
  if (item.evidence.length === 1) return 0.62;
  return 0.4;
}

function reasonFor(item) {
  if (item.id === "northstar") return "工作痕迹与本周重点任务存在关键词和上下文关联。";
  if (item.evidence.length === 0) return "暂无明显工作痕迹。";
  return `来自 ${item.evidence
    .map((evidence) => evidence.sourceTitle)
    .slice(0, 2)
    .join("、")} 等记录。`;
}

function mergeGrowthRecords(existing, incoming) {
  const withoutCurrent = existing.filter((record) => !incoming.some((item) => item.periodId === record.periodId));
  return [...incoming, ...withoutCurrent].slice(0, 30);
}

function readStoredState(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredState(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full storage quota can disable persistence; memory mode still works.
  }
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hash(input) {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value << 5) - value + input.charCodeAt(index);
    value |= 0;
  }
  return Math.abs(value).toString(36);
}

function round(value, digits) {
  const base = 10 ** digits;
  return Math.round(value * base) / base;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}
