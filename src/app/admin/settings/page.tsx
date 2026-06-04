import { readFile } from "fs/promises";
import path from "path";

async function getMigrationSQL() {
  try {
    const filePath = path.join(process.cwd(), "supabase", "migrations", "001_schema.sql");
    return await readFile(filePath, "utf-8");
  } catch {
    return "-- Migration file not found. See supabase/migrations/001_schema.sql";
  }
}

export default async function SettingsPage() {
  const sql = await getMigrationSQL();

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">System configuration for PayneDB</p>
      </div>

      {/* Database Setup */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Database Setup</h2>
          <p className="text-sm text-gray-500 mt-1">
            Run this SQL once in your Supabase SQL editor to create the required tables, enable Row Level Security, and set up automatic profile creation for new members.
          </p>
        </div>

        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Open your Supabase project → <strong>SQL Editor</strong></li>
          <li>Click <strong>New query</strong></li>
          <li>Paste the SQL below and click <strong>Run</strong></li>
          <li>Return here and refresh — the dashboard will show live data</li>
        </ol>

        <div className="relative">
          <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">
            {sql}
          </pre>
        </div>
      </section>

      {/* Environment Variables */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <h2 className="text-base font-bold text-gray-800">Environment Variables</h2>
        <p className="text-sm text-gray-500">Ensure these are set in your <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">.env.local</code> file:</p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-700 leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
        </pre>
      </section>

      {/* RLS Note */}
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
        <h2 className="text-base font-bold text-amber-800">Row Level Security</h2>
        <p className="text-sm text-amber-700">
          The migration enables RLS on all tables. Members can <strong>only read their own data</strong>. All admin writes use the <strong>service role key</strong> which bypasses RLS — members can never edit their own balances directly.
        </p>
      </section>
    </div>
  );
}
