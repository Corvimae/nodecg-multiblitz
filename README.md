# nodecg-multiblitz

Tracks multiple timers and cumulative run attempt time for use in a nodecg overlay and provides a dashboard widget for event organizers.

## Installation

Either download the repo as a zip and extract into a folder named `nodecg-multiblitz` at `<your nodecg installation>/bundles`, or clone the repo into the bundles folder.

## Config

* `enableAutoAFK` (boolean, default: `true`) - Enable the auto AFK feature, which marks runners as AFK if they are not currently on a run or have not recently finished a run.
* `autoAFKDuration` (number, default: `300000`) - The amount of time a runner must be AFK before they are automatically marked as such. Defaults to 5 minutes.
* `autoAFKCheckPeriod` (number, default: `30000`) - How frequently to check for AFK runners, in milliseconds. Defaults to 30 seconds.
* `obsWebsocketOptions` (object) - The connection details for [obs-websocket](https://github.com/obsproject/obs-websocket).
  * `obsWebsocketOptions.address` (string, default: `localhost:4444`) - The address of the OBS websocket.
  * `obsWebsocketOptions.password` (string, default: ` `) - The password for the OBS websocket.
  * `obsWebsocketOptions.secure` (boolean, default: `false`) - Whether to use TLS for the OBS websocket.
* `enableAutoScene` (boolean, default: `false`) - Enable the auto-scene feature, which switches the active scene based on the number of non-AFK runners.
* `autoSceneCheckPeriod` (number, default: `15000`) - How frequently to check to see if the active scene should be changed, in milliseconds. Defaults to 15 seconds.
* `autoSceneNames` (array of strings, default: `[]`) - The scenes to set as active depending on the number of active runners. This list should be sequential, 1-indexed: the first value is the scene name for one active runner, the second value is the scene name for two active runners, and so forth. The last value is used for any number of active runners equal to or greater than that index. At least one scene must be specified here if `enableAutoScene` is true.
* `autoSceneOverrideNames` (array of strings, default: `[]`) - A list of scenes that auto-scene will never change from; if one of these scenes is currently active, auto-scene will always do nothing.
* `quiet` (boolean, default: `false`) - Disable non-critical multiblitz console logging.