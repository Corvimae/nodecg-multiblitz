const NODECG_BUNDLE = 'nodecg-multiblitz';

const RUN_DATA_TEMPLATE = {
  segments: [],
  isRunning: false,
  currentRunStart: null,
  hidden: false,
};

function log(message) {
  console.info(`[${NODECG_BUNDLE}] ${message.toString()}`);
}

module.exports = nodecg => {
  const router = nodecg.Router();
  const runnerData = nodecg.Replicant('runnerData', NODECG_BUNDLE, { defaultValue: {} });

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
      log(`Timer start request ignored: ${req.query.key ?? '<undefined user>'} is already on a run.`);

      return;
    }

    log(`Timer started by ${req.query.key ?? '<undefined user>'} (time: ${req.query.time ?? '<not specified>'})`);

    runner.isRunning = true;
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
      log(`Timer stop request ignored: ${req.query.key ?? '<undefined user>'} is not registered as a runner.`);

      return;
    }

    if (!runner.isRunning || !runner.currentRunStart) {
      res.status(400).send('Run is already stopped.');
      log(`Timer stop request ignored: ${req.query.key ?? '<undefined user>'} is not currently on a run.`);

      return;
    }

    log(`Timer stopped by ${req.query.key ?? '<undefined user>'} (time: ${req.query.time ?? '<not specified>'})`);

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


  router.get('/status', (req, res) => {
    res.json(nodecg.readReplicant('runnerData', NODECG_BUNDLE));
  });

  nodecg.mount('/multiblitz', router);
};