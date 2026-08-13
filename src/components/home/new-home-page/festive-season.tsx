"use client";

import {
    Product,
    ProductCard,
} from "@/components/home/new-home-page/new-arrivals";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { CSSProperties } from "react";

interface FestiveSeasonProps {
    products: Product[];
    userId?: string;
    className?: string;
    showAllProducts?: boolean;
}

const DESKTOP_SLOTS = 6;

function FlowerRail() {
    return (
        <div className="flower-rail" aria-hidden="true">
            {[0, 1, 2, 3].map((flower) => (
                <span className="rail-group" key={flower}>
                    <span className="rail-flower">
                        {Array.from({ length: 6 }).map((_, petal) => (
                            <i
                                key={petal}
                                style={{ "--petal": petal } as CSSProperties}
                            />
                        ))}
                        <b />
                    </span>
                    {flower < 3 ? (
                        <span className="rail-line">
                            <i />
                            <i />
                            <i />
                        </span>
                    ) : null}
                </span>
            ))}
        </div>
    );
}

export function FestiveSeason({
    products,
    userId,
    className,
    showAllProducts = false,
}: FestiveSeasonProps) {
    if (!products.length) return null;

    const desktopProducts = showAllProducts
        ? products
        : products.slice(0, DESKTOP_SLOTS);

    return (
        <section className={cn("festive-shell", className)}>
            <div className="festive-canvas">
                <div className="peach-art" aria-hidden="true">
                    <Image
                        src="/assets/festive-season/peach-left.png"
                        alt=""
                        fill
                        className="festive-left-image"
                        sizes="(max-width: 767px) 34vw, 38vw"
                    />
                </div>

                <div className="hanging-rakhi" aria-hidden="true">
                    <Image
                        src="/assets/festive-season/rakhi-mobile-cutout-trimmed.png"
                        alt=""
                        fill
                        className="festive-rakhi-image"
                        sizes="(max-width: 767px) 15vw, 7vw"
                    />
                </div>

                <div className="mobile-rakhi-crop" aria-hidden="true">
                    <Image
                        src="/assets/festive-season/rakhi-mobile-cutout-trimmed.png"
                        alt=""
                        fill
                        className="mobile-rakhi-source"
                        sizes="18vw"
                    />
                </div>

                <header className="festive-heading">
                    <div className="festive-heading-lotus" aria-hidden="true">
                        <Image
                            src="/assets/festive-season/flower-lotus.png"
                            alt=""
                            fill
                            className="festive-heading-decoration-image"
                            sizes="(max-width: 767px) 120px, 150px"
                        />
                    </div>
                    <h2>Rakhi Collection</h2>
                    <p>
                        Celebrate the bond that makes every moment
                        unforgettable.
                    </p>
                    <div className="festive-heading-divider" aria-hidden="true">
                        <Image
                            src="/assets/festive-season/flower-divider.png"
                            alt=""
                            fill
                            className="festive-heading-decoration-image"
                            sizes="(max-width: 767px) 180px, 260px"
                        />
                    </div>
                </header>

                <div
                    className="festive-desktop"
                    aria-label="Rakhi collection products"
                >
                    {desktopProducts.map((product) => (
                        <div className="festive-frame" key={product.id}>
                            <ProductCard
                                product={product}
                                userId={userId}
                                className="festive-product-card"
                                showAddToCart
                            />
                        </div>
                    ))}
                </div>

                <div className="festive-mobile">
                    {products.map((product) => (
                        <div className="mobile-frame" key={product.id}>
                            <ProductCard
                                product={product}
                                userId={userId}
                                className="festive-product-card"
                                showAddToCart
                                showDescription
                            />
                        </div>
                    ))}
                </div>

                <FlowerRail />
            </div>

            <style jsx global>{`
                .festive-shell {
                    width: 100%;
                    overflow: hidden;
                    background: #fff5e8;
                    padding: 0;
                }
                .festive-canvas {
                    position: relative;
                    isolation: isolate;
                    width: 100%;
                    min-height: 350px;
                    overflow: hidden;
                    background-color: #fff5e8;
                    background-image: radial-gradient(
                            circle at 91% 12%,
                            rgba(255, 220, 172, 0.22),
                            transparent 28%
                        ),
                        linear-gradient(
                            105deg,
                            #fff8ef 0%,
                            #fff5e8 72%,
                            #fff1de 100%
                        );
                }
                .peach-art {
                    position: absolute;
                    z-index: -1;
                    inset: 0 auto 0 0;
                    width: min(36%, 720px);
                    overflow: hidden;
                    pointer-events: none;
                }
                .festive-left-image {
                    object-fit: cover;
                    object-position: left center;
                }
                .festive-heading {
                    position: relative;
                    z-index: 3;
                    margin: 0 auto;
                    padding-top: clamp(5px, 0.8vw, 14px);
                    text-align: center;
                    color: #4a2a1d;
                }
                .festive-heading-lotus {
                    position: relative;
                    width: clamp(82px, 7.5vw, 145px);
                    aspect-ratio: 163 / 96;
                    margin: 0 auto clamp(-12px, -0.6vw, -7px);
                }
                .festive-heading-decoration-image {
                    object-fit: contain;
                }
                .festive-heading h2 {
                    margin: 0;
                    font-family: var(--font-playfair), Georgia, serif;
                    font-size: clamp(30px, 3.2vw, 60px);
                    font-weight: 400;
                    line-height: 1;
                    letter-spacing: -0.025em;
                }
                .festive-heading p {
                    margin: clamp(12px, 1.15vw, 22px) auto 0;
                    font-size: clamp(7px, 0.62vw, 12px);
                    font-weight: 700;
                    line-height: 1;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                }
                .festive-heading-divider {
                    position: relative;
                    width: clamp(145px, 15vw, 285px);
                    aspect-ratio: 305 / 65;
                    margin-top: clamp(12px, 1.3vw, 24px);
                    margin-right: auto;
                    margin-left: auto;
                }
                .festive-desktop {
                    position: relative;
                    z-index: 2;
                    display: grid;
                    width: 84%;
                    margin: clamp(10px, 1.4vw, 26px) 5.6% 0 auto;
                    grid-template-columns: repeat(6, minmax(0, 1fr));
                    gap: clamp(12px, 1.65vw, 31px);
                }
                .festive-frame {
                    aspect-ratio: 0.64;
                    overflow: hidden;
                    border: 1px solid #e5b879;
                    background: #fff9f0;
                }
                .festive-frame .festive-product-card {
                    width: 100%;
                    height: 100%;
                    padding: clamp(4px, 0.45vw, 8px);
                    background: #fff9f0;
                }
                .festive-frame .festive-product-card > a,
                .festive-frame .festive-product-card > a > span:first-child {
                    height: 100%;
                }
                .festive-frame .festive-product-card > a > span:first-child {
                    display: flex;
                    flex-direction: column;
                }
                .festive-frame .product-card-media {
                    aspect-ratio: 1;
                    border-radius: 0;
                    clip-path: none;
                }
                .festive-frame .product-card-quick-view-mobile {
                    display: none;
                }
                .festive-frame .product-card-wishlist-button {
                    top: clamp(11px, 0.85vw, 16px);
                    right: clamp(11px, 0.85vw, 16px);
                }
                .festive-frame .product-card-copy {
                    padding: clamp(5px, 0.5vw, 9px) 3px 4px;
                }
                .festive-frame .product-card-title {
                    display: -webkit-box;
                    overflow: hidden;
                    font-family: Georgia, "Times New Roman", serif;
                    font-size: clamp(9px, 0.72vw, 14px);
                    font-weight: 600;
                    line-height: 1.18;
                    color: #552d1c;
                    white-space: normal;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                }
                .festive-frame .festival-card-footer {
                    display: grid;
                    width: fit-content;
                    max-width: 100%;
                    min-height: clamp(38px, 2.8vw, 52px);
                    align-items: center;
                    justify-content: center;
                    margin: auto;
                    padding: 2px 0;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: clamp(7px, 0.65vw, 13px);
                }
                .festive-frame .product-card-price {
                    display: grid;
                    min-width: 0;
                    align-items: baseline;
                    justify-content: start;
                    grid-template-columns: max-content minmax(0, 1fr);
                    column-gap: 4px;
                    row-gap: 2px;
                    line-height: 1;
                }
                .festive-frame .product-card-current-price {
                    grid-column: 1;
                    white-space: nowrap;
                    font-size: clamp(11px, 0.88vw, 17px);
                    font-weight: 700;
                    color: #f05b50;
                }
                .festive-frame .product-card-original-price {
                    grid-column: 2;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    font-size: clamp(7px, 0.48vw, 9px);
                }
                .festive-frame .product-card-discount {
                    grid-column: 1 / -1;
                    font-size: clamp(7px, 0.48vw, 9px);
                    line-height: 1.1;
                    color: #f05b50;
                }
                .festive-frame .festival-add-to-cart {
                    min-width: clamp(58px, 4.8vw, 92px);
                    border-radius: 7px;
                    padding: clamp(5px, 0.45vw, 8px) 5px;
                    font-size: clamp(5px, 0.43vw, 8px);
                    line-height: 1;
                }
                .festive-frame .festival-add-to-cart svg {
                    width: clamp(9px, 0.7vw, 13px);
                    height: clamp(9px, 0.7vw, 13px);
                }
                .festive-mobile {
                    display: none;
                }
                .hanging-rakhi {
                    position: absolute;
                    z-index: 4;
                    top: -2%;
                    left: 1%;
                    width: clamp(46px, 5.5vw, 100px);
                    height: 78%;
                    pointer-events: none;
                }
                .festive-rakhi-image {
                    object-fit: contain;
                    object-position: top center;
                }
                .mobile-rakhi-crop {
                    display: none;
                }
                .flower-rail {
                    position: relative;
                    z-index: 3;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    width: 58%;
                    margin: clamp(18px, 2.2vw, 42px) 2.5%
                        clamp(10px, 1.2vw, 22px) auto;
                }
                .rail-group {
                    display: flex;
                    flex: 1;
                    align-items: center;
                }
                .rail-group:last-child {
                    flex: 0 0 auto;
                }
                .rail-flower {
                    position: relative;
                    display: block;
                    width: clamp(22px, 2.5vw, 47px);
                    aspect-ratio: 1;
                    flex: 0 0 auto;
                }
                .rail-flower i {
                    position: absolute;
                    left: 40%;
                    top: 3%;
                    width: 22%;
                    height: 48%;
                    border-radius: 90% 10% 90% 10%;
                    background: linear-gradient(#ff8b73, #ef5958);
                    transform: rotate(calc(var(--petal) * 60deg));
                    transform-origin: 50% 98%;
                }
                .rail-flower b {
                    position: absolute;
                    inset: 38%;
                    border-radius: 50%;
                    background: #f1b247;
                }
                .rail-line {
                    display: flex;
                    flex: 1;
                    align-items: center;
                    justify-content: space-around;
                    margin: 0 7px;
                    border-top: 2px dotted #f17968;
                }
                .rail-line i {
                    width: 7px;
                    height: 7px;
                    margin-top: -1px;
                    transform: rotate(45deg);
                    background: #f56b61;
                }
                @media (max-width: 767px) {
                    .festive-shell {
                        padding: 0;
                    }
                    .festive-canvas {
                        min-height: 0;
                        padding: 0 6px 18px;
                    }
                    .peach-art {
                        width: 25%;
                    }
                    .festive-left-image {
                        object-fit: fill;
                        object-position: left center;
                    }
                    .hanging-rakhi {
                        display: none;
                    }
                    .mobile-rakhi-crop {
                        position: absolute;
                        z-index: 1;
                        left: -2%;
                        top: 0;
                        display: block;
                        width: 17%;
                        height: min(76vw, 450px);
                        pointer-events: none;
                    }
                    .mobile-rakhi-source {
                        object-fit: contain;
                        object-position: left top;
                        filter: drop-shadow(0 3px 5px rgba(91, 36, 18, 0.2));
                    }
                    .festive-heading {
                        padding-top: 8px;
                    }
                    .festive-heading-lotus {
                        width: 92px;
                        margin-bottom: -7px;
                    }
                    .festive-heading h2 {
                        font-size: clamp(30px, 9.5vw, 43px);
                    }
                    .festive-heading p {
                        width: 72%;
                        margin-top: 13px;
                        font-size: clamp(7px, 2.15vw, 10px);
                        line-height: 1.55;
                        letter-spacing: 0.18em;
                    }
                    .festive-heading-divider {
                        width: 170px;
                        margin-top: 9px;
                    }
                    .festive-desktop {
                        display: none;
                    }
                    .festive-mobile {
                        position: relative;
                        z-index: 2;
                        display: grid;
                        width: 92%;
                        margin: 12px 0 0 auto;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        row-gap: 9px;
                        column-gap: 16px;
                    }
                    .mobile-frame {
                        overflow: hidden;
                        border: 1px solid #e5b879;
                        background: #fff9f0;
                    }
                    .mobile-frame .festive-product-card {
                        height: 100%;
                        padding: 7px;
                        background: #fff9f0;
                    }
                    .mobile-frame .festive-product-card > a,
                    .mobile-frame .festive-product-card > a > span:first-child {
                        height: 100%;
                    }
                    .mobile-frame .festive-product-card > a > span:first-child {
                        display: flex;
                        flex-direction: column;
                    }
                    .mobile-frame .product-card-media {
                        aspect-ratio: 1;
                        border-radius: 0;
                        clip-path: none;
                    }
                    .mobile-frame .product-card-quick-view-mobile {
                        display: none;
                    }
                    .mobile-frame .product-card-wishlist-button {
                        top: 14px;
                        right: 14px;
                    }
                    .mobile-frame .product-card-copy {
                        padding: 8px 4px 5px;
                    }
                    .mobile-frame .product-card-title {
                        display: -webkit-box;
                        overflow: hidden;
                        font-family: Georgia, "Times New Roman", serif;
                        font-size: clamp(11px, 3.2vw, 15px);
                        font-weight: 600;
                        line-height: 1.15;
                        color: #552d1c;
                        white-space: normal;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 1;
                    }
                    .mobile-frame .product-card-description {
                        min-height: 2.5em;
                        margin-top: 6px;
                        font-size: clamp(8px, 2.25vw, 10px);
                        font-style: italic;
                        line-height: 1.25;
                        color: #57392b;
                    }
                    .mobile-frame .product-card-description p {
                        margin: 0;
                    }
                    .mobile-frame .festival-card-footer {
                        display: grid;
                        width: 100%;
                        min-width: 0;
                        align-items: center;
                        justify-items: start;
                        margin-top: auto;
                        padding: 0 3px 7px;
                        grid-template-columns: 1fr;
                        row-gap: 5px;
                    }
                    .mobile-frame .product-card-price {
                        display: grid;
                        width: 100%;
                        min-width: 0;
                        overflow: visible;
                        align-items: baseline;
                        grid-template-columns: max-content max-content;
                        column-gap: 4px;
                        row-gap: 2px;
                        line-height: 1;
                    }
                    .mobile-frame .product-card-current-price {
                        grid-column: 1;
                        white-space: nowrap;
                        font-size: clamp(11px, 3.05vw, 14px);
                        font-weight: 700;
                        color: #f05b50;
                    }
                    .mobile-frame .product-card-original-price {
                        grid-column: 2;
                        overflow: visible;
                        white-space: nowrap;
                        text-overflow: clip;
                        font-size: clamp(7px, 1.8vw, 9px);
                    }
                    .mobile-frame .product-card-discount {
                        grid-column: 1 / -1;
                        white-space: nowrap;
                        font-size: clamp(7px, 1.8vw, 9px);
                        line-height: 1.1;
                        color: #f05b50;
                    }
                    .mobile-frame .festival-add-to-cart {
                        justify-self: end;
                        min-width: 0;
                        border-radius: 7px;
                        padding: 7px 6px;
                        gap: 3px;
                        font-size: clamp(6px, 1.55vw, 7px);
                        line-height: 1;
                        letter-spacing: 0;
                        white-space: nowrap;
                    }
                    .mobile-frame .festival-add-to-cart svg {
                        width: 12px;
                        height: 12px;
                    }
                    .flower-rail {
                        display: none;
                    }
                }
            `}</style>
        </section>
    );
}
