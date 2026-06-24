import 'dotenv/config'
import fs from 'node:fs'
import { createApp } from './server/app.js'
import { getEnv } from './server/config/env.js'

process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', error => {
  fs.appendFileSync('server-crash.log', `${new Date().toISOString()} uncaughtException ${error.stack || error.message}\n`)
})
process.on('unhandledRejection', error => {
  fs.appendFileSync('server-crash.log', `${new Date().toISOString()} unhandledRejection ${error?.stack || error}\n`)
})
process.on('exit', code => {
  fs.appendFileSync('server-crash.log', `${new Date().toISOString()} exit ${code}\n`)
})

const env = getEnv()
const app = createApp(env)

app.listen(env.port, () => {
  console.log(`Privacy Mirror API listening on http://localhost:${env.port}`)
})
