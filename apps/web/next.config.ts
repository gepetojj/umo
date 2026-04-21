import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	reactStrictMode: true,
	poweredByHeader: false,
};

export default withWorkflow(nextConfig);
