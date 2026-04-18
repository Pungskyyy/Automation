import { NextResponse } from "next/server";
import os from "os";
import { useEffect, useState } from "react";

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            name,
            address: iface.address,
            url: `http://${iface.address}:3000`
          });
        }
      }
    }

    return NextResponse.json({
      hostname: os.hostname(),
      addresses,
      port: 3000,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// Fetch network info
export default function NetworkInfoComponent() {
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    async function getNetworkInfo() {
      try {
        const res = await fetch('/api/network-info');
        const data = await res.json();
        
        // Filter out 0.0.0.0
        if (data.addresses) {
          data.addresses = data.addresses.filter(addr => 
            addr.address !== '0.0.0.0' && !addr.address.startsWith('127.')
          );
        }
        
        setNetworkInfo(data);
      } catch (err) {
        console.error('Failed to get network info:', err);
      }
    }
    getNetworkInfo();
  }, []);

  return (
    <div>
      {networkInfo ? (
        <pre>{JSON.stringify(networkInfo, null, 2)}</pre>
      ) : (
        <p>Loading network info...</p>
      )}
    </div>
  );
}
