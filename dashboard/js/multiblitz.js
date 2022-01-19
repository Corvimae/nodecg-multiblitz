const NODECG_BUNDLE = 'nodecg-multiblitz';

const runnerData = nodecg.Replicant('runnerData', NODECG_BUNDLE);

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


NodeCG.waitForReplicants(runnerData).then(() => {
  setInterval(() => {
    [...document.querySelectorAll(`.runner-table .runner`)].forEach(runnerCell => {
      const startTime = Number(runnerCell.getAttribute('data-start-time'));
      const rawEndTime = runnerCell.getAttribute('data-end-time');
      const endTime = rawEndTime ? Number(rawEndTime) : null;
      const isRunning = runnerCell.getAttribute('data-is-running') === 'true';

      const currentRunSeconds = timeToSeconds(startTime, endTime);

      runnerCell.querySelector('.current-run-timer').textContent = formatSeconds(currentRunSeconds);
      
      if (isRunning) {
        runnerCell.classList.add('is-running');
      } else {
        runnerCell.classList.remove('is-running');
      }

      let cumulativeRuntime = Number(runnerCell.getAttribute('data-cumulative-seconds'));

      if (isRunning) cumulativeRuntime += currentRunSeconds;

      runnerCell.querySelector('.cumulative-run-timer').textContent = formatSeconds(cumulativeRuntime);
    });
  }, 1000);


  function createRunnerRow(key) {
    const container = document.createElement('div');
        
    container.classList.add('runner');
    container.id = key;
    
    const keyCell = document.createElement('div');
    
    keyCell.classList.add('runner-key');
    keyCell.textContent = key;
  
    const timerCell = document.createElement('div');
    
    timerCell.classList.add('current-run-timer');
    timerCell.textContent = '00:00:00';
  
    const cumulativeCell = document.createElement('div');
  
    cumulativeCell.classList.add('cumulative-run-timer');
    cumulativeCell.textContent = '00:00:00';
  
    const actionsCell = document.createElement('div');
  
    actionsCell.classList.add('runner-actions');
  
    const clearButton = document.createElement('button');
  
    clearButton.classList.add('clear-runner-button');
    clearButton.setAttribute('raised', true);
    clearButton.innerHTML = '&times';
    clearButton.onclick = () => {
      runnerData.value[key] = {
        segments: [],
        isRunning: false,
        currentRunStart: null,
        hidden: true,
      }
      
      container.remove();
    };
  
    actionsCell.append(clearButton);
  
    container.appendChild(keyCell);
    container.appendChild(timerCell);
    container.appendChild(cumulativeCell);
    container.appendChild(actionsCell);
  
    return container;
  }

  runnerData.on('change', newValue => {
    const keys = Object.keys(newValue);

    keys.forEach(key => {
      const data = newValue[key];

      if (data.hidden) return;

      let container = document.querySelector(`.runner-table #${key}`);

      if (!container) {
        container = createRunnerRow(key);

        document.querySelector('.runner-table').appendChild(container);
      }

      container.setAttribute('data-start-time', data.currentRunStart);
      container.setAttribute('data-is-running', data.isRunning);

      const cumulativeSeconds = data.segments.reduce((acc, { start, end }) => (
        acc + timeToSeconds(start, end)
      ), 0);

      container.setAttribute('data-cumulative-seconds', cumulativeSeconds);

      if (data.isRunning) {
        container.removeAttribute('data-end-time');
      } else {
        const lastSegment = data.segments[data.segments.length - 1];

        if (lastSegment) {
          container.setAttribute('data-start-time', lastSegment.start);
          container.setAttribute('data-end-time', lastSegment.end);
        }
      }
    });
  });
});