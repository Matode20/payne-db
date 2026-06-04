"use client";

import { useState, useTransition } from "react";
import { banUser, unbanUser, updateUserRole, listUsers } from "./actions";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
};

interface UsersTableProps {
  initialUsers: User[];
}

const ROLES = ["user", "admin", "moderator"];

export default function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function doSearch(q: string) {
    setSearch(q);
    startTransition(async () => {
      try {
        const result = await listUsers(q);
        setUsers(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to search");
      }
    });
  }

  function isBanned(user: User) {
    if (!user.banned_until) return false;
    return new Date(user.banned_until) > new Date();
  }

  async function handleBan(userId: string, currentlyBanned: boolean) {
    setError(null);
    setActionUserId(userId);
    try {
      if (currentlyBanned) {
        await unbanUser(userId);
      } else {
        await banUser(userId);
      }
      const updated = await listUsers(search);
      setUsers(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionUserId(null);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    setError(null);
    setActionUserId(userId);
    try {
      await updateUserRole(userId, role);
      const updated = await listUsers(search);
      setUsers(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => doSearch(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBadge label="Total Users" value={users.length} color="indigo" />
        <StatBadge label="Admins" value={users.filter((u) => u.role === "admin").length} color="purple" />
        <StatBadge label="Banned" value={users.filter((u) => isBanned(u)).length} color="red" />
        <StatBadge label="Confirmed" value={users.filter((u) => u.email_confirmed_at).length} color="green" />
      </div>

      {/* Table - desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    {isPending ? "Searching…" : "No users found"}
                  </td>
                </tr>
              )}
              {users.map((user) => {
                const banned = isBanned(user);
                const loading = actionUserId === user.id;
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${banned ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                          {(user.full_name || user.email)[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.full_name || "—"}</p>
                          <p className="text-gray-500 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={loading}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                          banned
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {banned ? "Banned" : "Active"}
                        </span>
                        {user.email_confirmed_at && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 w-fit">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleBan(user.id, banned)}
                        disabled={loading}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                          banned
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {loading ? "…" : banned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - mobile */}
      <div className="md:hidden space-y-3">
        {users.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            {isPending ? "Searching…" : "No users found"}
          </div>
        )}
        {users.map((user) => {
          const banned = isBanned(user);
          const loading = actionUserId === user.id;
          return (
            <div
              key={user.id}
              className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${banned ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                    {(user.full_name || user.email)[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.full_name || "—"}</p>
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                  banned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {banned ? "Banned" : "Active"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <select
                  value={user.role}
                  disabled={loading}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleBan(user.id, banned)}
                  disabled={loading}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                    banned
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  {loading ? "…" : banned ? "Unban" : "Ban"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorMap[color] ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}
