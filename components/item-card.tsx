"use client";

import { useState } from "react";
import Link from "next/link";

interface ItemCardProps {
  item: {
    id: number;
    name: string;
    description?: string | null;
    price?: number | null;
    tag?: { id: number; name: string; color: string } | null;
    person?: { id: number; name: string; color: string } | null;
    checkedAt?: string;
    createdAt?: string;
    existsReceipt?: number;
  };
  showCheckbox?: boolean;
  onCheckChange?: (checked: boolean) => void;
  checked?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  currency?: string;
  showDatePrefix?: string;
}

export function ItemCard({
  item,
  showCheckbox = true,
  onCheckChange,
  checked = false,
  showDelete = true,
  onDelete,
  currency = "€",
  showDatePrefix = "",
}: ItemCardProps) {
  const [showDescription, setShowDescription] = useState(false);
  const date = item.checkedAt || item.createdAt;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckChange?.(e.target.checked)}
            className="mr-2 mt-1"
          />
        )}
        <div className="flex-1">
          <div className="flex justify-between">
            <h2 className="font-medium">{item.name}</h2>
            {date && (
              <div className="text-sm text-gray-500">
                {showDatePrefix}
                {new Date(date).toLocaleDateString()}
              </div>
            )}
          </div>

          {item.description && (
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="text-sm text-blue-500 mt-1"
            >
              {showDescription ? "Hide description" : "Show description"}
            </button>
          )}
          {showDescription && item.description && (
            <p className="text-gray-600 mt-1 text-sm">{item.description}</p>
          )}

          {item.price !== null && item.price !== undefined && (
            <p className="mt-1 text-sm">
              Price: {currency}
              {item.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {item.tag && (
          <span
            className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: `#${item.tag.color}20`, border: `1px solid #${item.tag.color}` }}
          >
            {item.tag.name}
          </span>
        )}
        {item.person && (
          <span
            className="text-xs px-2 py-1 rounded flex items-center gap-1"
            style={{ backgroundColor: `#${item.person.color}20`, border: `1px solid #${item.person.color}` }}
          >
            {item.person.name}
          </span>
        )}
      </div>
    </div>
  );
}
