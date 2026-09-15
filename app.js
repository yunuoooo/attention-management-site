import { createLocalApi } from "./local-api.js";

const goalForm = document.querySelector("#goalForm");
const goalInputs = [document.querySelector("#goal1"), document.querySelector("#goal2"), document.querySelector("#goal3")];
const targetFocus = document.querySelector("#targetFocus");
const periodLabel = document.querySelector("#periodLabel");
const allocationList = document.querySelector("#allocationList");
const diagnosisList = document.querySelector("#diagnosisList");
const recommendationList = document.querySelector("#recommendationList");
const growthList = document.querySelector("#growthList");
const historyList = document.querySelector("#historyList");
const loadSample = document.querySelector("#loadSample");
const runAnalyze = document.querySelector("#runAnalyze");
const allocationTemplate = document.querySelector("#allocationTemplate");
const dataModeTitle = document.querySelector("#dataModeTitle");
const dataModeDetail = document.querySelector("#dataModeDetail");
const dataModeHint = document.querySelector("#dataModeHint");

let currentState = null;
let apiMode = null;
const browserApi = createLocalApi();

async function init() {
  const payload = await api("/api/state");
  render(payload.state);
}

goalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const goals = goalInputs.map((input) => input.value);
  const payload = await api("/api/goals", {
    method: "POST",
    body: {
      goals,
      targetFocusPercent: Number(targetFocus.value)
    }
  });
  render(payload.state);
  toast("已保存本周目标");
});

loadSample.addEventListener("click", async () => {
  const payload = await api("/api/sample", { method: "POST" });
  render(payload.state);
  toast(`已导入 ${payload.imported} 条样例记录`);
});

runAnalyze.addEventListener("click", async () => {
  runAnalyze.disabled = true;
  runAnalyze.textContent = "生成中...";
  try {
    const payload = await api("/api/analyze", {
      method: "POST",
      body: {
        useAi: false
      }
    });
    render(payload.state);
    toast("复盘已生成");
  } finally {
    runAnalyze.disabled = false;
    runAnalyze.textContent = "生成复盘";
  }
});

function render(state) {
  currentState = state;
  const goals = state.goals || [];

  goals.forEach((goal, index) => {
    if (goalInputs[index]) {
      goalInputs[index].value = goal.title;
    }
  });

  for (let index = goals.length; index < goalInputs.length; index += 1) {
    goalInputs[index].value = "";
  }

  targetFocus.value = state.currentPeriod.targetFocusPercent;
  periodLabel.textContent = `本周 · ${state.currentPeriod.label}`;

  const review = state.reviews?.[0];
  renderAllocation(review?.allocation || []);
  renderDiagnosis(review?.diagnosis || null);
  renderRecommendations(review?.recommendations || []);
  renderGrowth(state.growthRecords || []);
  renderHistory(state.reviews || []);
}

function renderAllocation(allocation) {
  allocationList.innerHTML = "";

  if (allocation.length === 0) {
    allocationList.className = "allocation-list empty-state";
    allocationList.textContent = "还没有复盘结果，先导入记录并生成复盘。";
    return;
  }

  allocationList.className = "allocation-list";
  allocation.forEach((item, index) => {
    const node = allocationTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle("northstar", item.id === "northstar");
    node.querySelector(".tag").textContent = item.id === "northstar" ? "置顶" : String(index + 1).padStart(2, "0");
    node.querySelector("strong").textContent = item.title;
    node.querySelector("p").textContent = item.reason;
    node.querySelector("b").style.width = `${item.percent}%`;
    node.querySelector("em").textContent = `${item.percent}%`;
    allocationList.append(node);
  });
}

