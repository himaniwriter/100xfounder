import {
  DELETE as blogDelete,
  GET as blogGet,
  PATCH as blogPatch,
  POST as blogPost,
  PUT as blogPut,
} from "@/app/api/webhooks/n8n-blog/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = blogGet;
export const PUT = blogPut;
export const PATCH = blogPatch;
export const DELETE = blogDelete;
export const POST = blogPost;

