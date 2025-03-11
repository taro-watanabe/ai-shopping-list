'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

async function fetchPeople() {
  const response = await fetch("/api/people");
  return response.json();
}

async function addPerson({ name, color }: { name: string; color: string }) {
  const response = await fetch("/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  return response.json();
}

async function deletePerson(id: number) {
  const response = await fetch('/api/people', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

export default function PeoplePage() {
  const queryClient = useQueryClient();
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonColor, setNewPersonColor] = useState("ffffff");

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people"],
    queryFn: fetchPeople,
  });

  const addMutation = useMutation({
    mutationFn: addPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      setNewPersonName("");
      setNewPersonColor("ffffff");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">People</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newPersonName.trim() && newPersonColor) {
            addMutation.mutate({ name: newPersonName, color: newPersonColor });
          }
        }}
        className="mb-4"
      >
        <div className="space-y-2">
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Person name"
            className="w-full p-2 border rounded"
            required
          />
          <div className="flex gap-2">
            <input
              type="color"
              value={`#${newPersonColor}`}
              onChange={(e) => setNewPersonColor(e.target.value.slice(1))}
              className="h-10 w-16 p-1 border rounded"
            />
            <input
              type="text"
              value={newPersonColor}
              onChange={(e) => setNewPersonColor(e.target.value)}
              placeholder="Hex color"
              pattern="[a-fA-F0-9]{6}"
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Person
          </button>
        </div>
      </form>

      <ul className="space-y-2">
        {people.map((person: { id: number; name: string; color: string }) => (
          <li key={person.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: `#${person.color}` }}
              />
              <span>{person.name}</span>
            </div>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(person.id)}
              className="text-red-500 hover:text-red-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <title>Delete person</title>
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}