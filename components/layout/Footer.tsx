"use client";

import Link from "next/link";

const quickLinks = [
    { label: "Customer Reviews", href: "/reviews" },
    { label: "Store Locator", href: "/store-locator" },
    { label: "About Us", href: "/about" },
];

const infoLinks = [
    { label: "Shipping & Returns", href: "/shipping" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "International Shipping", href: "/international-shipping" },
    { label: "FAQs & Support", href: "/faq" },
    { label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
    return (
        <footer className="w-full bg-white border-t border-[#e5e5e5]">
            <div className="w-full max-w-7xl mx-auto px-6 pt-14 pb-8">
                {/* Top grid: 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[15px] font-semibold text-[#1a1a1a] mb-5">
                            Quick links
                        </h4>
                        <ul className="flex flex-col gap-3">
                            {quickLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-[14px] text-[#4a4a4a] hover:text-[#C9A84C] transition-colors duration-200 no-underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Info */}
                    <div>
                        <h4 className="text-[15px] font-semibold text-[#1a1a1a] mb-5">
                            Info
                        </h4>
                        <ul className="flex flex-col gap-3">
                            {infoLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-[14px] text-[#4a4a4a] hover:text-[#C9A84C] transition-colors duration-200 no-underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h4 className="text-[15px] font-semibold text-[#1a1a1a] mb-5">
                            Contact us
                        </h4>
                        <div className="flex flex-col gap-3 text-[14px] text-[#4a4a4a]">
                            <p className="leading-relaxed">
                                For any suggestions, queries or complaints please
                                contact us:
                            </p>
                            <p className="font-medium text-[#1a1a1a]">
                                Sunrise Plaza
                            </p>
                            <p className="leading-relaxed">
                                Sunrise Plaza,
                                <br />
                                Sadar Bazar, Firozabad,
                                <br />
                                Uttar Pradesh — 283203
                            </p>
                            <ul className="flex flex-col gap-2 mt-1">
                                <li className="flex items-center gap-2">
                                    <span className="text-[#6b6b6b]">-</span>
                                    <span>7252866387 (10 AM to 6:30 PM)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#6b6b6b]">-</span>
                                    <Link
                                        href="/contact"
                                        className="text-[#1a1a1a] underline underline-offset-2 hover:text-[#C9A84C] transition-colors"
                                    >
                                        Chat with us
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom section: Newsletter left + Social icons right */}
                <div className="border-t border-[#e5e5e5] pt-10 pb-4 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                    {/* Left: Join the Inner Circle */}
                    <div className="flex flex-col items-start">
                        <div className="w-9 h-9 rounded-full border border-[#C9A84C] flex items-center justify-center mb-3">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#C9A84C" strokeWidth={1.6}>
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinejoin="round" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <h3 className="font-cormorant text-[1.8rem] md:text-[2.2rem] text-[#1A1A1A] leading-tight mb-1">
                            Join the Inner Circle
                        </h3>
                        <p className="text-sm text-[#6b6b6b] leading-relaxed mb-4 max-w-xs">
                            Subscribe to receive updates, access to exclusive deals, and more.
                        </p>
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="email"
                                placeholder="Your email address"
                                required
                                className="px-5 py-2.5 text-sm border border-[#e8e3db] rounded-full outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 text-[#1A1A1A] placeholder:text-[#bbb] transition-all w-[220px]"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2.5 text-sm font-medium text-white bg-[#C9A84C] rounded-full hover:bg-[#b8963e] transition-colors whitespace-nowrap"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>

                    {/* Right: Social icons */}
                    <div className="flex items-center gap-5">
                        {/* Facebook */}
                        <Link href="https://www.facebook.com/profile.php?id=61568064050281" target="_blank" rel="noopener noreferrer" className="text-[#4a4a4a] hover:text-[#C9A84C] transition-colors" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                        </Link>
                        {/* Instagram */}
                        <Link href="https://www.instagram.com/tanush.india/" target="_blank" rel="noopener noreferrer" className="text-[#4a4a4a] hover:text-[#C9A84C] transition-colors" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                        </Link>
                        {/* LinkedIn */}
                        <Link href="https://www.linkedin.com/company/tanush-india-private-limited/about/" target="_blank" rel="noopener noreferrer" className="text-[#4a4a4a] hover:text-[#C9A84C] transition-colors" aria-label="LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-6 text-center">
                    <p className="text-xs text-[#9e9e9e]">
                        © 2026 Tanush. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}
