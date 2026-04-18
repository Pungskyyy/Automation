export function findNode(xml, resourceIdContains) {
    const regex = new RegExp(
      `bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"[\\s\\S]*?resource-id="([^"]*${resourceIdContains}[^"]*)"`
    );
  
    const match = xml.match(regex);
    if (!match) return null;
  
    const x1 = parseInt(match[1], 10);
    const y1 = parseInt(match[2], 10);
    const x2 = parseInt(match[3], 10);
    const y2 = parseInt(match[4], 10);
  
    return {
      x: Math.floor((x1 + x2) / 2),
      y: Math.floor((y1 + y2) / 2),
      id: match[5],
    };
  }
  