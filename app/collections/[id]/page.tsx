"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/lib/cartContext";
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
    mrp: number;
    category: string;
    categoryKey: string;
    mainImage: string;
    thumbs: string[];
    description: string;
    specs: { label: string; value: string }[];
    inStock: boolean;
    colors: ColorVariant[];
    sku: string;
    gstRate: number;
    avgRating?: number;
    reviewCount?: number;
}

interface Review {
    id: string;
    rating: number;
    title: string | null;
    body: string;
    imageUrl: string | null;
    createdAt: string;
    user: { name: string };
}

const defaultSizes = ["2.2", "2.4", "2.6", "2.8"];

function Stars({ rating, size = 14, interactive = false, onSelect }: {
    rating: number; size?: number; interactive?: boolean; onSelect?: (r: number) => void;
}) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    width={size} height={size}
                    viewBox="0 0 24 24"
                    fill={(interactive ? (star <= (hovered || rating)) : star <= Math.round(rating)) ? "#c9a84c" : "none"}
                    stroke="#c9a84c" strokeWidth={1.5}
                    className={interactive ? "cursor-pointer" : ""}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    onClick={() => interactive && onSelect?.(star)}
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </div>
    );
}

export default function ProductDetailPage() {
    const params = useParams();
    const id = Number(params.id);
    const { data: session } = useSession();
    const { addItem } = useCart();
    const { isInWishlist, toggle: toggleWishlist } = useWishlist();
    const { showToast } = useToast();
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [related, setRelated] = useState<Product[]>([]);
    const [productLoading, setProductLoading] = useState(true);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);

    const [activeImage, setActiveImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState("2.4");
    const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [careOpen, setCareOpen] = useState(false);
    const [added, setAdded] = useState(false);

    // Review form
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState("");
    const [reviewBody, setReviewBody] = useState("");
    const [reviewImage, setReviewImage] = useState<File | null>(null);
    const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState(false);

    // Fetch product
    useEffect(() => {
        setProductLoading(true);
        fetch(`/api/products/${id}`)
            .then(async (r) => {
                if (!r.ok) { setProductLoading(false); return; }
                const data = await r.json();
                setProduct(data);
                // Fetch related products
                const relRes = await fetch(`/api/products?category=${data.categoryKey}`);
                if (relRes.ok) {
                    const relData = await relRes.json();
                    setRelated(Array.isArray(relData) ? relData.filter((p: Product) => p.id !== id).slice(0, 4) : []);
                }
                setProductLoading(false);
            })
            .catch(() => setProductLoading(false));
    }, [id]);

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        try {
            const res = await fetch(`/api/reviews/${id}`);
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } finally {
            setReviewsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    useEffect(() => {
        if (!session?.user?.id) { setCanReview(false); return; }
        fetch(`/api/reviews/can-review/${id}`)
            .then((r) => r.json())
            .then((d) => setCanReview(d.canReview ?? false))
            .catch(() => setCanReview(false));
    }, [id, session?.user?.id]);

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const ratingBars = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        return { stars: star, count, pct: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0 };
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReviewImage(file);
        setReviewImagePreview(URL.createObjectURL(file));
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { router.push("/sign-in"); return; }
        setReviewError("");
        setSubmittingReview(true);

        try {
            let imageUrl: string | null = null;

            // Upload image if provided
            if (reviewImage) {
                const formData = new FormData();
                formData.append("file", reviewImage);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                }
            }

            const res = await fetch(`/api/reviews/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating: reviewRating,
                    title: reviewTitle.trim() || null,
                    body: reviewBody.trim(),
                    imageUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setReviewError(data.error ?? "Failed to submit review");
                return;
            }

            setReviewSuccess(true);
            setReviewTitle("");
            setReviewBody("");
            setReviewImage(null);
            setReviewImagePreview(null);
            setReviewRating(5);
            setShowReviewForm(false);
            showToast({ type: "review", message: "Review Submitted!", subMessage: "Thank you for your feedback" });
            fetchReviews();
        } finally {
            setSubmittingReview(false);
        }
    };

    if (productLoading) {
        return (
            <div className="flex flex-col min-h-screen" style={{ background: "#faf9f6" }}>
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#e0d5c5", borderTopColor: "#c9a84c" }} />
                </div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center py-20">
                        <p className="text-2xl font-semibold mb-4" style={{ color: "#1a1a1a" }}>Product not found</p>
                        <Link href="/collections" className="text-sm underline" style={{ color: "#c9a84c" }}>← Back to Collections</Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const originalPrice = product.mrp > 0 && product.mrp > product.priceNum ? product.mrp : null;
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const selectedColor = selectedColorIndex !== null ? colors[selectedColorIndex] ?? null : null;
    const activeColorImage = selectedColor?.image || "";
    const activeThumb = activeColorImage || (product.thumbs[activeImage] ?? product.mainImage);
    const activeSizes = selectedColor ? selectedColor.sizes : (colors.length > 0 ? colors[0].sizes : defaultSizes);
    const inWishlist = isInWishlist(product.id);

    return (
        <div className="flex flex-col min-h-screen" style={{ background: "#faf9f6" }}>
            <Navbar />
            <main className="flex-1 w-full">
                {/* Breadcrumb */}
                <div className="w-full max-w-7xl mx-auto px-6 md:px-10 pt-5 pb-2">
                    <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: "#999" }}>
                        <Link href="/" className="hover:text-[#c9a84c] transition-colors">Home</Link>
                        <span>›</span>
                        <Link href="/collections" className="hover:text-[#c9a84c] transition-colors">Collections</Link>
                        <span>›</span>
                        <span style={{ color: "#c9a84c" }}>{product.name}</span>
                    </nav>
                </div>

                {/* Product Section */}
                <section className="w-full max-w-7xl mx-auto px-6 md:px-10 pt-4 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

                        {/* Gallery */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="hidden md:flex flex-col gap-3" style={{ width: 64 }}>
                                {product.thumbs.map((src, i) => (
                                    <button key={i} onClick={() => { setActiveImage(i); setSelectedColorIndex(null); }}
                                        className="relative rounded-md overflow-hidden transition-all duration-200 cursor-pointer"
                                        style={{ width: 64, height: 64, border: activeImage === i && !selectedColor ? "2px solid #c9a84c" : "1px solid #e0d5c5", background: "#f5ede0" }}>
                                        <Image src={src} alt={`View ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="64px" />
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 relative rounded-xl overflow-hidden" style={{ background: "#f0e8d8", aspectRatio: "4/5" }}>
                                {!product.inStock && (
                                    <div className="absolute top-4 right-4 z-10 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md" style={{ background: "#888", color: "#fff" }}>
                                        Sold Out
                                    </div>
                                )}
                                <Image src={activeThumb} alt={product.name} fill style={{ objectFit: "contain" }} sizes="(max-width: 1024px) 100vw, 50vw" priority />
                            </div>

                            {/* Mobile thumbnails */}
                            <div className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                {product.thumbs.map((src, i) => (
                                    <button key={i} onClick={() => { setActiveImage(i); setSelectedColorIndex(null); }}
                                        className="relative rounded-md overflow-hidden transition-all duration-200 cursor-pointer flex-shrink-0"
                                        style={{ width: 72, height: 72, border: activeImage === i && !selectedColor ? "2px solid #c9a84c" : "1px solid #e0d5c5", background: "#f5ede0" }}>
                                        <Image src={src} alt={`View ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="72px" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col pt-2">
                            <h1 className="text-3xl md:text-[2.5rem] mb-3 leading-tight"
                                style={{ fontFamily: "var(--font-cormorant), Georgia, serif", color: "#1a1a1a", fontWeight: 500, fontStyle: "italic" }}>
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-3">
                                <span className="text-xl font-bold" style={{ color: "#c9a84c" }}>{product.price}</span>
                                {originalPrice && (
                                    <span className="text-sm line-through" style={{ color: "#aaa" }}>₹{originalPrice.toLocaleString("en-IN")}</span>
                                )}
                                {reviews.length > 0 && (
                                    <div className="flex items-center gap-2 ml-2">
                                        <Stars rating={avgRating} size={12} />
                                        <Link href="#reviews" className="text-[11px] underline" style={{ color: "#c9a84c" }}>
                                            {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm mb-4" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", color: "#888" }}>
                                &ldquo;Grace in every circle.&rdquo;
                            </p>
                            <p className="text-[13px] leading-relaxed mb-7" style={{ color: "#555" }}>{product.description}</p>

                            {/* Color variant selector */}
                            {colors.length > 0 && (
                                <div className="mb-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#1a1a1a" }}>Color</span>
                                        {selectedColor && (
                                            <span className="text-[10px] font-semibold" style={{ color: "#c9a84c" }}>{selectedColor.name}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {colors.map((c, ci) => (
                                            <button
                                                key={ci}
                                                onClick={() => {
                                                    setSelectedColorIndex(ci === selectedColorIndex ? null : ci);
                                                    // Reset size when color changes
                                                    setSelectedSize(c.sizes[0] ?? "");
                                                }}
                                                title={c.name}
                                                className="relative rounded-full transition-all cursor-pointer"
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    background: c.hex,
                                                    border: selectedColorIndex === ci ? "3px solid #c9a84c" : "2px solid #e0d5c5",
                                                    boxShadow: selectedColorIndex === ci ? "0 0 0 2px #fffbf2, 0 0 0 4px #c9a84c" : "none",
                                                    outline: "none",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size selector */}
                            <div className="mb-7">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#1a1a1a" }}>Select Size</span>
                                    <button className="text-[10px] font-semibold underline decoration-dotted" style={{ color: "#c9a84c" }}>Size Guide</button>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {activeSizes.map((s) => (
                                        <button key={s} onClick={() => setSelectedSize(s)}
                                            className="flex-1 py-3 rounded-md text-sm font-semibold transition-all cursor-pointer"
                                            style={{ border: selectedSize === s ? "2px solid #c9a84c" : "1px solid #e0d5c5", background: selectedSize === s ? "#fffbf2" : "#fff", color: selectedSize === s ? "#c9a84c" : "#555", minWidth: 56 }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <button
                                onClick={() => {
                                    addItem({ id: product.id, name: product.name, price: product.price, priceNum: product.priceNum, image: product.mainImage, subtitle: product.category, size: selectedSize || undefined, color: selectedColor?.name || undefined, sku: product.sku || undefined, gstRate: product.gstRate ?? 0 });
                                    showToast({ type: "cart", message: "Added to Bag", subMessage: product.name });
                                    setAdded(true);
                                    setTimeout(() => router.push("/cart"), 800);
                                }}
                                disabled={!product.inStock}
                                className="w-full py-4 rounded-md text-white text-[13px] font-bold tracking-[0.18em] uppercase flex items-center justify-center gap-2 mb-3 transition-all duration-200 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: added ? "#5a8a5a" : "#c9a84c" }}>
                                {!product.inStock ? "Out of Stock" : added ? "✓ Added! Redirecting..." : (
                                    <>Add to Bag <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg></>
                                )}
                            </button>

                            {/* Wishlist */}
                            <button
                                onClick={() => {
                                    toggleWishlist(product.id);
                                    showToast(
                                        inWishlist
                                            ? { type: "wishlist-remove", message: "Removed from Wishlist", subMessage: product.name }
                                            : { type: "wishlist-add", message: "Added to Wishlist", subMessage: product.name }
                                    );
                                }}
                                className="w-full py-3.5 rounded-md text-[13px] font-bold tracking-[0.18em] uppercase mb-6 transition-all duration-200 cursor-pointer"
                                style={{ background: "#fff", border: `1px solid ${inWishlist ? "#c0392b" : "#e0d5c5"}`, color: inWishlist ? "#c0392b" : "#555" }}>
                                {inWishlist ? "♥ Added to Wishlist" : "Add to Wishlist"}
                            </button>



                            {/* Product Details accordion */}
                            <div style={{ borderTop: "1px solid #e8e3db" }}>
                                <button className="w-full flex items-center justify-between py-5 text-left cursor-pointer" onClick={() => setDetailsOpen(!detailsOpen)}>
                                    <span style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", color: "#1a1a1a", fontSize: 16 }}>Product Details</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth={2} style={{ transition: "transform 0.2s", transform: detailsOpen ? "rotate(180deg)" : "rotate(0)" }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {detailsOpen && (
                                    <div className="pb-5">
                                        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e8e3db" }}>
                                            {product.specs.map((spec, i) => (
                                                <div key={i} className="flex justify-between px-4 py-2.5 text-sm"
                                                    style={{ background: i % 2 === 0 ? "#fff" : "#faf9f6", borderBottom: i < product.specs.length - 1 ? "1px solid #f0e6d0" : "none" }}>
                                                    <span style={{ color: "#888" }}>{spec.label}</span>
                                                    <span style={{ color: "#1a1a1a", fontWeight: 600 }}>{spec.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Material & Care accordion */}
                            <div style={{ borderTop: "1px solid #e8e3db" }}>
                                <button className="w-full flex items-center justify-between py-5 text-left cursor-pointer" onClick={() => setCareOpen(!careOpen)}>
                                    <span style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", color: "#1a1a1a", fontSize: 16 }}>Material & Care</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth={2} style={{ transition: "transform 0.2s", transform: careOpen ? "rotate(180deg)" : "rotate(0)" }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {careOpen && (
                                    <div className="pb-5">
                                        <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                                            Store in the provided velvet pouch away from moisture and perfumes. Clean gently with a soft dry cloth. Avoid contact with chemicals, lotions, and water. We offer a 30-day hassle-free return policy.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div style={{ borderTop: "1px solid #e8e3db" }} />
                        </div>
                    </div>
                </section>

                {/* ═══ REVIEWS ═══ */}
                <section id="reviews" className="w-full" style={{ borderTop: "6px solid #f0ece4", background: "#fff" }}>
                    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                            <div>
                                <h2 className="text-3xl md:text-4xl mb-6"
                                    style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", color: "#1a1a1a", fontWeight: 400 }}>
                                    Guest Reviews
                                </h2>
                                {reviews.length > 0 && (
                                    <div className="flex items-start gap-6">
                                        <div>
                                            <span className="text-4xl font-bold block" style={{ color: "#c9a84c", fontFamily: "var(--font-cormorant), serif" }}>
                                                {avgRating.toFixed(1)}
                                            </span>
                                            <Stars rating={avgRating} size={13} />
                                            <p className="text-[10px] uppercase tracking-[0.12em] mt-1" style={{ color: "#999" }}>
                                                Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                                            {ratingBars.map((bar) => (
                                                <div key={bar.stars} className="flex items-center gap-2">
                                                    <span className="text-[10px] font-semibold w-3 text-right" style={{ color: "#888" }}>{bar.stars}</span>
                                                    <div className="flex-1 h-2 rounded-full" style={{ background: "#f0ece4" }}>
                                                        <div className="h-full rounded-full" style={{ width: `${bar.pct}%`, background: "#c9a84c" }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {reviews.length === 0 && !reviewsLoading && (
                                    <p className="text-sm" style={{ color: "#aaa", fontStyle: "italic" }}>No reviews yet. Be the first to review this product!</p>
                                )}
                            </div>

                            {canReview && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="self-start px-6 py-3 rounded-md text-[11px] font-bold uppercase tracking-[0.15em] transition-all hover:opacity-85 cursor-pointer"
                                    style={{ border: "2px solid #c9a84c", color: "#c9a84c", background: "transparent" }}>
                                    Write a Review
                                </button>
                            )}
                        </div>

                        {/* Review Form */}
                        {showReviewForm && (
                            <div className="mb-10 rounded-xl p-6" style={{ border: "1px solid #e0d5c5", background: "#fffbf2" }}>
                                <h3 className="font-bold text-sm uppercase tracking-widest mb-5" style={{ color: "#1a1a1a" }}>Write Your Review</h3>
                                {reviewSuccess && (
                                    <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                                        Thank you! Your review has been submitted.
                                    </div>
                                )}
                                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#888" }}>Your Rating *</label>
                                        <Stars rating={reviewRating} size={28} interactive onSelect={setReviewRating} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>Review Title</label>
                                        <input value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)}
                                            placeholder="e.g. Simply Beautiful" className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                                            style={{ border: "1px solid #e0d5c5", background: "#fff" }} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>Your Review *</label>
                                        <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} required rows={4}
                                            minLength={10} maxLength={1000}
                                            placeholder="Share your experience with this product (min. 10 characters)..."
                                            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                                            style={{ border: "1px solid #e0d5c5", background: "#fff" }} />
                                        <p className="text-[10px] mt-1" style={{ color: reviewBody.length > 900 ? "#e74c3c" : "#aaa" }}>
                                            {reviewBody.length}/1000
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>Upload Photo (optional)</label>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
                                        {reviewImagePreview && (
                                            <div className="mt-2 relative inline-block">
                                                <Image src={reviewImagePreview} alt="Preview" width={80} height={80} className="rounded-lg object-cover" />
                                                <button type="button" onClick={() => { setReviewImage(null); setReviewImagePreview(null); }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center cursor-pointer"
                                                    style={{ background: "#e74c3c" }}>✕</button>
                                            </div>
                                        )}
                                    </div>
                                    {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                                    <div className="flex gap-3">
                                        <button type="submit" disabled={submittingReview}
                                            className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                                            style={{ background: "#c9a84c" }}>
                                            {submittingReview ? "Submitting..." : "Submit Review"}
                                        </button>
                                        <button type="button" onClick={() => setShowReviewForm(false)}
                                            className="px-6 py-3 rounded-lg text-sm font-semibold hover:opacity-70 cursor-pointer" style={{ color: "#888" }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Review cards */}
                        {reviewsLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#e0d5c5", borderTopColor: "#c9a84c" }} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {reviews.map((review) => (
                                    <div key={review.id} className="rounded-lg p-5 flex flex-col transition-all hover:shadow-md"
                                        style={{ border: "1px solid #e8e3db", background: "#faf9f6" }}>
                                        <div className="flex items-center justify-between mb-3">
                                            <Stars rating={review.rating} size={12} />
                                            <span className="text-[10px] uppercase tracking-wider" style={{ color: "#aaa" }}>
                                                {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>
                                        {review.imageUrl && (
                                            <div className="relative rounded-lg overflow-hidden mb-3" style={{ height: 120 }}>
                                                <Image src={review.imageUrl} alt="Review photo" fill style={{ objectFit: "cover" }} sizes="300px" />
                                            </div>
                                        )}
                                        {review.title && (
                                            <h4 className="text-[15px] font-semibold mb-2"
                                                style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", color: "#1a1a1a" }}>
                                                {review.title}
                                            </h4>
                                        )}
                                        <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: "#6b6b6b" }}>{review.body}</p>
                                        <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid #f0e6d0" }}>
                                            <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "#1a1a1a" }}>
                                                {review.user.name}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#c9a84c" }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#c9a84c"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8z" /></svg>
                                                Verified Buyer
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Related Products */}
                {related.length > 0 && (
                    <section className="w-full max-w-7xl mx-auto px-6 md:px-10 py-14">
                        <h2 className="text-2xl md:text-3xl mb-8 text-center"
                            style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", color: "#1a1a1a" }}>
                            You May Also Like
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {related.map((p) => (
                                <Link key={p.id} href={`/collections/${p.id}`} className="group">
                                    <div className="rounded-xl overflow-hidden aspect-square relative mb-3" style={{ background: "#f5ede0" }}>
                                        <Image src={p.mainImage} alt={p.name} fill style={{ objectFit: "cover" }} className="group-hover:scale-105 transition-transform duration-500" sizes="300px" />
                                    </div>
                                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#999" }}>{p.category}</p>
                                    <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{p.name}</p>
                                    {(p.reviewCount ?? 0) > 0 && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Stars rating={p.avgRating ?? 0} size={11} />
                                            <span className="text-[10px]" style={{ color: "#aaa" }}>({p.reviewCount})</span>
                                        </div>
                                    )}
                                    <p className="text-sm font-bold mt-1" style={{ color: "#c9a84c" }}>{p.price}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </div>
    );
}
