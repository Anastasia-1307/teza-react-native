#!/usr/bin/env node

const os = require('os');
const http = require('http');

// Funcție pentru a obține IP-urile locale
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        ips.push({
          interface: name,
          ip: interface.address,
          url: `http://${interface.address}:8000`
        });
      }
    }
  }
  
  return ips;
}

// Funcție pentru a testa dacă un server rulează pe un port
function testServer(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: '/docs',
      method: 'HEAD',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve({ url, success: true, status: res.statusCode });
    });

    req.on('error', () => {
      resolve({ url, success: false, error: 'Connection failed' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, success: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('Scanning for local IP addresses and servers...\n');
  
  const ips = getLocalIPs();
  
  console.log('Found local IP addresses:');
  ips.forEach(({ interface, ip, url }) => {
    console.log(`  ${interface}: ${ip} -> ${url}`);
  });
  
  console.log('\nTesting servers on port 8000...');
  
  const testResults = [];
  for (const { url } of ips) {
    const result = await testServer(url);
    testResults.push(result);
  }
  
  // Testăm și localhost
  const localhostResult = await testServer('http://localhost:8000');
  testResults.push(localhostResult);
  
  console.log('\nTest results:');
  testResults.forEach(({ url, success, status, error }) => {
    if (success) {
      console.log(` ${url} - Server is running (status: ${status})`);
    } else {
      console.log(` ${url} - ${error}`);
    }
  });
  
  const workingServers = testResults.filter(r => r.success);
  
  if (workingServers.length > 0) {
    console.log('\n Working servers found:');
    workingServers.forEach(({ url }) => {
      console.log(` ${url}`);
    });
    
    console.log('\n Update your NetworkConfig.js to use:');
    console.log(`const POSSIBLE_IPS = [`);
    workingServers.forEach(({ url }) => {
      console.log(`  '${url}',`);
    });
    console.log(`];`);
  } else {
    console.log('\n No working servers found on port 8000');
    console.log('Make sure your backend server is running on port 8000');
  }
}

main().catch(console.error);
