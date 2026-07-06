import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listReportsTool from "./tools/list-reports";
import getReportTool from "./tools/get-report";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "viewsup-mcp",
  title: "ViewsUp MCP",
  version: "0.1.0",
  instructions:
    "Access the signed-in user's ViewsUp Instagram profile analysis reports. Use `list_reports` to browse recent analyses, then `get_report` for the full analysis JSON of a specific report.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listReportsTool, getReportTool],
});
