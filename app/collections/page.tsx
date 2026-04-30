"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/lib/wishlistContext";
import { useToast } from "@/lib/toastContext";

interface ColorVariant {
    name: string;
    hex: string;
    image: string;
    sizes: string[];
}

interface Product {
    id: number;
    name: string;
    price: string;
    priceNum: number;
    category: string;
    categoryKey: string;
    mainImage: string;
    inStock: boolean;
    colors: ColorVariant[];
    avgRating: number;
    reviewCount: number;
    gstRate: number;
}

const categories = [
    { key: "all", label: "All" },
    { key: "bridal", label: "Bridal" },
    { key: "traditional", label: "Traditional Ethnic" },
    { key: "minimal", label: "Minimal & Daily" },
];

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width={size} height={size} viewBox="0 0 24 24"
                    fill={s <= Math.round(rating) ? "#c9a84c" : "none"} stroke="#c9a84c" strokeWidth={1.5}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </div>
    );
}

function CollectionsContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category") ?? "all";
    const [activeCategory, setActiveCategory] = useState(categoryParam);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const url = activeCategory === "all" ? "/api/products" : `/api/products?category=${activeCategory}`;
        fetch(url)
            .then((r) => r.json())
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, [activeCategory]);

    const activeLabel = categories.find((c) => c.key === activeCategory)?.label ?? "All Collections";

    return (
        <div className="flex flex-col min-h-screen w-full" style={{ background: "#faf9f6" }}>
            <Navbar />
            <main className="flex-1 w-full">
                {/* Hero */}
                <section className="text-center py-14 md:py-20 px-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "#c9a84c" }}>Handcrafted Excellence</p>
                    <h1 className="text-4xl md:text-5xl mb-4 leading-tight"
                        style={{ fontFamily: "var(--font-cormorant), Georgia, serif", color: "#1a1a1a", fontWeight: 400, fontStyle: "italic" }}>
                        {activeCategory === "all" ? "Our Collections" : activeLabel}
                    </h1>
                    <div className="mx-auto w-12 h-[2px] bg-[#c9a84c] mb-4" />
                    <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "#6b6b6b" }}>
                        {activeCategory === "all"
                            ? "Explore our entire range of artisanal bangles."
                            : `Discover our finest ${activeLabel.toLowerCase()} pieces, handcrafted with love.`}
                    </p>
                </section>

                {/* Category tabs */}
                <div className="w-full max-w-6xl mx-auto px-6 mb-10 flex flex-wrap justify-center gap-3">
                    {categories.map((cat) => (
                        <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                            className="px-5 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer"
                            style={{
                                background: activeCategory === cat.key ? "#c9a84c" : "#fff",
                                color: activeCategory === cat.key ? "#fff" : "#555",
                                border: `1px solid ${activeCategory === cat.key ? "#c9a84c" : "#e0d5c5"}`,
                            }}>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Product grid */}
                <section className="w-full max-w-6xl mx-auto px-6 pb-20">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#e0d5c5", borderTopColor: "#c9a84c" }} />
                        </div>
                    ) : products.length === 0 ? (
                        <p className="text-center text-sm py-20" style={{ color: "#999" }}>No products in this category yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => <ProductCard key={product.id} product={product} />)}
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    );
}

function ProductCard({ product }: { product: Product }) {
    const { isInWishlist, toggle: toggleWishlist } = useWishlist();
    const { showToast } = useToast();
    const router = useRouter();
    const [hovered, setHovered] = useState(false);

    const originalPrice = Math.round(product.priceNum * 1.15);
    const rating = product.avgRating;
    const reviewCount = product.reviewCount;
    const inWishlist = isInWishlist(product.id);

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product.id);
        showToast(
            inWishlist
                ? { type: "wishlist-remove", message: "Removed from Wishlist", subMessage: product.name }
                : { type: "wishlist-add", message: "Added to Wishlist", subMessage: product.name }
        );
    };

    return (
        <div className="group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
            style={{ background: "#fff", border: "1px solid #e8e3db", boxShadow: hovered ? "0 8px 30px rgba(201,168,76,0.12)" : "0 1px 4px rgba(0,0,0,0.04)" }}
            onClick={() => router.push(`/collections/${product.id}`)}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

            <Link href={`/collections/${product.id}`} className="block relative" style={{ aspectRatio: "4/5" }}>
                <Image src={product.mainImage} alt={product.name} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />

                {/* Wishlist button */}
                <button onClick={handleWishlist}
                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer"
                    style={{ background: "#fff", border: "1px solid #e8e3db", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24"
                        fill={inWishlist ? "#c9a84c" : "none"} stroke="#c9a84c" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                </button>

                {product.id <= 3 && (
                    <div className="absolute top-3 left-3 z-10 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ background: "#c9a84c", color: "#fff" }}>New</div>
                )}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#888" }}>Sold Out</span>
                    </div>
                )}
            </Link>

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Stars rating={rating} size={11} />
                    <span className="text-[10px]" style={{ color: "#aaa" }}>({reviewCount})</span>
                </div>
                <Link href={`/collections/${product.id}`} className="no-underline">
                    <h3 className="text-[15px] mb-1.5 leading-snug line-clamp-2 hover:text-[#c9a84c] transition-colors"
                        style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 600, color: "#1a1a1a" }}>
                        {product.name}
                    </h3>
                </Link>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold" style={{ color: "#c9a84c" }}>{product.price}</span>
                    <span className="text-xs line-through" style={{ color: "#bbb" }}>₹{originalPrice.toLocaleString("en-IN")}</span>
                </div>

                {/* Color swatches */}
                {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                        {product.colors.slice(0, 4).map((c, ci) => (
                            <div
                                key={ci}
                                title={c.name}
                                className="rounded-full border"
                                style={{ width: 14, height: 14, background: c.hex, border: "1px solid #e0d5c5", flexShrink: 0 }}
                            />
                        ))}
                        {product.colors.length > 4 && (
                            <span className="text-[10px]" style={{ color: "#aaa" }}>+{product.colors.length - 4}</span>
                        )}
                    </div>
                )}

                <Link href={`/collections/${product.id}`}
                    className="block w-full py-2.5 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 no-underline text-center"
                    style={{ background: "#c9a84c", color: "#fff" }}>
                    View
                </Link>
            </div>
        </div>
    );
}

export default function CollectionsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen w-full items-center justify-center" style={{ background: "#faf9f6" }}>
                <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CollectionsContent />
        </Suspense>
    );
}
