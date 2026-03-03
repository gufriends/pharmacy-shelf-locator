import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
    try {
        const { pharmacyId } = await requirePharmacy();
        if (!pharmacyId) {
            return NextResponse.json({ success: false, error: "Pharmacy not found" }, { status: 401 });
        }

        const [medicineCount, rackCount, categoryCount, lowStockCount, expiringSoonCount, recentActivity] = await Promise.all([
            prisma.medicineItem.count({ where: { shelfLocation: { pharmacyId: pharmacyId } } }),
            prisma.shelfLocation.count({ where: { pharmacyId: pharmacyId } }),
            prisma.shelfCategory.count({ where: { pharmacyId: pharmacyId } }),
            prisma.medicineItem.count({ where: { shelfLocation: { pharmacyId: pharmacyId }, quantity: { lte: 5 } } }),
            prisma.medicineItem.count({
                where: {
                    shelfLocation: { pharmacyId: pharmacyId },
                    expiryDate: {
                        gte: new Date(),
                        lte: new Date(new Date().setDate(new Date().getDate() + 30)) // Next 30 days
                    }
                }
            }),
            prisma.inventoryAudit.findMany({
                where: { pharmacyId: pharmacyId },
                orderBy: { createdAt: "desc" },
                take: 10
            })
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                medicineCount,
                rackCount,
                categoryCount,
                lowStockCount,
                expiringSoonCount,
            },
            recentActivity
        });
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
