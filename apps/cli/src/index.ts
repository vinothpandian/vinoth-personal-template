export {}

const USAGE = `personal-template CLI

Usage:
  bun run src/index.ts <command>

Commands:
  status   Print backend health as JSON (authenticates with WORKER_TOKEN)
  tui      Open the interactive terminal UI
  help     Show this message

Environment:
  API_URL       Base URL of the web app (default http://127.0.0.1:3000)
  WORKER_TOKEN  Static bearer token for worker procedures (required)
`

async function printStatus(): Promise<void> {
  const { createApiClient } = await import('./client')
  const api = createApiClient()
  try {
    const health = await api.health.check()
    console.log(JSON.stringify(health, null, 2))
  } catch (cause) {
    console.error(
      'Health check failed:',
      cause instanceof Error ? cause.message : cause,
    )
    process.exit(1)
  }
}

const command = process.argv[2] ?? 'help'

switch (command) {
  case 'status':
    await printStatus()
    break
  case 'tui': {
    const { runTui } = await import('./tui')
    await runTui()
    break
  }
  case 'help':
  case '--help':
  case '-h':
    console.log(USAGE)
    break
  default:
    console.error(`Unknown command: ${command}\n`)
    console.log(USAGE)
    process.exit(1)
}
