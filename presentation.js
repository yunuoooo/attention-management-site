const slides = Array.from(document.querySelectorAll(".slide"));
const prevButton = document.querySelector("#prevSlide");
const nextButton = document.querySelector("#nextSlide");
const pageIndicator = document.querySelector("#pageIndicator");
const progressBar = document.querySelector("#progressBar");

let currentIndex = 0;

function pageNumber(index) {
  return String(index + 1).padStart(2, "0");
}

function totalPages() {
  return String(slides.length).padStart(2, "0");
}

function renderSlide() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentIndex);
    slide.setAttribute("aria-hidden", index === currentIndex ? "false" : "true");
  });

  pageIndicator.textContent = `${pageNumber(currentIndex)} / ${totalPages()}`;
  progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === slides.length - 1;
}

function goToSlide(index) {
  currentIndex = Math.max(0, Math.min(slides.length - 1, index));
  renderSlide();
}

prevButton.addEventListener("click", () => goToSlide(currentIndex - 1));
nextButton.addEventListener("click", () => goToSlide(currentIndex + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    goToSlide(currentIndex + 1);
  }

  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    goToSlide(currentIndex - 1);
  }

  if (event.key === "Home") {
    event.preventDefault();
    goToSlide(0);
  }

  if (event.key === "End") {
    event.preventDefault();
    goToSlide(slides.length - 1);
  }
});

renderSlide();
