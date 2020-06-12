module.exports = {
  apps: [
    {
      name: "sample-worker",
      script: "dist/workers/path/to/worker",
      args: "",
      instances: 1,
      autorestart: true,
      exec_mode: "fork",
      watch: false,
      // cwd: "./",
      max_memory_restart: "1G",
      env_development: {
        NODE_ENV: "development",
        PORT: 4009
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4009
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 4009
      }
    }
  ],

};
