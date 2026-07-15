import { spawn } from 'node:child_process'

const processes = [
  ['api', 'node', ['server.js']],
  ['web', 'npx', ['vite']],
]

let shuttingDown = false

const children = processes.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: process.env,
  })

  child.stdout.on('data', chunk => process.stdout.write(`[${name}] ${chunk}`))
  child.stderr.on('data', chunk => process.stderr.write(`[${name}] ${chunk}`))
  child.on('exit', code => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code || 1)
    }
  })

  return child
})

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))