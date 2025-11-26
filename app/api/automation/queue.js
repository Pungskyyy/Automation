import { exec } from "child_process";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function adbRun(serial, cmd, retry = 2) {
  return new Promise((resolve, reject) => {
    exec(`adb -s ${serial} ${cmd}`, async (err, stdout) => {
      if (err || stdout.includes("protocol fault")) {
        if (retry > 0) {
          console.log(`[${serial}] Retry…`);
          await sleep(1200);
          return resolve(adbRun(serial, cmd, retry - 1));
        }
        return reject(`[${serial}] ERROR: ${err}`);
      }
      resolve(stdout);
    });
  });
}

export async function runCommentFlow(serial, comment) {
  try {
    console.log(`[${serial}] Start comment flow`);

    // open comment box
    await adbRun(serial, `shell input tap 540 1650`);
    await sleep(1200);

    // type text
    await adbRun(serial, `shell input text "${comment.replace(/ /g, "%s")}"`);
    await sleep(1400);

    // send
    await adbRun(serial, `shell input tap 980 1650`);
    await sleep(1500);

    console.log(`[${serial}] Comment sent`);
  } catch (e) {
    console.log(e);
  }
}
