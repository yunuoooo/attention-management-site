const taskComposer = document.querySelector("#taskComposer");
const taskReply = document.querySelector("#taskReply");
const taskConfirmed = document.querySelector("#taskConfirmed");
const middayStep = document.querySelector("#middayStep");
const middayReply = document.querySelector("#middayReply");
const middayConfirmed = document.querySelector("#middayConfirmed");
const reviewStep = document.querySelector("#reviewStep");
const reviewReply = document.querySelector("#reviewReply");
const reviewHandoff = document.querySelector("#reviewHandoff");
const confirmReview = document.querySelector("#confirmReview");
const taskActions = Array.from(document.querySelectorAll("[data-task-action]"));
const middayActions = Array.from(document.querySelectorAll("[data-midday-action]"));

function reveal(element, focus = false) {
  if (!element) {
    return;
  }

  element.hidden = false;
  element.classList.add("is-revealed");

  if (focus) {
    element.querySelector("input, button, a")?.focus();
  }
}

function finishTaskSetup(tasks, replyText) {
  taskActions.forEach((button) => {
    button.disabled = true;
  });

  if (taskReply) {
    taskReply.textContent = replyText || tasks.map((task, index) => `${index + 1}. ${task}`).join("；");
  }

  reveal(taskReply);
  reveal(taskConfirmed);
  reveal(middayStep);
}

taskActions.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.taskAction;

    if (action === "fill") {
      reveal(taskComposer, true);
      return;
    }

    if (action === "reuse") {
      finishTaskSetup(
        ["履约陪伴 Agent 灰度上线闭环", "Agent SOP 标准化工具", "协商方案延期能力"],
        "沿用上周的 3 项重点任务。",
      );
      return;
    }

    if (taskReply && taskConfirmed) {
      taskReply.textContent = "稍后提醒我。";
      taskConfirmed.textContent = "好的，我会在今天 14:00 再提醒你填写本周重点任务。";
      reveal(taskReply);
      reveal(taskConfirmed);
    }
  });
});

taskComposer?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskComposer);
  const tasks = [formData.get("task1"), formData.get("task2"), formData.get("task3")]
    .map((task) => String(task || "").trim())
    .filter(Boolean);

  if (tasks.length === 0) {
    return;
  }

  taskComposer.hidden = true;
  finishTaskSetup(tasks);
});

middayActions.forEach((button) => {
  button.addEventListener("click", () => {
    const isNecessary = button.dataset.middayAction === "necessary";
    middayActions.forEach((actionButton) => {
      actionButton.disabled = true;
    });

    if (middayReply && middayConfirmed) {
      middayReply.textContent = isNecessary ? "标记为必要协作。" : "接受提醒。";
      middayConfirmed.textContent = isNecessary
        ? "已标记。网页复盘会把这部分计入重点任务相关协作，不作为普通分流。"
        : "收到。先继续推进重点任务，我会在 16:00 再提醒你集中处理这些协作。";
    }

    reveal(middayReply);
    reveal(middayConfirmed);
    reveal(reviewStep);
  });
});

confirmReview?.addEventListener("click", () => {
  confirmReview.disabled = true;
  reveal(reviewReply);
  reveal(reviewHandoff, true);
});
