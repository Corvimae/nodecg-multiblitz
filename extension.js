const path = require('path');

const NODECG_BUNDLE = 'nodecg-multiblitz';

const RUN_DATA_TEMPLATE = {
  segments: [],
  isRunning: false,
  currentRunStart: null,
  hidden: false,
  isAFK: false,
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
      log(`Timer start request ignored: ${key ?? '<undefined user>'} is already on a run.`);

      return;
    }

    log(`Timer started by ${key ?? '<undefined user>'} (time: ${req.query.time ?? '<not specified>'})`);

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