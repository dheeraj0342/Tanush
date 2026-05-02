"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUploader, ThumbsUploader } from "@/components/admin/ProductImageUpload";

interface Spec {
    label: string;
    value: string;
}

interface ColorVariant {
    name: string;
    hex: string;
    image: string;
    sizes: string[];
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none";
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" };

export default function NewProductPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [priceNum, setPriceNum] = useState("");
    const [mrp, setMrp] = useState("");
    const [category, setCategory] = useState("Bridal");
    const [categoryKey, setCategoryKey] = useState("bridal");
    const [mainImage, setMainImage] = useState("");
    const [thumbs, setThumbs] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [inStock, setInStock] = useState(true);
    const [hsnCode, setHsnCode] = useState("");
    const [gstRate, setGstRate] = useState("0");
    const [sku, setSku] = useState("");
    const [sizes, setSizes] = useState("");
    const [specs, setSpecs] = useState<Spec[]>([{ label: "", value: "" }]);
    const [colors, setColors] = useState<ColorVariant[]>([]);

    const categories = [
        { label: "Bridal", key: "bridal" },
        { label: "Traditional & Ethnic", key: "traditional" },
        { label: "Minimal & Daily", key: "minimal" },
    ];

    const handleCategoryChange = (key: string) => {
        const cat = categories.find((c) => c.key === key);
        if (cat) { setCategoryKey(cat.key); setCategory(cat.label); }
    };

    const addSpec = () => setSpecs((prev) => [...prev, { label: "", value: "" }]);
    const removeSpec = (i: number) => setSpecs((prev) => prev.filter((_, idx) => idx !== i));
    const updateSpec = (i: number, field: "label" | "value", val: string) => {
        setSpecs((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    };

    const addColor = () => setColors((prev) => [...prev, { name: "", hex: "#c9a84c", image: "", sizes: ["Free Size"] }]);
    const removeColor = (i: number) => setColors((prev) => prev.filter((_, idx) => idx !== i));
    const updateColor = (i: number, field: keyof ColorVariant, val: string | string[]) => {
        setColors((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mainImage) { setError("Please upload a main product image."); return; }
        setError("");
        setSaving(true);
        try {
            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, price, priceNum: parseInt(priceNum), mrp: parseInt(mrp) || 0, category, categoryKey,
                    mainImage, thumbs, description,
                    specs: specs.filter((s) => s.label && s.value),
                    colors,
                    sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
                    inStock,
                    hsnCode,
                    gstRate: parseFloat(gstRate) || 0,
                    sku,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Failed to create product");
                return;
            }
            router.push("/admin/products");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <Link href="/admin/products" className="text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-70 mb-6 inline-block" style={{ color: "#c9a84c" }}>
                ← Products
            </Link>
            <h1 className="text-2xl font-bold mb-8" style={{ color: "#fff" }}>Add New Product</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Product Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Gold Tone Bangle Set" className={inputCls} style={inputStyle} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Display Price</label>
                        <input value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="₹599" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Price (₹ numeric)</label>
                        <input type="number" value={priceNum} onChange={(e) => setPriceNum(e.target.value)} required placeholder="599" min="1" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>MRP (₹ strikethrough)</label>
                        <input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="799" min="0" className={inputCls} style={inputStyle} />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Category</label>
                    <select value={categoryKey} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls} style={inputStyle}>
                        {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>HSN Code</label>
                        <input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="e.g. 7117" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>GST Rate (%)</label>
                        <input type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="0" min="0" max="100" step="0.01" className={inputCls} style={inputStyle} />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>SKU (Stock Keeping Unit)</label>
                    <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. TNS-BNG-001" className={inputCls} style={inputStyle} />
                </div>

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Available Sizes (comma-separated)</label>
                    <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. S, M, L, XL or 2.2, 2.4, 2.6, Free Size" className={inputCls} style={inputStyle} />
                    {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {sizes.split(",").map((s) => s.trim()).filter(Boolean).map((s, i) => (
                                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#e2c975" }}>{s}</span>
                            ))}
                        </div>
                    )}
                </div>

                <ImageUploader
                    label="Main Product Image"
                    value={mainImage}
                    onChange={setMainImage}
                    required
                />

                <ThumbsUploader
                    label="Gallery Thumbnails"
                    values={thumbs}
                    onChange={setThumbs}
                />

                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder="Product description..." className={inputCls} style={inputStyle} />
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Specifications</p>
                    {specs.map((spec, i) => (
                        <div key={i} className="flex gap-3 mb-2 items-center">
                            <input value={spec.label} onChange={(e) => updateSpec(i, "label", e.target.value)}
                                placeholder="Label (e.g. Material)" className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} />
                            <input value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)}
                                placeholder="Value (e.g. Gold Plated)" className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} />
                            <button type="button" onClick={() => removeSpec(i)} className="hover:opacity-70 cursor-pointer text-lg leading-none" style={{ color: "#ef5350" }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addSpec} className="text-xs font-semibold mt-1 cursor-pointer hover:opacity-70" style={{ color: "#c9a84c" }}>
                        + Add Spec
                    </button>
                </div>

                {/* Color Variants */}
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Color Variants</p>
                    {colors.map((color, i) => (
                        <div key={i} className="mb-4 p-4 rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full" style={{ background: color.hex, border: "1px solid rgba(255,255,255,0.1)" }} />
                                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{color.name || "Unnamed Color"}</span>
                                </div>
                                <button type="button" onClick={() => removeColor(i)} className="hover:opacity-70 cursor-pointer text-sm" style={{ color: "#ef5350" }}>✕ Remove</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Color Name</label>
                                    <input
                                        value={color.name}
                                        onChange={(e) => updateColor(i, "name", e.target.value)}
                                        placeholder="e.g. Gold, Silver, Rose Gold"
                                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Hex Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={color.hex}
                                            onChange={(e) => updateColor(i, "hex", e.target.value)}
                                            className="w-10 h-10 rounded-xl cursor-pointer"
                                            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                        />
                                        <input
                                            value={color.hex}
                                            onChange={(e) => updateColor(i, "hex", e.target.value)}
                                            placeholder="#c9a84c"
                                            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none font-mono"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Available Sizes (comma-separated)</label>
                                <input
                                    value={color.sizes.join(", ")}
                                    onChange={(e) => updateColor(i, "sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                                    placeholder="e.g. 2.2, 2.4, 2.6, 2.8 or Free Size"
                                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                                    style={inputStyle}
                                />
                                {color.sizes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {color.sizes.map((s, si) => (
                                            <span key={si} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#e2c975" }}>{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <ImageUploader
                                    label="Color Image (optional)"
                                    value={color.image}
                                    onChange={(url) => updateColor(i, "image", url)}
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addColor}
                        className="flex items-center gap-2 text-xs font-semibold mt-1 cursor-pointer hover:opacity-70 px-4 py-2 rounded-xl"
                        style={{ color: "#c9a84c", border: "1px dashed rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.05)" }}
                    >
                        + Add Color Variant
                    </button>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="cursor-pointer w-4 h-4" />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>In Stock</span>
                </label>

                {error && <p className="text-sm" style={{ color: "#ef5350" }}>{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                        className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #c9a84c, #e2c975)", color: "#0c0c0c", boxShadow: "0 4px 15px rgba(201,168,76,0.3)" }}>
                        {saving ? "Saving..." : "Create Product"}
                    </button>
                    <Link href="/admin/products" className="px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
