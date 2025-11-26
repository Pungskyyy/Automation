import { runCommentFlow } from "./queue.js";

const concurrency = 3; // TASK BERJALAN BERSAMA MAKSIMAL 3
let running = 0;
let queue = [];

function addTask(fn) {
  queue.push(fn);
  processQueue();
}

function processQueue() {
  if (running >= concurrency) return;
  const task = queue.shift();
  if (!task) return;

  running++;

  task().finally(() => {
    running--;
    processQueue();
  });
}

export function runForDevices(devices, text) {
  devices.forEach(device => {
    addTask(() => runCommentFlow(device.serial, text));
  });
}
