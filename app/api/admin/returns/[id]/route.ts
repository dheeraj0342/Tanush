import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createReturnWithQC } from "@/lib/shiprocket";
import {
    sendReturnApprovedEmail,
    sendReturnRejectedEmail,
    sendReturnReceivedEmail,
    sendRefundProcessedEmail,
} from "@/lib/email";

const VALID_ACTIONS = ["approve", "reject", "mark_received", "process_refund"] as const;
type Action = typeof VALID_ACTIONS[number];

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, adminNote, rejectionReason, inspectionNotes } = body as {
        action: Action;
        adminNote?: string;
        rejectionReason?: string;
        inspectionNotes?: string;
    };

    if (!VALID_ACTIONS.includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const returnRequest = await prisma.returnRequest.findUnique({
        where: { id },
        include: {
            order: {
                include: {
                    items: true,
                    deliveryTracking: true,
                },
            },
            user: { select: { name: true, email: true } },
        },
    });

    if (!returnRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { order, user } = returnRequest;

    // ── APPROVE ────────────────────────────────────────────────────────────────
    if (action === "approve") {
        if (returnRequest.status !== "PENDING") {
            return NextResponse.json({ error: "Only pending requests can be approved" }, { status: 400 });
        }

        let returnWaybill = "";
        try {
            const result = await createReturnWithQC({
                referenceOrderId: order.orderNumber,
                customerName: order.shippingName,
                customerPhone: order.shippingPhone ?? "9999999999",
                customerEmail: order.shippingEmail ?? "",
                customerAddress: [order.shippingAddress, order.shippingApartment].filter(Boolean).join(", "),
                customerCity: order.shippingCity,
                customerState: order.shippingState,
                customerPincode: order.shippingZip,
                weight: 500,
                subTotal: order.total,
                returnReason: returnRequest.returnReason,
                upiId: returnRequest.upiId ?? undefined,
                // Items include Cloudinary image URLs for QC verification by pickup agent
                items: order.items.map((i) => ({
                    name: i.productName,
                    sku: i.sku ?? i.productName,
                    units: i.quantity,
                    sellingPrice: i.price,
                    imageUrl: i.productImage ?? undefined,
                })),
            });
            // Use AWB if auto-assigned, otherwise use SR order ID as reference
            returnWaybill = result.awb ?? String(result.srOrderId);
        } catch (e) {
            return NextResponse.json(
                { error: `Failed to create return shipment: ${e instanceof Error ? e.message : String(e)}` },
                { status: 502 }
            );
        }

        await prisma.returnRequest.update({
            where: { id },
            data: { status: "APPROVED", adminNote: adminNote ?? null, returnWaybill },
        });

        sendReturnApprovedEmail(
            user.email, user.name, order.orderNumber,
            returnWaybill, returnRequest.refundAmount
        ).catch(console.error);

        return NextResponse.json({ success: true, status: "APPROVED", returnWaybill });
    }

    // ── REJECT ─────────────────────────────────────────────────────────────────
    if (action === "reject") {
        if (returnRequest.status !== "PENDING") {
            return NextResponse.json({ error: "Only pending requests can be rejected" }, { status: 400 });
        }

        await prisma.returnRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                adminNote: adminNote ?? null,
                rejectionReason: rejectionReason ?? adminNote ?? null,
            },
        });

        sendReturnRejectedEmail(
            user.email, user.name, order.orderNumber,
            rejectionReason ?? adminNote ?? ""
        ).catch(console.error);

        return NextResponse.json({ success: true, status: "REJECTED" });
    }

    // ── MARK RECEIVED ──────────────────────────────────────────────────────────
    if (action === "mark_received") {
        if (returnRequest.status !== "APPROVED") {
            return NextResponse.json({ error: "Only approved returns can be marked as received" }, { status: 400 });
        }

        await prisma.returnRequest.update({
            where: { id },
            data: {
                status: "RECEIVED",
                inspectionNotes: inspectionNotes ?? null,
                receivedAt: new Date(),
            },
        });

        sendReturnReceivedEmail(
            user.email, user.name, order.orderNumber, returnRequest.refundAmount
        ).catch(console.error);

        return NextResponse.json({ success: true, status: "RECEIVED" });
    }

    // ── PROCESS REFUND ─────────────────────────────────────────────────────────
    if (action === "process_refund") {
        if (!["RECEIVED", "REFUND_FAILED"].includes(returnRequest.status)) {
            return NextResponse.json({ error: "Only received returns can be refunded" }, { status: 400 });
        }

        const refundAmount = returnRequest.refundAmount;

        await prisma.returnRequest.update({
            where: { id },
            data: {
                status: "REFUND_PROCESSED",
                refundStatus: "SUCCESSFUL",
                refundProcessedAt: new Date(),
                refundProcessedBy: session.user.id,
                adminNote: adminNote ?? null,
            },
        });

        let emailSent = false;
        let emailError: string | undefined;
        try {
            await sendRefundProcessedEmail(
                user.email, user.name, order.orderNumber,
                refundAmount, null, null
            );
            emailSent = true;
        } catch (e) {
            emailError = e instanceof Error ? e.message : String(e);
            console.error("sendRefundProcessedEmail failed:", emailError);
        }

        return NextResponse.json({ success: true, status: "REFUND_PROCESSED", emailSent, emailError });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
