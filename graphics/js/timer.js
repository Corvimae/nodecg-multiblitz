'use strict';

function timeToSeconds(startTime, endTime = null, offset = 0) {
  const runtime = ((endTime ?? new Date().getTime()) - startTime) / 1000;

  return Math.max(0, runtime + (offset / 1000));
}

function formatSeconds(seconds) {
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor(absSeconds / 60) - (hours * 60);
  const remainingSeconds = Math.floor(absSeconds - (hours * 3600) - (minutes * 60));

  return (seconds <= -1 ? '-' : '') + [
    hours < 10 ? '0' + hours : hours,
    minutes < 10 ? '0' + minutes : minutes,
    remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds,
  ].join(':');
}


(() => {
	// The bundle name where all the run information is pulled from.
	const BUNDLE = 'nodecg-multiblitz';
	
  const playerKey = window.location.hash.replace('#', '').toLowerCase();
	
	var runnerData = nodecg.Replicant('runnerData', BUNDLE);
	
	function updateTimer() {
    if (!runnerData.value) return;
    
    const timerElem = document.querySelector('#timer');
    const cumulativeElem = document.querySelector('#cumulative');
    const playerData = runnerData.value[playerKey];

    if (!playerData) return;

    const lastSegment = playerData.segments[playerData.segments.length - 1];
    const startTime = Number(playerData.currentRunStart || lastSegment.start);
    const endTime = !playerData.isRunning && lastSegment && lastSegment.end ? Number(lastSegment.end) : null;

    const currentRunSeconds = timeToSeconds(startTime, endTime) + (playerData.offset / 1000);

    const isRunning = playerData.isRunning

    if (timerElem) {
      timerElem.textContent = formatSeconds(currentRunSeconds);

      if (isRunning) {
        timerElem.classList.add('running');
      } else {
        timerElem.classList.remove('running');
      }
    }

    let cumulativeRuntime = playerData.segments.reduce((acc, { start, end, offset }) => (
      acc + timeToSeconds(start, end, offset)
    ), 0);

    if (isRunning) cumulativeRuntime += Math.max(currentRunSeconds + (playerData.offset / 1000), 0);

    if (cumulativeElem) cumulativeElem.textContent = formatSeconds(cumulativeRuntime);
	}

  setInterval(updateTimer, 1000);

  updateTimer();
})();