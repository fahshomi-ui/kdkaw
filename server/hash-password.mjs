#!/usr/bin/env node
import readline from 'node:readline';
import { hashPassword } from './security.mjs';

const argument = process.argv[2];
if (argument !== undefined) {
  if (!argument) { console.error('Password must not be empty'); process.exitCode = 1; }
  else process.stdout.write(`${hashPassword(argument)}\n`);
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr, terminal: false });
  const chunks = [];
  rl.on('line', (line) => chunks.push(line));
  rl.on('close', () => {
    const password = chunks.join('\n').replace(/\r?\n$/, '');
    if (!password) { console.error('Password must not be empty'); process.exitCode = 1; return; }
    process.stdout.write(`${hashPassword(password)}\n`);
  });
}