function renderDiagnosis(diagnosis) {
  diagnosisList.innerHTML = "";

  if (!diagnosis) {
    diagnosisList.className = "card-list empty-state";
    diagnosisList.textContent = "暂无诊断。";
    return;
  }

  diagnosisList.className = "card-list";
  [
    ["投向", diagnosis.target],
    ["专注", diagnosis.focus],
    ["归属", diagnosis.ownership],
    ["成长", diagnosis.growth]
  ].forEach(([label, item]) => {
    diagnosisList.append(infoCard(label, item.title, item.detail));
  });

  diagnosisList.append(infoCard("总结", "本周结论", diagnosis.conclusion));
}

function renderRecommendations(recommendations) {
  recommendationList.innerHTML = "";

  if (recommendations.length === 0) {
    recommendationList.className = "card-list empty-state";
    recommendationList.textContent = "暂无建议。";
    return;
  }

  recommendationList.className = "card-list";
  recommendations.forEach((recommendation) => {
    const card = infoCard(recommendation.type, recommendation.title, recommendation.reason);
    const list = document.createElement("ul");
    recommendation.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      list.append(li);
    });
    const outcome = document.createElement("p");
    outcome.innerHTML = `<strong>预期变化：</strong>${escapeHtml(recommendation.expectedOutcome)}`;
    card.append(list, outcome);
    recommendationList.append(card);
  });
}

function renderGrowth(records) {
  growthList.innerHTML = "";

  if (records.length === 0) {
    growthList.className = "card-list empty-state";
    growthList.textContent = "暂无成长记录。";
    return;
  }

  growthList.className = "card-list";
  records.slice(0, 4).forEach((record) => {
    growthList.append(infoCard(record.status, record.growthPattern, record.behaviorChange));
  });
}

function renderHistory(reviews) {
  historyList.innerHTML = "";

  if (reviews.length === 0) {
    historyList.className = "history-list empty-state";
    historyList.textContent = "暂无历史。";
    return;
  }

  historyList.className = "history-list";
  reviews.forEach((review) => {
    const northstar = review.allocation.find((item) => item.id === "northstar");
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <strong>${escapeHtml(review.periodLabel)} · 重点任务 ${northstar?.percent || 0}%</strong>
      <small>目标 ${review.targetFocusPercent}% · ${escapeHtml(review.summary)}</small>
    `;
    historyList.append(item);
  });
}

function infoCard(label, title, detail) {
  const card = document.createElement("article");
  card.className = "info-card";
  card.innerHTML = `
    <header><span>${escapeHtml(label)}</span><strong>${escapeHtml(title)}</strong></header>
    <p>${escapeHtml(detail)}</p>
  `;
  return card;
}

async function api(path, options = {}) {
  if (apiMode === "browser") {
    return browserApi(path, options);
  }

  try {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "content-type": "application/json"
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const contentType = response.headers.get("content-type") || "";

    if (response.status === 404 || !contentType.includes("application/json")) {
      return useBrowserApi(path, options);
    }

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `Request failed: ${response.status}`);
    }

    setApiMode("server");
    return payload;
  } catch (error) {
    if (apiMode === "server") {
      throw error;
    }
    return useBrowserApi(path, options);
  }
}

function useBrowserApi(path, options) {
  setApiMode("browser");
  return browserApi(path, options);
}

function setApiMode(mode) {
  if (apiMode === mode) return;
  apiMode = mode;

  if (mode === "browser") {
    dataModeTitle.textContent = "浏览器本地存储";
    dataModeDetail.textContent = "无需账号 · 每位访客独立保存";
    dataModeHint.textContent = "目标和复盘只保存在这台设备的当前浏览器中，清除浏览器数据会一并删除。";
    return;
  }

  dataModeTitle.textContent = "本机 Node 服务";
  dataModeDetail.textContent = "数据写入 data/state.json";
  dataModeHint.textContent = "当前由本机服务保存；部署到腾讯云 Pages 后会自动切换为浏览器本地存储。";
}

function toast(message) {
  const existing = document.querySelector(".toast");
  existing?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 1800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init().catch((error) => {
  toast(error.message);
});
