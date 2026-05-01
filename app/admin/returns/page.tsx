"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUND_PROCESSED" | "REFUND_FAILED" | "COMPLETED";
type ReturnReason = "DAMAGED" | "WRONG_ITEM" | "QUALITY_ISSUE" | "CHANGED_MIND" | "OTHER";

interface ReturnItem {
    id: string;
    returnReason: ReturnReason;
    reason: string;
    proofImages: string[];
    refundAmount: number;
    deliveryCharges: number;
    status: ReturnStatus;
    adminNote: string | null;
    rejectionReason: string | null;
    returnWaybill: string | null;
    inspectionNotes: string | null;
    receivedAt: string | null;
    refundProcessedAt: string | null;
    razorpayRefundId: string | null;
    refundStatus: string | null;
    refundFailureReason: string | null;
    upiId: string | null;
    createdAt: string;
    order: {
        id: string;
        orderNumber: string;
        total: number;
        subtotal: number;
        shippingCost: number;
        tax: number;
        paymentMethod: string;
        razorpayPaymentId: string | null;
        shippingName: string;
        shippingEmail: string;
        shippingPhone: string | null;
        shippingAddress: string;
        shippingApartment: string | null;
        shippingCity: string;
        shippingState: string;
        shippingZip: string;
        items: { productName: string; quantity: number; price: number }[];
    };
    user: { name: string; email: string };
}

const REASON_LABELS: Record<ReturnReason, string> = {
    DAMAGED: "Item Damaged",
    WRONG_ITEM: "Wrong Item Received",
    QUALITY_ISSUE: "Quality Issue",
    CHANGED_MIND: "Changed Mind",
    OTHER: "Other",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "rgba(212,134,14,0.12)", text: "#f0b641", label: "Pending Review" },
    APPROVED: { bg: "rgba(46,125,50,0.12)", text: "#81c784", label: "Approved" },
    REJECTED: { bg: "rgba(183,28,28,0.12)", text: "#ef5350", label: "Rejected" },
    RECEIVED: { bg: "rgba(21,101,192,0.12)", text: "#64b5f6", label: "Item Received" },
    REFUND_PROCESSED: { bg: "rgba(46,125,50,0.18)", text: "#a5d6a7", label: "Refund Processed" },
    REFUND_FAILED: { bg: "rgba(183,28,28,0.18)", text: "#ff8a80", label: "Refund Failed" },
    COMPLETED: { bg: "rgba(21,101,192,0.12)", text: "#64b5f6", label: "Completed" },
};

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED" | "COMPLETED";

