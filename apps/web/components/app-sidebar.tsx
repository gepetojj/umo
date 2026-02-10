"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
	BadgeCheck,
	ChevronsUpDown,
	LogOut,
	MessageSquarePlusIcon,
	MicIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
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

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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
	const { setOpenMobile, isMobile } = useSidebar();
	const { meetings: list, loading } = useMeetings();
	const { user } = useUser();
	const { signOut } = useAuth();

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
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage
											src={user?.imageUrl}
											alt={user?.fullName ?? ""}
										/>
										<AvatarFallback className="rounded-lg">
											{user?.fullName?.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">
											{user?.fullName ?? ""}
										</span>
										<span className="truncate text-xs">
											{user?.primaryEmailAddress
												?.emailAddress ?? ""}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
								side={isMobile ? "bottom" : "right"}
								align="end"
								sideOffset={4}
							>
								<DropdownMenuLabel className="p-0 font-normal">
									<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarImage
												src={user?.imageUrl}
												alt={user?.fullName ?? ""}
											/>
											<AvatarFallback className="rounded-lg">
												{user?.fullName?.charAt(0) ??
													""}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{user?.fullName ?? ""}
											</span>
											<span className="truncate text-xs">
												{user?.primaryEmailAddress
													?.emailAddress ?? ""}
											</span>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem asChild>
										<Link href="/account">
											<BadgeCheck />
											Conta
										</Link>
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => signOut()}>
									<LogOut />
									Sair
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
