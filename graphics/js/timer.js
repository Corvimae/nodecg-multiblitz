'use strict';
(() => {
	// The bundle name where all the run information is pulled from.
	const BUNDLE = 'nodecg-multiblitz';
	
  const playerKey = window.location.hash.replace('#', '');
	
	var runnerData = nodecg.Replicant('runnerData', BUNDLE);
	
	function updateTimer() {
    if (!runnerData.value) return;
    
    const timerElem = document.querySelector('#timer');
    const cumulativeElem = document.querySelector('#cumulative');
    const playerData = runnerData.value[playerKey];
    
    if (!playerData) return;

    const lastSegment = playerData.segments[playerData.segments.length - 1];
    const startTime = Number(playerData.currentRunStart ?? lastSegment.start);
    const endTime = !playerData.isRunning && lastSegment?.end ? Number(lastSegment.end) : null;

    const isRunning = playerData.isRunning

    const currentRunSeconds = timeToSeconds(startTime, endTime);

    if (timerElem) {
      timerElem.textContent = formatSeconds(currentRunSeconds);

      if (isRunning) {
        timerElem.classList.add('running');
      } else {
        timerElem.classList.remove('running');
      }
    }

    let cumulativeRuntime = playerData.segments.reduce((acc, { start, end }) => (
      acc + timeToSeconds(start, end)
    ), 0);

    if (isRunning) cumulativeRuntime += currentRunSeconds;

    if (cumulativeElem) cumulativeElem.textContent = formatSeconds(cumulativeRuntime);
	}
  setInterval(updateTimer, 1000);

  updateTimer();
})();