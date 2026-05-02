import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PosterBanner from "@/components/sections/PosterBanner";
import HeroSection from "@/components/sections/HeroSection";
import CollectionsSection from "@/components/sections/CollectionsSection";
import ProductCardsSection from "@/components/sections/ProductCardsSection";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      priceNum: true,
      mrp: true,
      category: true,
      mainImage: true,
      gstRate: true,
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: { id: "asc" },
  });

  // Compute average rating & review count for each product
  const productsWithRatings = products.map((p) => {
    const count = p.reviews.length;
    const avg = count > 0
      ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      priceNum: p.priceNum,
      mrp: p.mrp,
      category: p.category,
      mainImage: p.mainImage,
      gstRate: p.gstRate,
      avgRating: Math.round(avg * 10) / 10,
      reviewCount: count,
    };
  });

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <PosterBanner />
      <main className="flex-1 w-full">
        <HeroSection />
        <CollectionsSection />
        <ProductCardsSection products={productsWithRatings} />
      </main>
      <Footer />
    </div>
  );
}
