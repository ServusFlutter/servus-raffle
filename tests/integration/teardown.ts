export async function teardown() {
  console.info('🧹 Integration test teardown complete')
  // Supabase keeps running for future test runs
  // Run `bunx supabase stop` manually if needed
}

export default teardown
