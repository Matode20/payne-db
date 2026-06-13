"use client";

import Link from "next/link";
import { deleteMember, resetMember, setBanStatus } from "../actions";

interface Props {
  id: string;
  name: string;
  status: string;
}

export default function MemberActions({ id, name, status }: Props) {
  const isBanned = status === "banned";

  async function handleDelete() {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    await deleteMember(id);
  }

  async function handleBan() {
    await setBanStatus(id, !isBanned);
  }

  async function handleReset() {
    if (!confirm(`Are you sure you want to reset all balances and transactions for ${name}? This cannot be undone.`)) return;
    await resetMember(id);
  }

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <Link
        href={`/admin/members/${id}`}
        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
      >
        Edit
      </Link>
      <button
        onClick={handleBan}
        className={`text-xs font-semibold ${isBanned ? "text-green-600 hover:text-green-800" : "text-orange-600 hover:text-orange-800"}`}
      >
        {isBanned ? "Unban" : "Ban"}
      </button>
      <button
        onClick={handleReset}
        className="text-orange-600 hover:text-orange-800 text-xs font-semibold"
      >
        Reset
      </button>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-800 text-xs font-semibold"
      >
        Delete
      </button>
    </div>
  );
}