const FILTERS: { key: FilterStatus; label: string; color: string; activeColor: string }[] = [
    { key: "ALL", label: "All", color: "rgba(255,255,255,0.15)", activeColor: "#c9a84c" },
    { key: "PENDING", label: "Pending", color: "rgba(240,182,65,0.15)", activeColor: "#f0b641" },
    { key: "APPROVED", label: "Approved", color: "rgba(46,125,50,0.15)", activeColor: "#81c784" },
    { key: "REJECTED", label: "Rejected", color: "rgba(183,28,28,0.15)", activeColor: "#ef5350" },
    { key: "RECEIVED", label: "Received", color: "rgba(21,101,192,0.15)", activeColor: "#64b5f6" },
    { key: "COMPLETED", label: "Completed", color: "rgba(255,255,255,0.08)", activeColor: "rgba(255,255,255,0.7)" },
];

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, { admin?: string; rejection?: string; inspection?: string }>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [expandedImages, setExpandedImages] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>("ALL");

    const fetchReturns = async () => {
        const res = await fetch("/api/admin/returns");
        const data = await res.json();
        setReturns(data);
    };

    useEffect(() => { fetchReturns().finally(() => setLoading(false)); }, []);

    const setNote = (id: string, key: "admin" | "rejection" | "inspection", val: string) => {
        setNotes((prev) => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
    };

    async function handleAction(id: string, action: string, extra?: Record<string, string>) {
        setProcessing(id + action);
        setErrors((prev) => ({ ...prev, [id]: "" }));
        try {
            const n = notes[id] ?? {};
            const res = await fetch(`/api/admin/returns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    adminNote: n.admin ?? "",
                    rejectionReason: extra?.rejection ?? n.rejection ?? "",
                    inspectionNotes: extra?.inspection ?? n.inspection ?? "",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed");
            if (data.emailError) {
                setErrors((prev) => ({ ...prev, [id]: `Refund confirmed but email failed: ${data.emailError}` }));
            }
            await fetchReturns();
        } catch (e: unknown) {
            setErrors((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : "Error" }));
        } finally {
            setProcessing(null);
        }
    }

    const pending = returns.filter((r) => r.status === "PENDING");
    const approved = returns.filter((r) => r.status === "APPROVED");
    const received = returns.filter((r) => r.status === "RECEIVED");
    const failed = returns.filter((r) => r.status === "REFUND_FAILED");
    const rejected = returns.filter((r) => r.status === "REJECTED");
    const done = returns.filter((r) => ["REJECTED", "REFUND_PROCESSED", "COMPLETED"].includes(r.status));

    const counts: Record<FilterStatus, number> = {
        ALL: returns.length,
        PENDING: pending.length,
        APPROVED: approved.length,
        REJECTED: rejected.length,
        RECEIVED: received.length + failed.length,
        COMPLETED: done.filter((r) => r.status !== "REJECTED").length,
    };

    const show = (section: "pending" | "approved" | "received" | "failed" | "done") => {
        if (filter === "ALL") return true;
        if (filter === "PENDING") return section === "pending";
        if (filter === "APPROVED") return section === "approved";
        if (filter === "REJECTED") return section === "done" && rejected.length > 0;
        if (filter === "RECEIVED") return section === "received" || section === "failed";
        if (filter === "COMPLETED") return section === "done";
        return false;
    };

    const filteredDone = filter === "REJECTED"
        ? rejected
        : filter === "COMPLETED"
            ? done.filter((r) => r.status !== "REJECTED")
            : done;

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Returns</h1>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {pending.length} pending · {approved.length} approved · {received.length} received · {failed.length} failed · {done.length} done
                    </p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all cursor-pointer"
                            style={{
                                background: active ? f.activeColor : "rgba(255,255,255,0.05)",
                                color: active ? (f.key === "ALL" ? "#1a1a1a" : "#1a1a1a") : f.activeColor,
                                border: active ? "1px solid transparent" : `1px solid ${f.color}`,
                            }}
                        >
                            {f.label}
                            {counts[f.key] > 0 && (
                                <span
                                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                                    style={{
                                        background: active ? "rgba(0,0,0,0.2)" : f.color,
                                        color: active ? "#fff" : f.activeColor,
                                    }}
                                >
                                    {counts[f.key]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {returns.length === 0 && (
                <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)" }}>No return requests yet.</p>
                </div>
            )}

            {/* Image lightbox */}
            {expandedImages && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.85)" }}
                    onClick={() => setExpandedImages(null)}
                >
                    <div className="relative max-w-2xl w-full max-h-[85vh]">
                        <Image
                            src={expandedImages}
                            alt="Proof image"
                            width={800}
                            height={600}
                            className="rounded-xl object-contain max-h-[85vh] w-full"
                            style={{ background: "#111" }}
                        />
                        <button
                            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ background: "rgba(0,0,0,0.6)" }}
                            onClick={() => setExpandedImages(null)}
                        >✕</button>
                    </div>
                </div>
            )}

            <Section title={`Pending Review (${pending.length})`} color="#f0b641" show={show("pending") && pending.length > 0}>
                {pending.map((r) => (
                    <ReturnCard key={r.id} r={r} notes={notes[r.id] ?? {}} setNote={(k, v) => setNote(r.id, k, v)} processing={processing} errorMsg={errors[r.id] ?? ""} onExpandImage={setExpandedImages}>
                        <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Admin Actions</p>
                            <div className="flex flex-col gap-2 mb-3">
                                <textarea
                                    placeholder="Internal note (optional)"
                                    value={notes[r.id]?.admin ?? ""}
                                    onChange={(e) => setNote(r.id, "admin", e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                                />
                                <input
                                    type="text"
                                    placeholder="Rejection reason (required to reject)"
                                    value={notes[r.id]?.rejection ?? ""}
                                    onChange={(e) => setNote(r.id, "rejection", e.target.value)}
                                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                                />
                            </div>
                            {errors[r.id] && <ErrorMsg msg={errors[r.id]} />}
                            <div className="flex gap-2 flex-wrap">
                                <ActionButton
                                    label="Approve & Create Return Shipment"
                                    loadingLabel="Approving..."
                                    processingKey={r.id + "approve"}
                                    processing={processing}
                                    onClick={() => handleAction(r.id, "approve")}
                                    color="green"
                                />
                                <ActionButton
                                    label="Reject"
                                    loadingLabel="Rejecting..."
                                    processingKey={r.id + "reject"}
                                    processing={processing}
                                    onClick={() => handleAction(r.id, "reject")}
                                    color="red"
                                />
                            </div>
                        </div>
                    </ReturnCard>
                ))}
            </Section>

            <Section title={`Approved — Awaiting Customer Shipment (${approved.length})`} color="#81c784" show={show("approved") && approved.length > 0}>
                {approved.map((r) => (
                    <ReturnCard key={r.id} r={r} notes={notes[r.id] ?? {}} setNote={(k, v) => setNote(r.id, k, v)} processing={processing} errorMsg={errors[r.id] ?? ""} onExpandImage={setExpandedImages}>
                        <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Mark as Received</p>
                            <input
                                type="text"
                                placeholder="Inspection notes (optional)"
                                value={notes[r.id]?.inspection ?? ""}
                                onChange={(e) => setNote(r.id, "inspection", e.target.value)}
                                className="w-full rounded-xl px-3 py-2 text-sm outline-none mb-3"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                            />
                            {errors[r.id] && <ErrorMsg msg={errors[r.id]} />}
                            <ActionButton
                                label="Mark Package Received at Warehouse"
                                loadingLabel="Marking..."
                                processingKey={r.id + "mark_received"}
                                processing={processing}
                                onClick={() => handleAction(r.id, "mark_received")}
                                color="blue"
                            />
                        </div>
                    </ReturnCard>
                ))}
            </Section>

            <Section title={`Received — Confirm Refund (${received.length})`} color="#64b5f6" show={show("received") && received.length > 0}>
                {received.map((r) => (
                    <ReturnCard key={r.id} r={r} notes={notes[r.id] ?? {}} setNote={(k, v) => setNote(r.id, k, v)} processing={processing} errorMsg={errors[r.id] ?? ""} onExpandImage={setExpandedImages}>
                        <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="mb-3 p-3 rounded-xl" style={{ background: "rgba(21,101,192,0.1)", border: "1px solid rgba(21,101,192,0.2)" }}>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Refund Summary</p>
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Product price</span>
                                    <span style={{ color: "#64b5f6", fontWeight: 700 }}>₹{r.refundAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Delivery charges (non-refundable)</span>
                                    <span style={{ color: "#ef5350" }}>₹{r.deliveryCharges.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                    <span style={{ color: "#fff" }}>Refund via UPI</span>
                                    <span style={{ color: "#64b5f6" }}>₹{r.refundAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                                    Scan the QR code above to pay, then click Confirm Refund Sent.
                                </p>
                            </div>
                            {r.receivedAt && (
                                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    Received at warehouse: {new Date(r.receivedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                                </p>
                            )}
                            {r.inspectionNotes && (
                                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Inspection notes: {r.inspectionNotes}</p>
                            )}
                            {errors[r.id] && <ErrorMsg msg={errors[r.id]} />}
                            <ActionButton
                                label={`Confirm Refund Sent — ₹${r.refundAmount.toLocaleString("en-IN")}`}
                                loadingLabel="Confirming..."
                                processingKey={r.id + "process_refund"}
                                processing={processing}
                                onClick={() => handleAction(r.id, "process_refund")}
                                color="gold"
                            />
                        </div>
                    </ReturnCard>
                ))}
            </Section>

            <Section title={`Pending Confirmation (${failed.length})`} color="#ff8a80" show={show("failed") && failed.length > 0}>
                {failed.map((r) => (
                    <ReturnCard key={r.id} r={r} notes={notes[r.id] ?? {}} setNote={(k, v) => setNote(r.id, k, v)} processing={processing} errorMsg={errors[r.id] ?? ""} onExpandImage={setExpandedImages}>
                        <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            {errors[r.id] && <ErrorMsg msg={errors[r.id]} />}
                            <ActionButton
                                label={`Confirm Refund Sent — ₹${r.refundAmount.toLocaleString("en-IN")}`}
                                loadingLabel="Confirming..."
                                processingKey={r.id + "process_refund"}
                                processing={processing}
                                onClick={() => handleAction(r.id, "process_refund")}
                                color="gold"
                            />
                        </div>
                    </ReturnCard>
                ))}
            </Section>

            <Section title={`${filter === "REJECTED" ? "Rejected" : "Completed"} (${filteredDone.length})`} color="rgba(255,255,255,0.3)" show={show("done") && filteredDone.length > 0}>
                {filteredDone.map((r) => (
                    <ReturnCard key={r.id} r={r} notes={{}} setNote={() => {}} processing={null} errorMsg="" onExpandImage={setExpandedImages} readonly />
                ))}
            </Section>
        </div>
    );
}

function Section({ title, color, show, children }: { title: string; color: string; show: boolean; children: React.ReactNode }) {
    if (!show) return null;
    return (
        <div className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color }}>{title}</h2>
            <div className="flex flex-col gap-4">{children}</div>
        </div>
    );
}

function ErrorMsg({ msg }: { msg: string }) {
    return (
        <p className="mb-3 text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: "rgba(183,28,28,0.12)", color: "#ef5350", border: "1px solid rgba(183,28,28,0.2)" }}>{msg}</p>
    );
}

function ActionButton({ label, loadingLabel, processingKey, processing, onClick, color }: {
    label: string; loadingLabel: string; processingKey: string;
    processing: string | null; onClick: () => void;
    color: "green" | "red" | "blue" | "gold";
}) {
    const styles = {
        green: { background: "linear-gradient(135deg, rgba(46,125,50,0.3), rgba(46,125,50,0.1))", color: "#81c784", border: "1px solid rgba(46,125,50,0.2)" },
        red: { background: "rgba(183,28,28,0.12)", color: "#ef5350", border: "1px solid rgba(183,28,28,0.15)" },
        blue: { background: "linear-gradient(135deg, rgba(21,101,192,0.3), rgba(21,101,192,0.1))", color: "#64b5f6", border: "1px solid rgba(21,101,192,0.2)" },
        gold: { background: "linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.1))", color: "#e2c975", border: "1px solid rgba(201,168,76,0.2)" },
    };
    return (
        <button
            onClick={onClick}
            disabled={!!processing}
            className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50"
            style={styles[color]}
        >
            {processing === processingKey ? loadingLabel : label}
        </button>
    );
}

function ReturnCard({
    r, notes, setNote, processing, errorMsg, onExpandImage, readonly, children,
}: {
    r: ReturnItem;
    notes: { admin?: string; rejection?: string; inspection?: string };
    setNote: (k: "admin" | "rejection" | "inspection", v: string) => void;
    processing: string | null;
    errorMsg: string;
    onExpandImage: (url: string) => void;
    readonly?: boolean;
    children?: React.ReactNode;
}) {
    void notes; void setNote; void processing; void errorMsg;
    const style = STATUS_STYLE[r.status] ?? { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.5)", label: r.status };
    const images = Array.isArray(r.proofImages) ? r.proofImages : [];

    return (
        <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/admin/orders/${r.order.id}`} className="text-sm font-bold hover:opacity-70" style={{ color: "#e2c975" }}>
                            {r.order.orderNumber}
                        </Link>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: style.bg, color: style.text }}>
                            {style.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                            {r.order.paymentMethod}
                        </span>
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{r.user.name} · {r.user.email}</p>
                    {r.order.shippingPhone && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{r.order.shippingPhone}</p>}
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Requested {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#e2c975" }}>₹{r.order.total.toLocaleString("en-IN")}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#64b5f6" }}>Refund: ₹{r.refundAmount.toLocaleString("en-IN")}</p>
                    {r.deliveryCharges > 0 && (
                        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Delivery ₹{r.deliveryCharges.toLocaleString("en-IN")} not refunded</p>
                    )}
                </div>
            </div>

            {/* Shipping address */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Shipping Address</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {r.order.shippingAddress}{r.order.shippingApartment ? `, ${r.order.shippingApartment}` : ""}, {r.order.shippingCity}, {r.order.shippingState} – {r.order.shippingZip}
                </p>
            </div>

            {/* Items */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Order Items</p>
                {r.order.items.map((item, i) => (
                    <p key={i} className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {item.productName} × {item.quantity} — ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                ))}
            </div>

            {/* Return reason + description */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Return Reason</p>
                <p className="text-xs font-semibold mb-1" style={{ color: "#e2c975" }}>
                    {REASON_LABELS[r.returnReason] ?? r.returnReason}
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{r.reason}</p>
            </div>

            {/* UPI ID + QR */}
            {r.upiId && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Refund via UPI</p>
                    <div className="flex items-start gap-4">
                        <div className="rounded-lg overflow-hidden p-1.5 shrink-0" style={{ background: "#fff" }}>
                            <QRCodeSVG
                                value={`upi://pay?pa=${encodeURIComponent(r.upiId)}&pn=Customer&am=${r.refundAmount}&cu=INR&tn=Refund+for+order+${r.order.orderNumber}`}
                                size={96}
                                bgColor="#ffffff"
                                fgColor="#1a1a1a"
                            />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>UPI ID</p>
                            <p className="text-sm font-mono font-semibold break-all select-all" style={{ color: "#e2c975" }}>{r.upiId}</p>
                            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Amount</p>
                            <p className="text-base font-bold" style={{ color: "#81c784" }}>₹{r.refundAmount.toLocaleString("en-IN")}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Proof images */}
            {images.length > 0 && (
                <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Proof Images ({images.length})</p>
                    <div className="flex gap-2 flex-wrap">
                        {images.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={i}
                                src={url}
                                alt={`Proof ${i + 1}`}
                                onClick={() => onExpandImage(url)}
                                className="rounded-lg object-cover cursor-zoom-in"
                                style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Return waybill */}
            {r.returnWaybill && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(46,125,50,0.08)", border: "1px solid rgba(46,125,50,0.15)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Return Waybill</p>
                    <p className="text-sm font-mono font-bold" style={{ color: "#81c784" }}>{r.returnWaybill}</p>
                </div>
            )}

            {/* Rejection reason */}
            {r.rejectionReason && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(183,28,28,0.08)", border: "1px solid rgba(183,28,28,0.15)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Rejection Reason</p>
                    <p className="text-sm" style={{ color: "#ef5350" }}>{r.rejectionReason}</p>
                </div>
            )}

            {/* Admin note */}
            {r.adminNote && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Admin Note</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{r.adminNote}</p>
                </div>
            )}

            {/* Refund details */}
            {r.status === "REFUND_PROCESSED" && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(46,125,50,0.1)", border: "1px solid rgba(46,125,50,0.2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Refund Confirmed</p>
                    <p className="text-sm font-bold" style={{ color: "#81c784" }}>₹{r.refundAmount.toLocaleString("en-IN")} sent via UPI</p>
                    {r.refundProcessedAt && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{new Date(r.refundProcessedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>}
                </div>
            )}

            {/* Action slot */}
            {!readonly && children}
        </div>
    );
}
