"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/lib/wishlistContext";
import { useToast } from "@/lib/toastContext";

interface WishlistProduct {
    id: string;
    productId: number;
    product: {
        id: number;
        name: string;
        price: string;
        priceNum: number;
        category: string;
        mainImage: string;
        gstRate: number;
        reviews: { rating: number }[];
    };
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width={11} height={11} viewBox="0 0 24 24"
                    fill={s <= Math.round(rating) ? "#c9a84c" : "none"} stroke="#c9a84c" strokeWidth={1.5}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </div>
    );
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const { toggle } = useWishlist();
    const { showToast } = useToast();
    const router = useRouter();

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/wishlist");
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWishlist(); }, []);

    const handleRemove = async (productId: number, productName: string) => {
        await toggle(productId);
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        showToast({ type: "wishlist-remove", message: "Removed from Wishlist", subMessage: productName });
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "#faf9f6" }}>
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-10">
                <h1
                    className="text-3xl md:text-4xl mb-2"
                    style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontStyle: "italic", color: "#1a1a1a" }}
                >
                    My Wishlist
                </h1>
                {!loading && (
                    <p className="text-sm mb-8" style={{ color: "#999" }}>
                        {items.length} saved item{items.length !== 1 ? "s" : ""}
                    </p>
                )}

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#e0d5c5", borderTopColor: "#c9a84c" }} />
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-4xl mb-4" style={{ color: "#e0d5c5" }}>♡</div>
                        <p className="text-lg italic mb-2" style={{ color: "#999", fontFamily: "var(--font-cormorant), serif" }}>
                            Your wishlist is empty
                        </p>
                        <p className="text-sm mb-6" style={{ color: "#aaa" }}>Save pieces you love by clicking the heart icon</p>
                        <Link
                            href="/collections"
                            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest rounded-lg text-white hover:opacity-90 transition-opacity"
                            style={{ background: "#c9a84c" }}
                        >
                            Browse Collections
                        </Link>
                    </div>
                )}

                {!loading && items.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <div key={item.id} className="group relative cursor-pointer" onClick={() => router.push(`/collections/${item.product.id}`)}>
                                {/* Remove button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemove(item.productId, item.product.name); }}
                                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                                    style={{ background: "rgba(255,255,255,0.9)", color: "#e05252" }}
                                    title="Remove from wishlist"
                                >
                                    ✕
                                </button>

                                <Link href={`/collections/${item.product.id}`}>
                                    <div className="rounded-xl overflow-hidden aspect-square relative mb-3" style={{ background: "#f5ede0" }}>
                                        <Image
                                            src={item.product.mainImage}
                                            alt={item.product.name}
                                            fill
                                            style={{ objectFit: "cover" }}
                                            className="group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#999" }}>
                                        {item.product.category}
                                    </p>
                                    <p className="text-sm font-semibold leading-snug" style={{ color: "#1a1a1a" }}>
                                        {item.product.name}
                                    </p>
                                    {(() => {
                                        const count = item.product.reviews.length;
                                        const avg = count > 0 ? item.product.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
                                        return (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Stars rating={avg} />
                                                <span className="text-[10px]" style={{ color: "#aaa" }}>({count})</span>
                                            </div>
                                        );
                                    })()}
                                    <p className="text-sm font-bold mt-1" style={{ color: "#c9a84c" }}>
                                        {item.product.price}
                                    </p>
                                </Link>

                                <Link
                                    href={`/collections/${item.product.id}`}
                                    className="block w-full mt-3 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all hover:opacity-90 no-underline text-center"
                                    style={{ background: "#c9a84c", color: "#fff" }}
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
