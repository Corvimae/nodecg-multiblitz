const NODECG_BUNDLE = 'nodecg-multiblitz';

const runnerData = nodecg.Replicant('runnerData', NODECG_BUNDLE);

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

function setStateClass(element, className, value) {
  if (value) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

function createButton(text, className, onClick) {
  const button = document.createElement('button');
  
  button.classList.add('button', className);
  button.setAttribute('raised', true);
  button.innerHTML = text;
  button.onclick = onClick;

  return button;
}

NodeCG.waitForReplicants(runnerData).then(() => {
  setInterval(() => {
    [...document.querySelectorAll(`.runner-table .runner`)].forEach(runnerCell => {
      const startTime = Number(runnerCell.getAttribute('data-start-time'));
      const rawEndTime = runnerCell.getAttribute('data-end-time');
      const offset = Number(runnerCell.getAttribute('data-offset'));
      const endTime = rawEndTime ? Number(rawEndTime) : null;
      const isRunning = runnerCell.getAttribute('data-is-running') === 'true';
      const isAFK = runnerCell.getAttribute('data-is-afk') === 'true';

      const currentRunSeconds = timeToSeconds(startTime, endTime) + (offset / 1000);

      runnerCell.querySelector('.current-run-timer').textContent = formatSeconds(currentRunSeconds);
      
      setStateClass(runnerCell, 'is-running', isRunning);
      setStateClass(runnerCell, 'is-afk', isAFK);

      runnerCell.querySelector('.end-timer-button').disabled = !isRunning;
      runnerCell.querySelector('.resume-timer-button').disabled = isRunning;

      let cumulativeRuntime = Number(runnerCell.getAttribute('data-cumulative-seconds'));

      if (isRunning) cumulativeRuntime += Math.max(0, currentRunSeconds);

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

    const afkTextCell = document.createElement('span');
    afkTextCell.classList.add('runner-afk-text');

    afkTextCell.textContent = ' (AFK)';

    keyCell.appendChild(afkTextCell);
  
    const timerCell = document.createElement('div');
    
    timerCell.classList.add('current-run-timer');
    timerCell.textContent = '00:00:00';
  
    const cumulativeCell = document.createElement('div');
  
    cumulativeCell.classList.add('cumulative-run-timer');
    cumulativeCell.textContent = '00:00:00';
  
    const actionsCell = document.createElement('div');
  
    actionsCell.classList.add('runner-actions');
  
    const clearButton = createButton('&times', 'clear-runner-button', () => {
      runnerData.value[key] = {
        segments: [],
        isRunning: false,
        currentRunStart: null,
        hidden: true,
      }
      
      container.remove();
    });

    const endTimerButton = createButton('&#x2714;', 'end-timer-button', () => {
      runnerData.value[key] = {
        ...runnerData.value[key],
        segments: [
          ...runnerData.value[key].segments,
          {
            start: runnerData.value[key].currentRunStart,
            end: new Date().getTime(),
          },
        ],
        isRunning: false,
        currentRunStart: null,
      };
    });
  

    const resumeTimerButton = createButton('&#x25C0;', 'resume-timer-button', () => {
      const lastSegment = runnerData.value[key].segments[runnerData.value[key].segments.length - 1];

      if (!lastSegment) return;

      runnerData.value[key] = {
        ...runnerData.value[key],
        segments: runnerData.value[key].segments.slice(0, -1),
        isRunning: true,
        currentRunStart: lastSegment.start
      };
    });
  
    actionsCell.append(endTimerButton);
    actionsCell.append(resumeTimerButton);
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
      container.setAttribute('data-is-afk', data.isAFK);
      container.setAttribute('data-offset', data.offset);

      const cumulativeSeconds = data.segments.reduce((acc, { start, end, offset }) => (
        acc + timeToSeconds(start, end, offset)
      ), 0);
      console.log('recalc', cumulativeSeconds);

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