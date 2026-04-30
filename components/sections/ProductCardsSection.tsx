"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/lib/wishlistContext";
import { useToast } from "@/lib/toastContext";

interface Product {
    id: number;
    name: string;
    price: string;
    priceNum: number;
    category: string;
    mainImage: string;
    avgRating: number;
    reviewCount: number;
    gstRate: number;
}

interface ProductCardsSectionProps {
    products: Product[];
}

/* ── Star Rating ───────────────────────────────────────────────────────── */
function StarRating({ rating, count }: { rating: number; count: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-px">
                {[1, 2, 3, 4, 5].map((star) => {
                    const filled = rating >= star;
                    const half = !filled && rating >= star - 0.5;
                    return (
                        <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={filled ? "#C9A84C" : half ? "url(#halfGold)" : "none"}
                            stroke="#C9A84C"
                            strokeWidth="1.5"
                        >
                            {half && (
                                <defs>
                                    <linearGradient id="halfGold">
                                        <stop offset="50%" stopColor="#C9A84C" />
                                        <stop offset="50%" stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                            )}
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    );
                })}
            </div>
            <span className="text-[12px] text-[#999]">({count})</span>
        </div>
    );
}

/* ── Product Card ──────────────────────────────────────────────────────── */
function ProductCard({ product }: { product: Product }) {
    const { isInWishlist, toggle } = useWishlist();
    const { showToast } = useToast();
    const router = useRouter();
    const wishlisted = isInWishlist(product.id);

    function handleToggleWishlist(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        toggle(product.id);
        showToast(
            wishlisted
                ? { type: "wishlist-remove", message: "Removed from Wishlist", subMessage: product.name }
                : { type: "wishlist-add", message: "Added to Wishlist", subMessage: product.name }
        );
    }

    return (
        <div onClick={() => router.push(`/collections/${product.id}`)} className="group rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] cursor-pointer">
            {/* Image Container */}
            <Link
                href={`/collections/${product.id}`}
                className="block relative aspect-[3/4] overflow-hidden bg-[#f5f3ef]"
            >
                <Image
                    src={product.mainImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* NEW badge (top-left) */}
                <span className="absolute top-2 left-2 md:top-3 md:left-3 px-2 md:px-3.5 py-0.5 md:py-1 bg-[#C9A84C] text-white text-[9px] md:text-[10px] font-semibold uppercase tracking-wider rounded-full z-10">
                    New
                </span>

                {/* Wishlist heart (top-right) */}
                <button
                    onClick={handleToggleWishlist}
                    className="absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-200 z-10"
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={wishlisted ? "#e74c3c" : "none"}
                        stroke={wishlisted ? "#e74c3c" : "#C9A84C"}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="md:w-[17px] md:h-[17px]"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </Link>

            {/* Card Body */}
            <div className="p-2.5 md:p-4 flex flex-col gap-1.5 md:gap-2">
                {/* Star Rating */}
                <StarRating rating={product.avgRating} count={product.reviewCount} />

                {/* Product Name */}
                <h3 className="text-[12px] md:text-base text-[#1A1A1A] font-medium leading-snug line-clamp-2">
                    {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-[13px] md:text-[16px] font-bold text-[#C9A84C]">
                        {product.price}
                    </span>
                    {product.priceNum > 0 && (
                        <span className="text-[11px] md:text-[13px] text-[#aaa] line-through">
                            ₹{Math.round(product.priceNum * 1.4)}
                        </span>
                    )}
                </div>

                {/* Buttons */}
                <div className="mt-0.5 md:mt-1">
                    <Link
                        href={`/collections/${product.id}`}
                        className="flex items-center justify-center w-full py-2 md:py-2.5 bg-[#C9A84C] text-white text-[9px] md:text-[11px] font-semibold uppercase tracking-wider rounded-md hover:bg-[#b8963e] transition-colors duration-200 no-underline text-center"
                    >
                        View
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ── Section ───────────────────────────────────────────────────────────── */
export default function ProductCardsSection({ products }: ProductCardsSectionProps) {
    if (!products.length) return null;

    return (
        <section className="w-full bg-[#FAF9F6] py-16 md:py-20">
            <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
                {/* Heading */}
                <div className="text-center mb-10">
                    <p
                        className="text-[10px] uppercase tracking-[0.3em] mb-4"
                        style={{ color: "#c9a84c" }}
                    >
                        Our Bestsellers
                    </p>
                    <h2
                        className="text-[2.4rem] md:text-[3rem] leading-tight mb-3"
                        style={{
                            fontFamily: "var(--font-cormorant), Georgia, serif",
                            color: "#1A1A1A",
                            fontWeight: 400,
                            fontStyle: "italic",
                        }}
                    >
                        Featured Products
                    </h2>
                    <div className="mx-auto mb-4 w-12 h-[2px] bg-[#C9A84C]" />
                    <p
                        className="text-sm max-w-md mx-auto leading-relaxed"
                        style={{
                            fontFamily: "var(--font-cormorant), Georgia, serif",
                            fontStyle: "italic",
                            color: "#6b6b6b",
                        }}
                    >
                        Handpicked pieces loved by our customers — crafted with care, designed to shine.
                    </p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* View All Button */}
                <div className="text-center mt-10">
                    <Link
                        href="/collections"
                        className="inline-block px-8 py-3 text-sm font-medium tracking-wider uppercase border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 no-underline rounded-full"
                    >
                        View All Products
                    </Link>
                </div>
            </div>
        </section>
    );
}
