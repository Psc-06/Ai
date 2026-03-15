'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '..', '..', 'backend');
const specFile = path.join(backendDir, 'bankshield.spec');
const pythonCandidates = [
  path.join(backendDir, 'venve', 'Scripts', 'python.exe'),
  path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
  'python',
];

const pythonPath = pythonCandidates.find((candidate) => candidate === 'python' || fs.existsSync(candidate));

if (!pythonPath) {
  console.error('No Python interpreter was found for building the backend bundle.');
  process.exit(1);
}

const result = spawnSync(pythonPath, ['-m', 'PyInstaller', specFile, '--clean', '--noconfirm'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}