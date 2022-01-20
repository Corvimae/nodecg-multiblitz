# nodecg-multiblitz

Tracks multiple timers and cumulative run attempt time for use in a nodecg overlay and provides a dashboard widget for event organizers.

## Installation

Either download the repo as a zip and extract into a folder named `nodecg-multiblitz` at `<your nodecg installation>/bundles`, or clone the repo into the bundles folder.

## Config

* `enableAutoAFK` (boolean, default: `true`) - Enable the auto AFK feature, which marks runners as AFK if they are not currently on a run or have not recently finished a run.
* `autoAFKDuration` (number, default: `300000`) - The amount of time a runner must be AFK before they are automatically marked as such. Defaults to 5 minutes.
* `autoAFKCheckPeriod` (number, default: `30000`) - How frequently to check for AFK runners, in milliseconds. Defaults to 30 seconds.
* `quiet` (boolean, default: `false`) - Disable non-critical multiblitz console logging.