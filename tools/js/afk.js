(() => {
  const toggleButton = document.querySelector("#afk-toggle");
  const keyInput = document.querySelector('#runner-key');
  const errorElement = document.querySelector('#error-card');
  const statusElement = document.querySelector('#status');
  
  const afkStatus = { current: null };
  const isLoading = { current: false };

  function setAFKStatus(value) {
    afkStatus.current = value;

    if (value === null) {
      toggleButton.textContent = 'Go AFK';
      toggleButton.disabled = true;
      statusElement.innerHTML = '';
    } else {
      toggleButton.textContent = value ? 'Return from AFK' : 'Go AFK';
      statusElement.innerHTML = `You are <b>${value ? '' : 'not '}AFK</b>.`;
    }
  }

  function fetchAndShowError(url, successCallback, errorCallback = null, formatAsJson = true) {
    fetch(url).then(response => {
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
        setAFKStatus(body.isAFK);
      }, error => {
        setAFKStatus(null);
        errorElement.textContent = error;
      });
    }
  }

  keyInput.addEventListener('input', event => {
    fetchStatus();

    toggleButton.disabled = !event.target.value || isLoading.current;
  });
  

  toggleButton.addEventListener('click', () => {
    fetchAndShowError(`/multiblitz/afk?key=${keyInput.value}&status=${!afkStatus.current}`, () => {
      setAFKStatus(!afkStatus.current);
    }, null, false);
  });
})();