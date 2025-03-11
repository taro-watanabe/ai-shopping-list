import Link from "next/link";

export function Nav() {
	return (
		<nav className="bg-gray-800 shadow-sm fixed w-full top-0 z-10">
			<div className="max-w-4xl mx-auto px-4">
				<div className="flex justify-between h-16">
					<div className="flex space-x-8">
						<Link
							href="/"
							className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-gray-300"
						>
							Shopping List
						</Link>
						<Link
							href="/tags"
							className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-gray-300"
						>
							Tags
						</Link>
						<Link
							href="/people"
							className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-gray-300"
						>
							People
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
}
