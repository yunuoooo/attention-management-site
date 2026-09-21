const goalTitle = document.querySelector("#goalTitle");
const goalTitle2 = document.querySelector("#goalTitle2");
const goalTitle3 = document.querySelector("#goalTitle3");
const goalInput = document.querySelector("#goalInput");
const goalInput2 = document.querySelector("#goalInput2");
const goalInput3 = document.querySelector("#goalInput3");
const targetFocus = document.querySelector("#targetFocus");
const onboardingScreen = document.querySelector("#onboardingScreen");
const dashboardView = document.querySelector("#dashboardView");
const lighthouseSetupForm = document.querySelector("#lighthouseSetupForm");
const skipOnboarding = document.querySelector("#skipOnboarding");
const editSetup = document.querySelector("#editSetup");
const currentPeriodLabel = document.querySelector("#currentPeriodLabel");
const currentTargetLabel = document.querySelector("#currentTargetLabel");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const openHistory = document.querySelector("#openHistory");
const closeHistory = document.querySelector("#closeHistory");
const historyBackdrop = document.querySelector("#historyBackdrop");
const historyDrawer = document.querySelector("#historyDrawer");
const historyDirectory = document.querySelector("#historyDirectory");
const historyDetail = document.querySelector("#historyDetail");
const historyBack = document.querySelector("#historyBack");
const historyWeekButtons = Array.from(document.querySelectorAll("[data-history-week]"));
const historyCurrentWeek = document.querySelector('[data-history-week="current"]');
const historyDetailPeriod = document.querySelector("#historyDetailPeriod");
const historyDetailConclusion = document.querySelector("#historyDetailConclusion");
const historyDetailPercent = document.querySelector("#historyDetailPercent");
const historyDetailTarget = document.querySelector("#historyDetailTarget");
const historyCurrentMeta = document.querySelector("#historyCurrentMeta");
const historyCurrentGap = document.querySelector("#historyCurrentGap");
const historyTaskList = document.querySelector("#historyTaskList");
const historyDailyTable = document.querySelector("#historyDailyTable");
const historySummary = document.querySelector("#historySummary");
const historyReview = document.querySelector("#historyReview");
const tabPanels = {
  today: document.querySelector("#todayPanel"),
  growth: document.querySelector("#growthPanel"),
};

const historyData = {
  current: {
    period: "本周 · 9.1-9.7",
    percent: 40,
    target: 60,
    conclusion: "重点任务投入 40%，距目标还差 20%。",
    tasks: [
      "履约陪伴 Agent 从方案设计到灰度上线的闭环推进",
      "Agent SOP 标准化沉淀工具",
      "协商方案能力与延期场景验证",
    ],
    days: [
      ["周一", 38, 7],
      ["周二", 44, 6],
      ["周三", 35, 8],
      ["周四", 47, 5],
      ["周五", 40, 4],
    ],
    summary: "重点任务始终是最高占比，但协商、SOP、case 回流与跨团队对齐共同切开了连续推进时间。",
    review: "下周继续保护上午深度块，把必要支线收进下午固定窗口，并完成协商策略清单与 case 评测飞轮。",
  },
  w9: {
    period: "8.25-8.31",
    percent: 48,
    target: 55,
    conclusion: "重点任务投入 48%，距当周目标还差 7%。",
    tasks: ["履约陪伴 Agent 灰度问题修复", "SOP 生成流程验证", "线上 case 回流标准"],
    days: [["周一", 42, 6], ["周二", 51, 5], ["周三", 46, 7], ["周四", 55, 5], ["周五", 47, 4]],
    summary: "Agent 主线开始稳定进入上午，但下午的评测与材料对齐仍然较碎。",
    review: "延续上午主线保护，普通 case 改为隔日集中处理，避免每条消息都触发一次切换。",
  },
  w8: {
    period: "8.18-8.24",
    percent: 41,
    target: 50,
    conclusion: "重点任务投入 41%，距当周目标还差 9%。",
    tasks: ["履约陪伴 Agent 全量上线", "Pi-data 查数机器人推广"],
    days: [["周一", 36, 8], ["周二", 49, 6], ["周三", 44, 6], ["周四", 39, 7], ["周五", 37, 5]],
    summary: "上线阶段带出大量测试、验收和跨团队同步，主线推进有效但注意力切换频繁。",
    review: "把验收口径整理成检查清单，后续只处理异常项，不再重复核对全部字段。",
  },
  w7: {
    period: "8.11-8.17",
    percent: 34,
    target: 60,
    conclusion: "重点任务投入 34%，低于目标 26%。",
    tasks: ["Agent 灰度方案", "协商方案延期能力", "团队数据验收"],
    days: [["周一", 30, 8], ["周二", 37, 7], ["周三", 32, 9], ["周四", 41, 6], ["周五", 30, 5]],
    summary: "重点任务启动偏晚，临时验收和协作消息占据了上午的连续工作窗口。",
    review: "下一周把重点任务启动时间提前到 10:30 前，并将数据验收交给标准化模板承接。",
  },
  w6: {
    period: "8.4-8.10",
    percent: 64,
    target: 60,
    conclusion: "重点任务投入 64%，超过目标 4%。",
    tasks: ["履约陪伴 Agent 方案定稿", "Agent SOP 工具原型"],
    days: [["周一", 62, 4], ["周二", 68, 4], ["周三", 60, 5], ["周四", 66, 4], ["周五", 64, 3]],
    summary: "任务数量较少、目标清晰，重点任务获得了稳定的连续推进块。",
    review: "保留上午深度块，同时观察任务数量增加后，这套节奏是否仍能维持。",
  },
};

