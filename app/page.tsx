'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

async function fetchItems() {
  const response = await fetch('/api/items');
  return response.json();
}

async function addItem(name: string) {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return response.json();
}

async function toggleItem(id: number, checked: boolean) {
  const response = await fetch('/api/items', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, checked }),
  });
  return response.json();
}

export default function Home() {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  const addMutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setNewItem('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Shopping List</h1>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newItem.trim()) {
            addMutation.mutate(newItem);
          }
        }}
        className="mb-4"
      >
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item"
          className="w-full p-2 border rounded"
        />
      </form>

      <ul className="space-y-2">
        {items
          .filter((item) => !item.checked)
          .map((item) => (
            <li key={item.id} className="flex items-center">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                className="mr-2"
              />
              <span>{item.name}</span>
            </li>
          ))}
      </ul>

      <div className="mt-8 pt-4 border-t">
        <h2 className="text-lg font-semibold mb-2">Checked Items</h2>
        <ul className="space-y-2">
          {items
            .filter((item) => item.checked)
            .map((item) => (
              <li key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleMutation.mutate({ id: item.id, checked: !item.checked })}
                  className="mr-2"
                />
                <span className="line-through">{item.name}</span>
              </li>
            ))}
        </ul>
      </div>
    </main>
  );
}
