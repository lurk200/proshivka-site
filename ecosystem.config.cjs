const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const env = {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"'))
        || (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch {
    // .env optional — defaults apply in server code
  }
  return env;
}

module.exports = {
  apps: [
    {
      name: 'proshivka',
      cwd: __dirname,
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production',
        ...loadEnvFile(path.join(__dirname, '.env')),
      },
    },
  ],
};
