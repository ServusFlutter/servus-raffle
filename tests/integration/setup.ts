import { execSync } from 'node:child_process'

export async function setup() {
  console.log('🚀 Starting integration test setup...')

  // Check if Test Supabase is running
  try {
    execSync('bunx supabase --workdir supabase-test status', {
      encoding: 'utf-8',
    })
    console.log('✅ Test Supabase is running')

    // Set standard local Supabase demo keys if not already set
    if (!process.env.SUPABASE_ANON_KEY) {
      process.env.SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    }
  } catch {
    console.error('❌ Test Supabase is not running!')
    console.error('Please start Test Supabase with: bun run supabase:test')
    console.error('Or: bunx supabase --workdir supabase-test start')
    process.exit(1)
  }

  // Reset database to clean state with seed data
  console.log('🔄 Resetting test database...')
  try {
    execSync('bunx supabase --workdir supabase-test db reset --yes', {
      encoding: 'utf-8',
      stdio: 'inherit',
    })
    console.log('✅ Test database reset complete')
  } catch (error) {
    console.error('❌ Failed to reset test database:', error)
    process.exit(1)
  }

  console.log('✅ Integration test setup complete')
}

export default setup
