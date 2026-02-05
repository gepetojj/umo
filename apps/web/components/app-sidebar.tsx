"use client";

import { MessageSquarePlusIcon, MicIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetings } from "@/lib/use-meetings";

function formatDate(ms: number) {
	const d = new Date(ms);
	const now = new Date();
	const sameDay =
		d.getDate() === now.getDate() &&
		d.getMonth() === now.getMonth() &&
		d.getFullYear() === now.getFullYear();
	if (sameDay)
		return d.toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function AppSidebar() {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();
	const { meetings: list, loading } = useMeetings();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={pathname === "/"}>
							<Link
								href="/"
								onClick={() => setOpenMobile(false)}
								className="min-h-[44px]"
							>
								<MessageSquarePlusIcon className="size-5" />
								<span>Nova reunião</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Reuniões</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{loading ? (
								<>
									<SidebarMenuItem>
										<Skeleton className="h-9 w-full rounded-md" />
									</SidebarMenuItem>
									<SidebarMenuItem>
										<Skeleton className="h-9 w-full rounded-md" />
									</SidebarMenuItem>
								</>
							) : list.length === 0 ? (
								<SidebarMenuItem>
									<span className="px-2 text-muted-foreground text-sm">
										Nenhuma reunião ainda
									</span>
								</SidebarMenuItem>
							) : (
								list.map((m) => (
									<SidebarMenuItem key={m.id}>
										<SidebarMenuButton
											asChild
											isActive={pathname === `/m/${m.id}`}
										>
											<Link
												href={`/m/${m.id}`}
												onClick={() =>
													setOpenMobile(false)
												}
												className="min-h-[44px]"
											>
												<MicIcon className="size-4 shrink-0" />
												<span className="truncate">
													{m.title ||
														"Reunião sem título"}
												</span>
												<span className="ml-1 shrink-0 text-muted-foreground text-xs">
													{formatDate(m.createdAt)}
												</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
