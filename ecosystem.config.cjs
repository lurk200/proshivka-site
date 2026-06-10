module.exports = {
  apps: [
    {
      name: 'proshivka',
      cwd: __dirname,
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
