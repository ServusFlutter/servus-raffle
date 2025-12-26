import { execSync } from 'node:child_process'

export async function setup() {
  console.log('🚀 Starting integration test setup...')

  // Check if Supabase is running
  try {
    const status = execSync('bunx supabase status', { encoding: 'utf-8' })
    console.log('✅ Supabase is running')

    // Extract keys from status output
    const anonKeyMatch = status.match(/anon key: (.+)/)
    const serviceKeyMatch = status.match(/service_role key: (.+)/)

    if (anonKeyMatch) {
      process.env.SUPABASE_ANON_KEY = anonKeyMatch[1].trim()
    }
    if (serviceKeyMatch) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKeyMatch[1].trim()
    }
  } catch {
    console.error('❌ Supabase is not running!')
    console.error('Please start Supabase with: bunx supabase start')
    process.exit(1)
  }

  // Reset database to clean state with seed data
  console.log('🔄 Resetting database...')
  try {
    execSync('bunx supabase db reset --no-confirm', {
      encoding: 'utf-8',
      stdio: 'inherit',
    })
    console.log('✅ Database reset complete')
  } catch (error) {
    console.error('❌ Failed to reset database:', error)
    process.exit(1)
  }

  console.log('✅ Integration test setup complete')
}

export default setup
