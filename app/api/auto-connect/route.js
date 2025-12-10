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
    let alreadyTcpipCount = 0;
    let devices = [];
    let tcpipDevices = [];

    if (csvFiles.length > 0) {
      const latestCsv = path.join(process.cwd(), csvFiles[0]);
      const csvContent = await fs.readFile(latestCsv, 'utf-8');
      const lines = csvContent.split('\n').filter(l => l && !l.startsWith('serial'));
      
      for (const line of lines) {
        const [serial, tcp_address, status] = line.split(',');
        if (status === 'success') {
          successCount++;
          devices.push({ serial, tcp_address });
        } else if (status === 'already_tcpip') {
          alreadyTcpipCount++;
          tcpipDevices.push({ address: tcp_address });
        } else {
          failedCount++;
        }
      }
    }

    let message = `✅ TCP/IP Setup Complete!\n\n`;
    
    if (alreadyTcpipCount > 0) {
      message += `🌐 Already in TCP/IP mode: ${alreadyTcpipCount}\n`;
      tcpipDevices.forEach(d => {
        message += `   • ${d.address}\n`;
      });
      message += `\n`;
    }
    
    if (successCount > 0) {
      message += `🔄 Newly converted: ${successCount}\n`;
      devices.forEach(d => {
        message += `   ✅ ${d.serial} → ${d.tcp_address}\n`;
      });
      message += `\n`;
    }
    
    if (failedCount > 0) {
      message += `❌ Failed: ${failedCount}\n\n`;
    }
    
    message += `📱 Total devices: ${alreadyTcpipCount + successCount}`;

    return NextResponse.json({
      success: true,
      message,
      output: output.trim(),
      details: {
        successCount,
        failedCount,
        alreadyTcpipCount,
        devices,
        tcpipDevices,
        totalDevices: alreadyTcpipCount + successCount
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
