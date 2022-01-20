const { OBSUtility } = require('nodecg-utility-obs');

const NODECG_BUNDLE = 'nodecg-multiblitz';

const RUN_DATA_TEMPLATE = {
  segments: [],
  isRunning: false,
  currentRunStart: null,
  hidden: false,
  isAFK: false,
};

function timeToSeconds(startTime, endTime = null) {
  return ((endTime || new Date().getTime()) - startTime) / 1000;
}

module.exports = nodecg => {
  function log(message, force = false, method = console.info) {
    if (force || !nodecg.bundleConfig?.quiet) {
      method(`[${NODECG_BUNDLE}] ${message.toString()}`);
    }
  }

  function error(message) {
    log(message, true, console.error);
  }

  log('Multiblitz enabled B)');

  
  const router = nodecg.Router();
  const runnerData = nodecg.Replicant('runnerData', NODECG_BUNDLE, { defaultValue: {} });

  const autoAFKEnabled = nodecg.bundleConfig?.enableAutoAFK ?? false;
  const autoAFKCheckPeriod = nodecg.bundleConfig?.autoAFKCheckPeriod ?? 30000;
  const autoAFKDuration = nodecg.bundleConfig?.autoAFKCheckPeriod;

  if (autoAFKEnabled) {
    if (autoAFKDuration) {
      log('Auto AFK enabled.');

      setInterval(() => {
        log('Checking for runner AFKs...');
        Object.entries(runnerData.value).forEach(([key, data]) => {
          if (!data.isAFK && !data.isRunning) {
            const lastRun = data.segments[data.segments.length - 1];

            if (lastRun) {
              const msSinceLastRun = timeToSeconds(lastRun.end) * 1000;

              if (msSinceLastRun >= autoAFKDuration) {
                data.isAFK = true;

                runnerData[key] = data;

                log(`Marked ${key} as AFK.`);
              }
            }
          }
        });
      }, autoAFKCheckPeriod);
    } else {
      error('Could not enable auto AFK: autoAFKDuration config option must be defined.');
    }
  }

  const obsWebsocketOptions = nodecg.bundleConfig?.obsWebsocketOptions;
  const autoSceneEnabled = nodecg.bundleConfig?.enableAutoScene ?? false;
  const autoSceneCheckPeriod = nodecg.bundleConfig?.autoSceneCheckPeriod ?? 15000;
  const autoSceneNames = nodecg.bundleConfig?.autoSceneNames ?? [];
  const autoSceneOverrideNames = nodecg.bundleConfig?.autoSceneOverrideNames ?? [];

  if (autoSceneEnabled) {
    const obs = new OBSUtility(nodecg);
    
    if (obsWebsocketOptions) {
      obs.connect(obsWebsocketOptions)
        .then(() => {
          log('Connected to OBS websocket.');

          if (autoSceneNames.length > 0) {
            log('Auto-scene enabled.');

            setInterval(() => {
              log('[Auto-scene] Attempting to determine the expected active scene...');

              const activeRunners = Object.values(runnerData.value).filter(({ isAFK }) => !isAFK);

              if (activeRunners.length > 0) {
                const sceneName = autoSceneNames[activeRunners.length + 1] ?? autoSceneNames[autoSceneNames.length - 1];

                obs.send('GetCurrentScene')
                  .then(response => {
                    if(response.name === sceneName) {
                      log(`[Auto-scene] There are ${activeRunners.length} active runner(s), and the current scene (${response.name}) matches that count; the scene will not be changed.`);
                      return;
                    }

                    if (autoSceneOverrideNames.indexOf(response.name) !== -1) {
                      log(`[Auto-scene] There are ${activeRunners.length} active runner(s), but the active scene (${response.name}) is in the override list; the scene will not be changed.`);

                      return;
                    }

                    log(`[Auto-scene] There are ${activeRunners.length} active runner(s) - setting the active scene to ${sceneName}.`);

                    obs.send('SetCurrentScene', { 
                      'scene-name': sceneName,
                    }).then(() => {
                      log(`[Auto-scene] Successfully set the active scene to ${sceneName}.`);
                    }).catch(err => {
                      local (`[Auto-scene] Unable to set the active scene.`);
                      console.error(err);
                    });
                  }).catch(err => {
                    error(`[Auto-scene] Unable to determine the active scene, skipping scene transition.`);
                    console.error(err);
                  });

      
              } else {
                log('[Auto-scene] There are no active runners, so the scene will not be changed.');
              }
            }, autoSceneCheckPeriod);
          } else {
            error('Could not enable auto-scene: autoSceneNames must have at least one value.');
          }
        })
        .catch(err => {
          error(`Could not connect to OBS websocket: ${err}. Auto-scene will not be enabled.`);
          console.error(err);
          return;
        })
    } else {
      error('Could not enable OBS websocket connection: obsWebsocketOptions config option must be defined.');
    }
  }
  router.get('/start', (req, res) => {
    const key = req.query.key?.toLowerCase();

    if (!key) {
      res.status(400).send('No key specified');
      log(`Timer start request ignored: no runner key specified.`);

      return;
    }

    const runner = runnerData.value[key] ?? {
      ...RUN_DATA_TEMPLATE,
      segments: [],
    };

    if (runner.isRunning) {
      res.status(400).send('Run is already started.');
      log(`Timer start request ignored: ${key ?? '<undefined user>'} is already on a run.`);

      return;
    }

    log(`Timer started by ${key ?? '<undefined user>'} (time: ${req.query.time ?? '<not specified>'})`);

    runner.isRunning = true;
    runner.isAFK = false;
    runner.currentRunStart = Number(req.query.time);
    runner.hidden = false;

    runnerData.value = {
      ...runnerData.value,
      [key]: runner,
    };

    res.send(`Timer started.`);
  });

  
  router.get('/stop', (req, res) => {
    const key = req.query.key?.toLowerCase();

    if (!key) {
      res.status(400).send('No key specified');
      log(`Timer stop request ignored: no runner key specified.`);

      return;
    }

    const runner = runnerData.value[key];

    if (!runner) {
      res.status(400).send('Runner key is not registered.');
      log(`Timer stop request ignored: ${key ?? '<undefined user>'} is not registered as a runner.`);

      return;
    }

    if (!runner.isRunning || !runner.currentRunStart) {
      res.status(400).send('Run is already stopped.');
      log(`Timer stop request ignored: ${key ?? '<undefined user>'} is not currently on a run.`);

      return;
    }

    log(`Timer stopped by ${key ?? '<undefined user>'} (time: ${req.query.time ?? '<not specified>'})`);

    runner.isRunning = false;
    
    runner.segments.push({
      start: runner.currentRunStart,
      end: Number(req.query.time),
    });

    runner.currentRunStart = null;
        
    runnerData.value = {
      ...runnerData.value,
      [key]: runner,
    };

    res.send(`Timer stopped.`);
  });

  router.get('/afk', (req, res) => {
    const key = req.query.key?.toLowerCase();

    if (!key) {
      res.status(400).send('No key specified');
      log(`AFK toggle request ignored: no runner key specified.`);

      return;
    }
    
    const runner = runnerData.value[key];

    if (!runner) {
      res.status(400).send('Runner key is not registered.');
      log(`AFK toggle request ignored: ${key ?? '<undefined user>'} is not registered as a runner.`);

      return;
    }

    const status = req.query.status?.toLowerCase();
    
    if (!status) {
      res.status(400).send('"status" parameter is required.');
      log(`AFK toggle request ignored: ${key ?? '<undefined user>'} status parameter not specified.`);

      return;
    }

    if (status !== 'false' && status !== 'true') {
      res.status(400).send('"status" parameter must be either "true" or "false".');
      log(`AFK toggle request ignored: ${key ?? '<undefined user>'} status parameter has invalid value (${status}).`);

      return;
    }

    const requestedStatus = status === 'true';

    if (requestedStatus === runner.isAFK) {
      res.status(400).send('Already AFK.');
      log(`AFK toggle request ignored: ${key ?? '<undefined user>'} is already ${requestedStatus ? '' : 'not '}AFK.`);

      return;
    }

    log(`AFK toggle for ${req.query.key ?? '<undefined user>'} set to ${requestedStatus}.`);

    runner.isAFK = requestedStatus;
        
    runnerData.value = {
      ...runnerData.value,
      [key]: runner,
    };

    res.send(`Marked self as ${requestedStatus ? '' : 'no longer '}AFK`);
  });

  router.get('/status', (req, res) => {
    const key = req.query.key?.toLowerCase();

    if (key) {
      const data = nodecg.readReplicant('runnerData', NODECG_BUNDLE)[key];

      if (!data) {
        res.status(400).send(`${key} is not registered as a runner.`);
  
        return;
      }

      res.json(data);
    } else {
      res.json(nodecg.readReplicant('runnerData', NODECG_BUNDLE));
    }
  });

  router.get('/tools/afk', (req, res) => {
    res.redirect('/bundles/nodecg-multiblitz/tools/afk.html');
  });

  nodecg.mount('/multiblitz', router);
};