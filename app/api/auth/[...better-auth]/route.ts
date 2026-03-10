import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = (req: any) => {
    console.log("[Auth GET]", req.url);
    return handler.GET(req);
};

export const POST = (req: any) => {
    console.log("[Auth POST]", req.url);
    return handler.POST(req);
};
