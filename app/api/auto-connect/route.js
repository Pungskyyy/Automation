import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs/promises";

const run = util.promisify(exec);

export async function POST() {
  try {
    // Path ke skrip bash
    const scriptPath = path.join(process.cwd(), "scripts", "adb_tcpip_multi.sh");

    // Pastikan skrip memiliki izin eksekusi
    await run(`chmod +x ${scriptPath}`);

    // Jalankan skrip
    const { stdout, stderr } = await run(`bash ${scriptPath}`);

    const output = stdout || stderr || "Skrip selesai dijalankan";

    // Baca hasil dari CSV log terbaru
    const logFiles = await fs.readdir(process.cwd());
    const csvFiles = logFiles
      .filter(f => f.startsWith('adb_tcpip_') && f.endsWith('.log.csv'))
      .sort()
      .reverse();
    
    let successCount = 0;
    let failedCount = 0;
    let devices = [];

    if (csvFiles.length > 0) {
      const latestCsv = path.join(process.cwd(), csvFiles[0]);
      const csvContent = await fs.readFile(latestCsv, 'utf-8');
      const lines = csvContent.split('\n').filter(l => l && !l.startsWith('serial'));
      
      for (const line of lines) {
        const [serial, tcp_address, status] = line.split(',');
        if (status === 'success') {
          successCount++;
          devices.push({ serial, tcp_address });
        } else {
          failedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ TCP/IP Setup Complete!\n📊 Success: ${successCount} | Failed: ${failedCount}\n${devices.map(d => `✅ ${d.serial} → ${d.tcp_address}`).join('\n')}`,
      output: output.trim(),
      details: {
        successCount,
        failedCount,
        devices
      }
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        output: err.stdout || err.stderr || "",
      },
      { status: 500 }
    );
  }
}
