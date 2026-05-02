import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const numericId = parseInt(id);
    if (isNaN(numericId)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    const product = await prisma.product.findUnique({ where: { id: numericId } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const patchId = parseInt(id);
    if (isNaN(patchId)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    const body = await req.json();

    const { name, price, priceNum, mrp, category, categoryKey, mainImage, thumbs, description, specs, colors, sizes, inStock, hsnCode, gstRate, sku } = body;

    const product = await prisma.product.update({
        where: { id: patchId },
        data: {
            ...(name !== undefined && name !== "" && { name }),
            ...(price !== undefined && price !== "" && { price }),
            ...(priceNum !== undefined && priceNum !== "" && { priceNum: parseInt(priceNum) }),
            ...(mrp !== undefined && { mrp: parseInt(mrp) || 0 }),
            ...(category !== undefined && category !== "" && { category }),
            ...(categoryKey !== undefined && categoryKey !== "" && { categoryKey }),
            ...(mainImage !== undefined && mainImage !== "" && { mainImage }),
            ...(thumbs !== undefined && { thumbs }),
            ...(description !== undefined && description !== "" && { description }),
            ...(specs !== undefined && { specs }),
            ...(colors !== undefined && { colors }),
            ...(sizes !== undefined && { sizes }),
            ...(inStock !== undefined && { inStock: Boolean(inStock) }),
            ...(hsnCode !== undefined && { hsnCode }),
            ...(gstRate !== undefined && { gstRate: parseFloat(gstRate) }),
            ...(sku !== undefined && { sku }),
        },
    });

    return NextResponse.json(product);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const delId = parseInt(id);
    if (isNaN(delId)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    await prisma.product.delete({ where: { id: delId } });
    return NextResponse.json({ success: true });
}
