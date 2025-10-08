"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// The component props are UNCHANGED, as you requested.
interface InstaPost {
  id: string;
  imageUrl: string;
  url: string;
}

interface PageProps {
  banners: InstaPost[];
  className?: string;
}

// An array to hold all your small banner image URLs.
// You can add as many links as you want here.
const topCategoryImages = [
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcCP5AieO4H8MeNYoyJQSarWCqgVpRxP5lDBu", // Example 1
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjzPoAomPpnZoHc5f2E4rFNLugdK3ty9ObjYx", // Example 2
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNyDgSLH5TEHko4KfX8CDn1z7Q2migSIjw0dsy", // Example 3
  // ...add more image URLs here
];

export function InstaBanner({ className, banners }: PageProps  ) {
  return (
    // 1. Main section with the page's solid background color.
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)}>
      {/* 2. A max-width container to center the component on the page. */}
      <div className="max-w-[1509px] mx-auto px-4">
        {/* 3. The container with the CORRECT gradient and aspect ratio. */}
        <div
          className="w-full rounded-2xl pt-8 px-4 sm:px-6 md:px-8 relative"
          style={{
            background: 'linear-gradient(to bottom, #C95E5A 0%, rgba(201, 94, 90, 0) 50%, #C95E5A 100%)',
            aspectRatio: '1309 / 404', // Your specified aspect ratio
          }}
        >
          {/* 4. CORRECTED: DYNAMIC Top Banner, mapping over the `topCategoryImages` array. */}
          <div className="flex flex-wrap justify-start gap-4 mb-8">
            {topCategoryImages.map((imageUrl, index) => (
              <Link
                href={"/shop"} // A default link for the categories
                key={index}
                className="block w-20 h-20 md:w-24 md:h-24 relative rounded-lg overflow-hidden shadow-md"
              >
                <Image
                  src={imageUrl}
                  alt={`Category ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </Link>
            ))}
          </div>

          {/* 5. Dynamic Grid, absolutely positioned to overlap the bottom. */}
          <div className="absolute bottom-[-40px] left-0 right-0 px-4 sm:px-6 md:px-8">
            <div className="flex flex-wrap justify-start gap-6">
              {banners.map((post, index) => (
                // The light-yellow card container
                <div
                  key={post.id || index}
                  className="group bg-[#FFFBEB] rounded-2xl p-2 shadow-lg"
                  style={{
                    width: "231px",
                    height: "348px",
                  }}
                >
                  <Link href={post.url || "#"} className="block w-full h-full">
                    <div className="relative w-full h-full">
                      <Image
                        src={post.imageUrl}
                        alt={`Festive item ${index + 1}`}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                        sizes="231px"
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
