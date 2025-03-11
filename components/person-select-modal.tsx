"use client";

import { useState } from "react";

function Modal({
	open,
	onClose,
	children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">{children}</div>
		</div>
	);
}

interface PersonSelectModalProps {
	open: boolean;
	onClose: () => void;
	onSelect: (personId: number | null) => void;
	people: Array<{ id: number; name: string; color: string }>;
}

export function PersonSelectModal({
	open,
	onClose,
	onSelect,
	people,
}: PersonSelectModalProps) {
	const [selectedPerson, setSelectedPerson] = useState<number | null>(null);

	const handleSelect = () => {
		onSelect(selectedPerson);
		onClose();
	};

	return (
		<Modal open={open} onClose={onClose}>
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Who Paid?</h2>
				<div className="grid grid-cols-1 gap-2">
					{people.map((person) => (
						<div
							key={person.id}
							className={`flex items-center p-2 rounded cursor-pointer ${
								selectedPerson === person.id
									? "bg-gray-100"
									: "hover:bg-gray-50"
							}`}
							onClick={() => setSelectedPerson(person.id)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									setSelectedPerson(person.id);
								}
							}}
							tabIndex={0}
							role="button"
						>
							<div
								className="w-4 h-4 rounded-full mr-2"
								style={{ backgroundColor: person.color }}
							/>
							<span>{person.name}</span>
						</div>
					))}
				</div>
				<div className="flex justify-end gap-2">
					<button
						onClick={onClose}
						className="
              px-4 py-2 text-sm font-medium text-gray-700 
              bg-gray-100 rounded hover:bg-gray-200
            "
						type="button"
					>
						Cancel
					</button>
					<button
						onClick={handleSelect}
						className="
              px-4 py-2 text-sm font-medium text-white 
              bg-blue-500 rounded hover:bg-blue-600
            "
						type="button"
					>
						Select
					</button>
				</div>
			</div>
		</Modal>
	);
}
