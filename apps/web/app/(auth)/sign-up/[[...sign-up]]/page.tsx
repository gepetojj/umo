import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import logo from "@/public/umo.png";

export default function Page() {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<Link href="/">
						<Image src={logo} alt="umo" width={100} height={100} />
					</Link>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<SignUp />
				</div>
			</div>
			<div className="relative hidden bg-muted lg:block"></div>
		</div>
	);
}
