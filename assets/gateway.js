const button = document.querySelector("[data-ready]");

if (button) {
  const configuredSeconds = Number(button.dataset.seconds);
  const rawReady = Number(button.dataset.ready);
  // Prefer a duration so the timer is not affected by differences between
  // the hosting server clock and a visitor's phone clock.
  const initialSeconds = Number.isFinite(configuredSeconds)
    ? Math.max(0, Math.min(300, Math.floor(configuredSeconds)))
    : Math.max(
        0,
        (rawReady > 1e12 ? Math.floor(rawReady / 1000) : Math.floor(rawReady)) -
          Math.floor(Date.now() / 1000),
      );
  const deadline = Date.now() + initialSeconds * 1000;
  const note = document.querySelector("#countdown-note");
  let timer;

  const tick = () => {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    button.disabled = seconds > 0;
    button.textContent = seconds
      ? `Continue in ${seconds}s`
      : "Continue to download";
    if (note) {
      note.textContent = seconds
        ? "Please wait."
        : "Your download link is ready.";
    }
    if (!seconds && timer) clearInterval(timer);
  };

  // Mobile browsers slow or pause intervals in background tabs. Recalculating
  // from a deadline and listening for pageshow/visibility changes keeps it exact.
  const resume = () => tick();
  window.addEventListener("pageshow", resume);
  document.addEventListener("visibilitychange", resume);
  timer = setInterval(tick, 250);
  tick();
}
