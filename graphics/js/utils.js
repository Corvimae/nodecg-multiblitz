function timeToSeconds(startTime, endTime = null) {
  return ((endTime ?? new Date().getTime()) - startTime) / 1000;
}

function formatSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) - (hours * 60);
  const remainingSeconds = Math.floor(seconds - (hours * 3600) - (minutes * 60));

  return [
    hours < 10 ? '0' + hours : hours,
    minutes < 10 ? '0' + minutes : minutes,
    remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds,
  ].join(':');
}