function currentPeriod() {
  return "9月1日 - 9月7日";
}

function targetDifference(actual, target) {
  if (actual === target) {
    return "达到目标";
  }

  return actual > target ? `超过目标 ${actual - target}%` : `距目标 ${target - actual}%`;
}

function saveSettings() {
  const nextGoal = goalInput?.value.trim();
  const nextGoal2 = goalInput2?.value.trim();
  const nextGoal3 = goalInput3?.value.trim();

  if (nextGoal && goalTitle) {
    goalTitle.textContent = nextGoal;
  }

  if (goalTitle2) {
    goalTitle2.textContent = nextGoal2 || "未设置第二项重点任务";
    goalTitle2.hidden = !nextGoal2;
  }

  if (goalTitle3) {
    goalTitle3.textContent = nextGoal3 || "未设置第三项重点任务";
    goalTitle3.hidden = !nextGoal3;
  }

  if (currentPeriodLabel) {
    currentPeriodLabel.textContent = `${currentPeriod()}的高优任务`;
  }

  if (targetFocus && currentTargetLabel) {
    const value = Math.max(30, Math.min(90, Number(targetFocus.value) || 60));
    targetFocus.value = value;
    currentTargetLabel.textContent = `${value}%`;
    historyData.current.target = value;
    historyData.current.conclusion = `重点任务投入 ${historyData.current.percent}%，${targetDifference(historyData.current.percent, value)}。`;

    if (historyCurrentMeta) {
      historyCurrentMeta.textContent = `3 个重点任务 · 目标 ${value}%`;
    }

    if (historyCurrentGap) {
      historyCurrentGap.textContent = targetDifference(historyData.current.percent, value);
    }

    if (historyCurrentWeek) {
      const isCompleted = historyData.current.percent >= value;
      historyCurrentWeek.classList.toggle("completed", isCompleted);
      historyCurrentWeek.classList.toggle("incomplete", !isCompleted);
    }
  }
}

function showDashboard() {
  saveSettings();
  onboardingScreen.hidden = true;
  dashboardView.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showSetup() {
  dashboardView.hidden = true;
  onboardingScreen.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
  goalInput?.focus();
}

function openHistoryDrawer() {
  if (!historyDrawer || !historyBackdrop) {
    return;
  }

  historyDrawer.setAttribute("aria-hidden", "false");
  historyBackdrop.hidden = false;
  openHistory?.setAttribute("aria-expanded", "true");
  document.body.classList.add("drawer-open");
  closeHistory?.focus();
}

function closeHistoryDrawer() {
  if (!historyDrawer || !historyBackdrop) {
    return;
  }

  historyDrawer.setAttribute("aria-hidden", "true");
  historyBackdrop.hidden = true;
  openHistory?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-open");
  openHistory?.focus();
}

function renderHistoryDetail(key) {
  const detail = historyData[key];

  if (!detail || !historyDirectory || !historyDetail) {
    return;
  }

  historyWeekButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.historyWeek === key);
  });

  historyDetailPeriod.textContent = detail.period;
  historyDetailConclusion.textContent = detail.conclusion;
  historyDetailPercent.textContent = `${detail.percent}%`;
  historyDetailTarget.textContent = `目标 ${detail.target}%`;
  historyTaskList.innerHTML = detail.tasks.map((task) => `<li>${task}</li>`).join("");
  historyDailyTable.innerHTML = `
    <div class="history-daily-row history-daily-head"><span>日期</span><span>重点占比</span><span>任务数</span></div>
    ${detail.days
      .map(
        ([day, percent, count]) => `
          <div class="history-daily-row">
            <strong>${day}</strong>
            <span><i><b style="width: ${percent}%"></b></i><em>${percent}%</em></span>
            <strong>${count}</strong>
          </div>
        `,
      )
      .join("")}
  `;
  historySummary.textContent = detail.summary;
  historyReview.textContent = detail.review;
  historyDirectory.hidden = true;
  historyDetail.hidden = false;
  historyBack?.focus();
}

function showHistoryDirectory() {
  if (!historyDirectory || !historyDetail) {
    return;
  }

  historyDetail.hidden = true;
  historyDirectory.hidden = false;
  historyWeekButtons.find((button) => button.classList.contains("active"))?.focus();
}

targetFocus?.addEventListener("input", saveSettings);
skipOnboarding?.addEventListener("click", showDashboard);
editSetup?.addEventListener("click", showSetup);
lighthouseSetupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  showDashboard();
});
openHistory?.addEventListener("click", openHistoryDrawer);
closeHistory?.addEventListener("click", closeHistoryDrawer);
historyBackdrop?.addEventListener("click", closeHistoryDrawer);
historyBack?.addEventListener("click", showHistoryDirectory);

historyWeekButtons.forEach((button) => {
  button.addEventListener("click", () => renderHistoryDetail(button.dataset.historyWeek));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && historyDrawer?.getAttribute("aria-hidden") === "false") {
    closeHistoryDrawer();
  }
});

goalInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    goalInput2?.focus();
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const activeTab = button.dataset.tab;

    tabButtons.forEach((tabButton) => {
      const isActive = tabButton.dataset.tab === activeTab;
      tabButton.classList.toggle("active", isActive);
      tabButton.setAttribute("aria-selected", String(isActive));
    });

    Object.entries(tabPanels).forEach(([tab, panel]) => {
      if (!panel) {
        return;
      }

      const isActive = tab === activeTab;
      panel.hidden = !isActive;
      panel.classList.toggle("active", isActive);
    });
  });
});

saveSettings();
