"use client";

import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

import { Nav } from "./components/nav";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<QueryClientProvider client={queryClient}>
					<Nav />
					<main className="pt-16">{children}</main>
				</QueryClientProvider>
			</body>
		</html>
	);
}
