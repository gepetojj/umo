import { WorkspaceJoinClient } from "@/components/workspace/workspace-join-client";

type PageProps = {
	params: Promise<{ token: string }>;
};

export default async function WorkspaceJoinPage({ params }: PageProps) {
	const { token } = await params;
	return <WorkspaceJoinClient token={token} />;
}
