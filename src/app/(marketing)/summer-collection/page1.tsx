"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./summer.css";

// This is a direct translation of the provided HTML to React/Next.js
export default function SummerCollectionPage() {
    const [activeCategory, setActiveCategory] = useState("All Items");

    // Using simple state to toggle "active" class exactly like the Vanilla JS did
    const [filters, setFilters] = useState<Record<string, boolean>>({
        Men: true,
        "Western Wear": true,
        "Green Hermitage": true,
        OCAU: true,
        "50% and above": true,
    });

    const toggleFilter = (name: string) => {
        setFilters((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const isFilterActive = (name: string) => !!filters[name];

    const categoryTabs = [
        "All Items",
        "Gifts",
        "Stationery",
        "Organisers",
        "Cups & Mugs",
        "Fashion Jewellery",
        "Aromas & Candles",
    ];

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        // Just setting up the initial document title roughly
        document.title = "RENIVET — Summer Edit";
    }, []);

    return (
        <div className="summer-page-wrapper">
            {/* Ticker */}
            <div className="ticker">
                <div className="ticker-inner">
                    <div className="ticker-item">
                        <span>Free Shipping Above ₹999</span>
                        <div className="ticker-dot"></div>
                        <span>Summer Edit Now Live</span>
                        <div className="ticker-dot"></div>
                        <span>Up to 67% Off on Greensole</span>
                        <div className="ticker-dot"></div>
                        <span>120+ Sustainable Brands</span>
                        <div className="ticker-dot"></div>
                        <span>Eco-Friendly Packaging</span>
                        <div className="ticker-dot"></div>
                        <span>New Arrivals Daily</span>
                        <div className="ticker-dot"></div>
                    </div>
                    <div className="ticker-item" aria-hidden="true">
                        <span>Free Shipping Above ₹999</span>
                        <div className="ticker-dot"></div>
                        <span>Summer Edit Now Live</span>
                        <div className="ticker-dot"></div>
                        <span>Up to 67% Off on Greensole</span>
                        <div className="ticker-dot"></div>
                        <span>120+ Sustainable Brands</span>
                        <div className="ticker-dot"></div>
                        <span>Eco-Friendly Packaging</span>
                        <div className="ticker-dot"></div>
                        <span>New Arrivals Daily</span>
                        <div className="ticker-dot"></div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="summer-nav">
                <Link href="/" className="logo">
                    <div className="logo-box">R</div>
                    Renivet
                </Link>
                <ul className="nav-menu">
                    <li>
                        <Link href="#">Men</Link>
                    </li>
                    <li>
                        <Link href="#">Women</Link>
                    </li>
                    <li>
                        <Link href="#">Kids</Link>
                    </li>
                    <li>
                        <Link href="#">Home &amp; Living</Link>
                    </li>
                    <li>
                        <Link href="#">Beauty &amp; Care</Link>
                    </li>
                </ul>
                <div className="nav-right">
                    <div className="search-pill">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        Search products &amp; brands…
                    </div>
                    <div className="icon-btn">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div className="icon-btn">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <div className="badge">12</div>
                    </div>
                    <div className="icon-btn">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        >
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <div className="badge">8</div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="hero">
                <div className="hero-left">
                    <div className="hero-eyebrow">
                        🌸 Summer Collection · 2026
                    </div>
                    <div className="hero-title">
                        The <em>Summer</em>
                        <br />
                        Edit is Here
                    </div>
                    <div className="hero-subtitle">
                        Sustainable fashion made for warm, golden days.
                    </div>
                    <div className="hero-cta-row">
                        <button className="btn-primary">Shop the Edit</button>
                        <button className="btn-ghost">View Lookbook</button>
                    </div>
                </div>
                <div className="hero-right">
                    <div className="h-stat">
                        <div className="h-stat-num">
                            67<span>%</span>
                        </div>
                        <div className="h-stat-label">Max Discount</div>
                    </div>
                    <div className="h-stat">
                        <div className="h-stat-num">
                            120<span>+</span>
                        </div>
                        <div className="h-stat-label">Brands</div>
                    </div>
                    <div className="h-stat">
                        <div className="h-stat-num">₹999</div>
                        <div className="h-stat-label">Starts At</div>
                    </div>
                    <div className="h-stat">
                        <div className="h-stat-num">
                            2<span>k+</span>
                        </div>
                        <div className="h-stat-label">Products</div>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <div className="layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="filter-top">
                        <span className="filter-heading">Filters</span>
                        <button
                            className="reset-all"
                            onClick={() => setFilters({})}
                        >
                            ↺ Reset All
                        </button>
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Category</div>
                        <div
                            className={`f-item ${isFilterActive("Beauty & Personal Care") ? "active" : ""}`}
                            onClick={() =>
                                toggleFilter("Beauty & Personal Care")
                            }
                        >
                            <div className="f-radio"></div>Beauty &amp; Personal
                            Care
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Home and Living") ? "active" : ""}`}
                            onClick={() => toggleFilter("Home and Living")}
                        >
                            <div className="f-radio"></div>Home and Living
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Kids") ? "active" : ""}`}
                            onClick={() => toggleFilter("Kids")}
                        >
                            <div className="f-radio"></div>Kids
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Women") ? "active" : ""}`}
                            onClick={() => toggleFilter("Women")}
                        >
                            <div className="f-radio"></div>Women
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Men") ? "active" : ""}`}
                            onClick={() => toggleFilter("Men")}
                        >
                            <div className="f-radio"></div>Men
                        </div>
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Subcategory</div>
                        <div
                            className={`f-item ${isFilterActive("Skincare Bath and Body") ? "active" : ""}`}
                            onClick={() =>
                                toggleFilter("Skincare Bath and Body")
                            }
                        >
                            <div className="f-check"></div>Skincare Bath and
                            Body
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Home Decor") ? "active" : ""}`}
                            onClick={() => toggleFilter("Home Decor")}
                        >
                            <div className="f-check"></div>Home Decor
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Infants") ? "active" : ""}`}
                            onClick={() => toggleFilter("Infants")}
                        >
                            <div className="f-check"></div>Infants
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Western Wear") ? "active" : ""}`}
                            onClick={() => toggleFilter("Western Wear")}
                        >
                            <div className="f-check"></div>Western Wear
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Topwear") ? "active" : ""}`}
                            onClick={() => toggleFilter("Topwear")}
                        >
                            <div className="f-check"></div>Topwear
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Wellness and Hygiene") ? "active" : ""}`}
                            onClick={() => toggleFilter("Wellness and Hygiene")}
                        >
                            <div className="f-check"></div>Wellness and Hygiene
                        </div>
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Brands</div>
                        <div
                            className={`f-item ${isFilterActive("ONEARTH") ? "active" : ""}`}
                            onClick={() => toggleFilter("ONEARTH")}
                        >
                            <div className="f-check"></div>ONEARTH
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Masilo") ? "active" : ""}`}
                            onClick={() => toggleFilter("Masilo")}
                        >
                            <div className="f-check"></div>Masilo
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Nanhey") ? "active" : ""}`}
                            onClick={() => toggleFilter("Nanhey")}
                        >
                            <div className="f-check"></div>Nanhey
                        </div>
                        <div
                            className={`f-item ${isFilterActive("BAMBOOLOGY") ? "active" : ""}`}
                            onClick={() => toggleFilter("BAMBOOLOGY")}
                        >
                            <div className="f-check"></div>BAMBOOLOGY
                        </div>
                        <div
                            className={`f-item ${isFilterActive("ITIDOR") ? "active" : ""}`}
                            onClick={() => toggleFilter("ITIDOR")}
                        >
                            <div className="f-check"></div>ITIDOR
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Green Hermitage") ? "active" : ""}`}
                            onClick={() => toggleFilter("Green Hermitage")}
                        >
                            <div className="f-check"></div>Green Hermitage
                        </div>
                        <div
                            className={`f-item ${isFilterActive("OCAU") ? "active" : ""}`}
                            onClick={() => toggleFilter("OCAU")}
                        >
                            <div className="f-check"></div>OCAU
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Merald curio") ? "active" : ""}`}
                            onClick={() => toggleFilter("Merald curio")}
                        >
                            <div className="f-check"></div>Merald curio
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Rasa Home") ? "active" : ""}`}
                            onClick={() => toggleFilter("Rasa Home")}
                        >
                            <div className="f-check"></div>Rasa Home
                        </div>
                        <div
                            className={`f-item ${isFilterActive("Anushe Pirani") ? "active" : ""}`}
                            onClick={() => toggleFilter("Anushe Pirani")}
                        >
                            <div className="f-check"></div>Anushe Pirani
                        </div>
                        <span className="view-more">View More +</span>
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Price</div>
                        <div className="price-slider">
                            <div className="price-fill"></div>
                            <div className="price-thumb"></div>
                        </div>
                        <div className="price-vals">
                            <span>₹0</span>
                            <span>₹10,00,000+</span>
                        </div>
                    </div>

                    <div className="f-group">
                        <div className="f-group-title">Discount</div>
                        <div
                            className={`f-item ${isFilterActive("10% and above") ? "active" : ""}`}
                            onClick={() => toggleFilter("10% and above")}
                        >
                            <div className="f-check"></div>10% and above
                        </div>
                        <div
                            className={`f-item ${isFilterActive("20% and above") ? "active" : ""}`}
                            onClick={() => toggleFilter("20% and above")}
                        >
                            <div className="f-check"></div>20% and above
                        </div>
                        <div
                            className={`f-item ${isFilterActive("30% and above") ? "active" : ""}`}
                            onClick={() => toggleFilter("30% and above")}
                        >
                            <div className="f-check"></div>30% and above
                        </div>
                        <div
                            className={`f-item ${isFilterActive("50% and above") ? "active" : ""}`}
                            onClick={() => toggleFilter("50% and above")}
                        >
                            <div className="f-check"></div>50% and above
                        </div>
                        <div
                            className={`f-item ${isFilterActive("70% and above") ? "active" : ""}`}
                            onClick={() => toggleFilter("70% and above")}
                        >
                            <div className="f-check"></div>70% and above
                        </div>
                    </div>
                </aside>

                {/* Main */}
                <main className="main">
                    <div className="cat-strip">
                        {categoryTabs.map((tab) => (
                            <button
                                key={tab}
                                className={`cat-pill ${activeCategory === tab ? "on" : ""}`}
                                onClick={() => setActiveCategory(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                        <button className="show-more-pill">Show More</button>
                    </div>

                    <div className="toolbar">
                        <div className="result-info">
                            Showing <strong>248 products</strong> in Summer Edit
                        </div>
                        <select className="sort-sel">
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Newest First</option>
                            <option>Highest Discount</option>
                        </select>
                    </div>

                    {/* Pastel Summer Banner */}
                    <div className="summer-inline">
                        <div className="si-left">
                            <h3>Sustainable Footwear for Warm Days</h3>
                            <p>
                                Eco-crafted shoes by Greensole — made from
                                recycled materials
                            </p>
                            <div className="si-tags">
                                <span className="si-tag t1">Recycled</span>
                                <span className="si-tag t2">Vegan</span>
                                <span className="si-tag t3">Up to 67% off</span>
                            </div>
                        </div>
                        <button className="si-btn">Explore →</button>
                    </div>

                    {/* Grid */}
                    <div className="grid">
                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"
                                    alt="California 2.0"
                                />
                                <div className="tag tag-off">67% Off</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Unisex Shoes | California 2.0
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹999</span>
                                    <span className="price-was">₹2,995</span>
                                    <span className="price-off">67% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#2E2E2E" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#E8C89A" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#85C9A8" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80"
                                    alt="Speedy 2.0"
                                />
                                <div className="tag tag-off">67% Off</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Women&apos;s Shoes | Speedy 2.0
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹999</span>
                                    <span className="price-was">₹2,995</span>
                                    <span className="price-off">67% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#F2B8C0" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#F4A67A" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80"
                                    alt="Blue Lagoon"
                                />
                                <div className="tag tag-eco">Eco Pick</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Women&apos;s Shoe Slip-on | Blue Lagoon
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹3,495</span>
                                    <span className="price-was">₹4,195</span>
                                    <span className="price-off">17% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#A8CDE8" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#85C9A8" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80"
                                    alt="Tropical 2.0"
                                />
                                <div className="tag tag-off">67% Off</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Unisex Shoes | Tropical 2.0
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹999</span>
                                    <span className="price-was">₹2,995</span>
                                    <span className="price-off">67% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#B5A7D4" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#85C9A8" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&q=80"
                                    alt="Mango Tango"
                                />
                                <div className="tag tag-new">New</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Unisex Shoes | Mango Tango 2.0
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹999</span>
                                    <span className="price-was">₹2,995</span>
                                    <span className="price-off">67% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#F7DFA0" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#F4A67A" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=500&q=80"
                                    alt="Speedy Mint"
                                />
                                <div className="tag tag-eco">Eco Pick</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Women&apos;s Shoes | Speedy Mint 2.0
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹999</span>
                                    <span className="price-was">₹2,995</span>
                                    <span className="price-off">67% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#85C9A8" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#A8CDE8" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=500&q=80"
                                    alt="Caramel Breeze"
                                />
                                <div className="tag tag-off">25% Off</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Women&apos;s Shoes | Caramel Breeze
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹2,246</span>
                                    <span className="price-was">₹2,995</span>
                                    <span className="price-off">25% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#F2B8C0" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#F7DFA0" }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-img">
                                <img
                                    src="https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&q=80"
                                    alt="Onyx Slides"
                                />
                                <div className="tag tag-new">New</div>
                                <div className="wish">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#C0607A"
                                        strokeWidth="2"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div className="quick">Quick Add</div>
                            </div>
                            <div className="dots">
                                <div className="dot on"></div>
                                <div className="dot"></div>
                            </div>
                            <div className="card-info">
                                <div className="brand-name">Greensole</div>
                                <div className="prod-name">
                                    Unisex Slides | Onyx Edition
                                </div>
                                <div className="pricing">
                                    <span className="price-now">₹1,197</span>
                                    <span className="price-was">₹1,995</span>
                                    <span className="price-off">40% off</span>
                                </div>
                                <div className="swatches">
                                    <div
                                        className="swatch"
                                        style={{ background: "#B5A7D4" }}
                                    ></div>
                                    <div
                                        className="swatch"
                                        style={{ background: "#F4A67A" }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <button className="btt" onClick={scrollToTop}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                >
                    <path d="M18 15l-6-6-6 6" />
                </svg>
            </button>
        </div>
    );
}
