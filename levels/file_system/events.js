window.reloadExternalModules = true;

const fs = require("fs");
const os = require("os");
const path = require("path");

const chokidar = require("chokidar");

const INITIAL_STATE = {
  nothingYet: false,
};

// Create a unique key for our state to be stored under
const WORLD_STATE_KEY = "com.twilioquest.file_system";

function getStartingDirectory() {
  // TODO: let them set this
  return path.resolve(os.homedir(), "tq-files");
}

function checkDirectoryState() {
  // TODO: There could be multiple of these
  const expectedPath = ["examples", "greetings", "ahoy.txt"];
  // An array of paths one step at a time
  const progressivePaths = expectedPath.reduce((accumulator, value) => {
    let initialPath = getStartingDirectory();
    if (accumulator.length > 0) {
      initialPath = accumulator[accumulator.length - 1];
    }
    accumulator.push(path.resolve(initialPath, value));
    return accumulator;
  }, []);
  const results = progressivePaths.map((filePath) => {
    const exists = fs.existsSync(filePath);
    return {
      filePath,
      exists,
    };
  });
  const firstMissing = results.find((entry) => !entry.exists);
  let message;
  if (firstMissing !== undefined) {
    // Hacky...check and see if the file has an extension
    const isFile = path.basename(firstMissing.filePath).includes(".");
    message = `Please add the ${isFile ? "file" : "directory"} ${
      firstMissing.filePath
    }`;
  }
  return {
    valid: firstMissing === undefined,
    message,
    results,
  };
}

module.exports = function (event, world) {
  // Load our world state
  const worldState = world.getState(WORLD_STATE_KEY) || INITIAL_STATE;

  function updateDirectoryFeedback() {
    const currentDirectoryState = checkDirectoryState();
    if (!currentDirectoryState.valid) {
      world.showNotification(currentDirectoryState.message);
    } else {
      world.showNotification("You did it!");
      world.hideEntities("fire");
    }
    return currentDirectoryState.valid;
  }

  if (event.name === "mapDidLoad") {
    world.showNotification(`Working directory is ${getStartingDirectory()}`);
    const watcher = chokidar.watch(getStartingDirectory(), {
      ignoreInitial: true,
    });
    watcher.on("all", (fileEvent, path) => {
      console.log(fileEvent, path);
      const valid = updateDirectoryFeedback();
      if (valid) {
        watcher.unwatch(getStartingDirectory());
      }
    });
    updateDirectoryFeedback();
  }

  world.setState(WORLD_STATE_KEY, worldState);
};
