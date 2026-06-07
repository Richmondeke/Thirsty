const fs = require('fs');

function ipv6ToBigInt(ip) {
  // Normalize IPv6 address
  const parts = ip.split(':');
  let hexWords = [];
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '') {
      // Handle ::
      const missingCount = 8 - (parts.length - 1);
      for (let j = 0; j < missingCount; j++) {
        hexWords.push('0000');
      }
    } else {
      hexWords.push(parts[i].padStart(4, '0'));
    }
  }
  
  const hexStr = hexWords.join('');
  return BigInt('0x' + hexStr);
}

function inRange(ip, prefix) {
  const [prefixIp, maskStr] = prefix.split('/');
  const mask = parseInt(maskStr, 10);
  
  const ipVal = ipv6ToBigInt(ip);
  const prefixVal = ipv6ToBigInt(prefixIp);
  
  const shift = 128n - BigInt(mask);
  return (ipVal >> shift) === (prefixVal >> shift);
}

async function findRegion() {
  const response = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
  const data = await response.json();
  
  const ips = {
    old: '2a05:d018:1b65:3000:2ad1:3162:92cf:4651',
    new: '2a05:d018:cb7:ae00:1baa:e0f3:a5ab:c975'
  };
  
  for (const item of data.ipv6_prefixes) {
    if (item.ipv6_prefix.startsWith('2a05')) {
      console.log(`Prefix: ${item.ipv6_prefix} -> Region: ${item.region}`);
    }
  }
}

findRegion();
