import { auth } from "./auth";
import { headers } from "next/headers";

/**
 * Server-side helper to get the current session and active pharmacy ID.
 * Use this in all API routes that need auth + pharmacy scoping.
 */
export async function getSessionWithOrg() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return { session: null, pharmacyId: null, userId: null, error: "UNAUTHORIZED" as const };
    }

    const pharmacyId = session.session.activeOrganizationId;

    return {
        session,
        pharmacyId,
        userId: session.user.id,
        error: null,
    };
}

/**
 * Require both auth and active pharmacy. Returns typed error responses.
 */
export async function requirePharmacy() {
    const result = await getSessionWithOrg();

    if (!result.session) {
        return { ...result, error: "UNAUTHORIZED" as const };
    }

    if (!result.pharmacyId) {
        return { ...result, error: "NO_PHARMACY" as const };
    }

    return result as {
        session: NonNullable<typeof result.session>;
        pharmacyId: string;
        userId: string;
        error: null;
    };
}
