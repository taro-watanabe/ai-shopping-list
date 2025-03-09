'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

async function fetchTags() {
  const response = await fetch('/api/tags');
  return response.json();
}

async function createTag({ name, color }: { name: string; color: string }) {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  return response.json();
}

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('');

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTagName('');
      setNewTagColor('');
    },
  });

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Tags</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newTagName.trim() && newTagColor.trim()) {
            createMutation.mutate({ name: newTagName, color: newTagColor });
          }
        }}
        className="mb-4"
      >
        <div className="space-y-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            placeholder="Tag color (6-digit hex)"
            pattern="[a-fA-F0-9]{6}"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Tag
        </button>
      </form>

      <ul className="space-y-2">
        {tags.map((tag: { id: number; name: string; color: string }) => (
          <li key={tag.id} className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: `#${tag.color}` }}
            />
            <span>{tag.name}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}