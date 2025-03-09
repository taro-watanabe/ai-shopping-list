"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

async function fetchItems() {
  const response = await fetch("/api/items");
  return response.json();
}

async function fetchTags() {
  const response = await fetch("/api/tags");
  return response.json();
}

async function addItem({ name, tagId }: { name: string; tagId?: number }) {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, tagId }),
  });
  return response.json();
}

async function toggleItem({ id, checked }: { id: number; checked: boolean }) {
  const response = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, checked }),
  });
  return response.json();
}

export default function Home() {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const addMutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setNewItem("");
      setSelectedTagId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const renderItem = (item: {
    id: number;
    checked: boolean;
    name: string;
    createdAt: string;
    tagId?: number;
    tag?: { id: number; name: string; color: string };
  }) => (
    <li key={item.id} className="flex items-center justify-between">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() =>
            toggleMutation.mutate({
              id: item.id,
              checked: !item.checked,
            })
          }
          className="mr-2"
        />
        <div className="flex flex-col">
          <span className={item.checked ? "line-through" : ""}>{item.name}</span>
          <span className="text-xs text-gray-500">
            {(() => {
  const dateString = item.createdAt.split('T')[0];
  // Extract the year part after the '+' and convert to number
  const year = Number(dateString.split('-')[0].substring(1));
  const month = Number(dateString.split('-')[1]);
  const day = Number(dateString.split('-')[2]);
  return new Date(year, month - 1, day).toLocaleDateString();
})()}
          </span>
        </div>
      </div>
      {item.tag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{item.tag.name}</span>
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: `#${item.tag.color}` }}
          />
        </div>
      )}
    </li>
  );

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Shopping List</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newItem.trim()) {
            addMutation.mutate({ name: newItem, tagId: selectedTagId || undefined });
          }
        }}
        className="mb-4 space-y-2"
      >
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item"
          className="w-full p-2 border rounded"
        />
        <select
          value={selectedTagId || ""}
          onChange={(e) => setSelectedTagId(Number(e.target.value) || null)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a tag (optional)</option>
          {tags.map((tag: { id: number; name: string }) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Item
        </button>
      </form>

      <ul className="space-y-2">
        {items
          .filter((item: { checked: boolean }) => !item.checked)
          .map(renderItem)}
      </ul>

      <div className="mt-8 pt-4 border-t">
        <h2 className="text-lg font-semibold mb-2">Checked Items</h2>
        <ul className="space-y-2">
          {items
            .filter((item: { checked: boolean }) => item.checked)
            .map(renderItem)}
        </ul>
      </div>
    </main>
  );
}
