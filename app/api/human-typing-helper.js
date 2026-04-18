// Helper untuk typing seperti manusia
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldPause() {
  // 20% chance untuk pause (seperti mikir)
  return Math.random() < 0.2;
}

function shouldMakeTypo() {
  // 10% chance untuk typo (lebih realistic)
  return Math.random() < 0.1;
}

async function humanLikeTyping(serial, text, adbShell, delay) {
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Type each character with random delay
    for (let j = 0; j < word.length; j++) {
      const char = word[j];
      
      // Random typing speed per character (80-200ms)
      const charDelay = getRandomDelay(80, 200);
      
      // Escape special characters untuk ADB
      const escapedChar = char
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/ /g, '%s');
      
      await adbShell(serial, `input text "${escapedChar}"`);
      await delay(charDelay);
      
      // Sesekali pause di tengah kata (seperti mikir)
      if (j > 2 && shouldPause()) {
        const pauseDelay = getRandomDelay(300, 800);
        await delay(pauseDelay);
      }
      
      // Sesekali typo & correction (lebih natural)
      if (shouldMakeTypo() && j < word.length - 1) {
        // Type wrong character
        const wrongChars = ['a', 's', 'd', 'f', 'g', 'h'];
        const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
        await adbShell(serial, `input text "${wrongChar}"`);
        await delay(getRandomDelay(100, 300));
        
        // Backspace to delete
        await adbShell(serial, `input keyevent 67`); // KEYCODE_DEL
        await delay(getRandomDelay(100, 200));
      }
    }
    
    // Add space after word (except last word)
    if (i < words.length - 1) {
      await adbShell(serial, `input text "%s"`);
      
      // Random delay after space (100-400ms)
      const spaceDelay = getRandomDelay(100, 400);
      await delay(spaceDelay);
      
      // Longer pause after punctuation (seperti baca ulang)
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        const punctuationPause = getRandomDelay(500, 1200);
        await delay(punctuationPause);
      }
    }
  }
  
  // Final pause setelah selesai typing (seperti review comment)
  const finalPause = getRandomDelay(800, 1500);
  await delay(finalPause);
}

module.exports = { humanLikeTyping };
