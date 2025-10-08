"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// The component props are unchanged, as you requested.
interface InstaPost {
  id: string;
  imageUrl: string;
  url: string;
}

interface PageProps {
  banners: InstaPost[];
  className?: string;
}

// The URL for the static top banner image.
const staticTopBannerUrl = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbKsKQvbyYEoZ78eJzNIKWdcxq1Of9wlHtAT";

export function InstaBanner({ className, banners }: PageProps  ) {
  return (
    // 1. Main section with the page's solid background color.
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)}>
      {/* 2. A max-width container to center the component on the page. */}
      <div className="max-w-[1612px] mx-auto px-4">
        {/* 3. The container with the reddish background. */}
        <div className="w-full bg-[#C95E5A] py-8 px-4 sm:px-6 md:px-8 space-y-8">
          
          {/* 4. Static Top Banner, now aligned to the left. */}
          <div className="w-full">
            <div className="relative w-full max-w-lg h-20 md:h-24">
              <Image
                src={staticTopBannerUrl}
                alt="Festive Categories"
                fill
                className="object-contain object-left" // Aligns image to the left
              />
            </div>
          </div>

          {/* 5. Dynamic Grid, now aligned to the left. */}
          <div className="flex flex-wrap justify-start gap-6"> {/* CHANGED: justify-start */}
            {banners.map((post, index) => (
              // The light-yellow card container
              <div
                key={post.id || index}
                className="group bg-[#FFFBEB] rounded-2xl p-2"
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
    </section>
  );
}
