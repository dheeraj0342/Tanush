import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ canReview: false });
    }

    const { productId } = await params;
    const numericProductId = parseInt(productId);
    if (isNaN(numericProductId)) {
        return NextResponse.json({ canReview: false });
    }

    const order = await prisma.order.findFirst({
        where: {
            userId: session.user.id,
            status: { notIn: ["PENDING", "CANCELLED"] },
            items: { some: { productId: numericProductId } },
        },
        select: { id: true },
    });

    return NextResponse.json({ canReview: !!order });
}
