#!/bin/bash
# Supabase Security Advisor Check
# Runs splinter-style security checks against local Supabase instance
#
# Usage: ./scripts/security-check.sh [dev|test]
# Default: dev instance (port 54322)

set -e

INSTANCE="${1:-dev}"

if [ "$INSTANCE" = "test" ]; then
    CONTAINER="supabase_db_servus-raffle-test"
    echo "Checking TEST instance (port 54422)..."
else
    CONTAINER="supabase_db_servus-raffle"
    echo "Checking DEV instance (port 54322)..."
fi

echo ""
echo "=== SECURITY CHECKS ==="
echo ""

echo "1. Functions with mutable search_path:"
echo "   (Should set search_path = '' for security)"
docker exec $CONTAINER psql -U postgres -c "
SELECT
    n.nspname as schema,
    p.proname as function_name
FROM
    pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE
    n.nspname = 'public'
    AND NOT EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.proconfig, '{}')) as config
        WHERE config LIKE 'search_path=%'
    )
    AND p.prokind = 'f';
"

echo ""
echo "2. Tables without RLS enabled:"
docker exec $CONTAINER psql -U postgres -c "
SELECT
    schemaname as schema,
    tablename as table_name
FROM
    pg_tables
WHERE
    schemaname = 'public'
    AND tablename NOT IN (
        SELECT tablename FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE c.relrowsecurity = true
    );
"

echo ""
echo "3. Security definer functions (review for necessity):"
docker exec $CONTAINER psql -U postgres -c "
SELECT
    n.nspname as schema,
    p.proname as function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM
    pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE
    n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prokind = 'f';
"

echo ""
echo "=== PERFORMANCE CHECKS ==="
echo ""

echo "4. Tables with missing indexes on foreign keys:"
docker exec $CONTAINER psql -U postgres -c "
SELECT
    tc.table_name,
    kcu.column_name as fk_column,
    'Missing index' as issue
FROM
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );
"

echo ""
echo "5. RLS policies with auth functions not wrapped in (SELECT ...):"
echo "   (Should use (SELECT auth.uid()) instead of auth.uid() for initplan caching)"
# Note: Postgres stores wrapped functions as '( SELECT auth.uid() AS uid)' with alias
# So we check for 'auth.uid()' NOT preceded by 'SELECT ' to find unwrapped calls
docker exec $CONTAINER psql -U postgres -c "
SELECT
    schemaname,
    tablename,
    policyname,
    CASE
        WHEN qual ~ 'auth\.uid\(\)' AND qual !~ 'SELECT auth\.uid\(\)' THEN 'auth.uid() not wrapped in USING'
        WHEN qual ~ 'auth\.role\(\)' AND qual !~ 'SELECT auth\.role\(\)' THEN 'auth.role() not wrapped in USING'
        WHEN with_check ~ 'auth\.uid\(\)' AND with_check !~ 'SELECT auth\.uid\(\)' THEN 'auth.uid() not wrapped in WITH CHECK'
        WHEN with_check ~ 'auth\.role\(\)' AND with_check !~ 'SELECT auth\.role\(\)' THEN 'auth.role() not wrapped in WITH CHECK'
    END as issue
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND (
        (qual ~ 'auth\.uid\(\)' AND qual !~ 'SELECT auth\.uid\(\)')
        OR (qual ~ 'auth\.role\(\)' AND qual !~ 'SELECT auth\.role\(\)')
        OR (with_check ~ 'auth\.uid\(\)' AND with_check !~ 'SELECT auth\.uid\(\)')
        OR (with_check ~ 'auth\.role\(\)' AND with_check !~ 'SELECT auth\.role\(\)')
    );
"

echo ""
echo "=== CHECK COMPLETE ==="
