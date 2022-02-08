(() => {
  const toggleButton = document.querySelector("#afk-toggle");
  const updateRunnerDataButton = document.querySelector("#update-runner-data");
  const keyInput = document.querySelector('#runner-key');
  const runnerNameInput = document.querySelector('#runner-name');
  const runnerPronounsInput = document.querySelector('#runner-pronouns');
  const errorElement = document.querySelector('#error-card');
  const statusElement = document.querySelector('#status');
  const profileStatusElement = document.querySelector('#profile-status');
  
  const runnerData = { current: null };
  const isLoading = { current: false };

  function setAFKStatus(value) {
    console.log(value);
    if (value === null || value === undefined) {
      toggleButton.textContent = 'Go AFK';
      toggleButton.disabled = true;
      statusElement.innerHTML = '';
    } else {
      toggleButton.textContent = value ? 'Return from AFK' : 'Go AFK';
      statusElement.innerHTML = `You are <b>${value ? '' : 'not '}AFK</b>.`;
    }
  }

  function setRunnerData(value) {
    runnerData.current = value;

    setAFKStatus(value?.isAFK);

    if (value === null) {
      updateRunnerDataButton.disabled = true;
      runnerNameInput.innerHTML = '';
      runnerPronounsInput.innerHTML = '';
    } else {
      updateRunnerDataButton.disabled = false;
      runnerNameInput.value = value.runnerName ?? '';
      runnerPronounsInput.value = value.runnerPronouns ?? '';
    }
  }

  function fetchAndShowError(url, successCallback, errorCallback = null, formatAsJson = true, options = {}) {
    fetch(url, options).then(response => {
      isLoading.current = false;
      toggleButton.disabled = isLoading.current;

      if (response.status === 200) {
        if (formatAsJson) {
          response.json().then(successCallback);
        } else {
          response.text().then(successCallback);
        }
      } else {
        const onError = errorCallback || (text => {
          errorElement.textContent = text;
        });

        response.text().then(onError);
      }
    }).catch(error => {
      errorElement.textContent = error.toString();
    })
  }

  function fetchStatus() {
    const key = keyInput.value;

    if (key) {
      errorElement.textContent = '';

      fetchAndShowError(`/multiblitz/status?key=${key}`, body => {
        setRunnerData(body);
      }, error => {
        setRunnerData(null);
        errorElement.textContent = error;
      });
    }
  }

  keyInput.addEventListener('input', event => {
    fetchStatus();

    toggleButton.disabled = !event.target.value || isLoading.current;
  });
  

  toggleButton.addEventListener('click', () => {
    fetchAndShowError(`/multiblitz/afk?key=${keyInput.value}&status=${!runnerData.current.isAFK}`, () => {
      setRunnerData({
        ...runnerData.current,
        isAFK: !runnerData.current.isAFK
      });
    }, null, false);
  });

  updateRunnerDataButton.addEventListener('click', () => {
    profileStatusElement.textContent = '';

    fetchAndShowError(
      `/multiblitz/runnerProfile?key=${keyInput.value}`, 
      () => {
        profileStatusElement.textContent = 'Runner profile updated.';
      }, 
      null,
      false,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: runnerNameInput.value,
          pronouns: runnerPronounsInput.value,
        }),
      }
    );
  });
  
  toggleButton.disabled = true;
  updateRunnerDataButton.disabled = true;
})();