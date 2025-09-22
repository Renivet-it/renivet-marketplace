"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Icons } from "@/components/icons";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const aspectRatio = 1440 / 500; // same as reference

  return (
    <section className={cn("", className)} {...props}>

<nav className="relative md:hidden z-10">

 {/* Background image with 25% opacity */}
 <div
    className="absolute inset-0 z-0"
    style={{
      backgroundImage: "url('/assets/clrdrop.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      opacity: 0.25,
    }}
  ></div>



  {/* Navbar content */}
  <div className="flex justify-around items-center p-4 text-black relative z-10">
    <Link href="/women" className="flex flex-col items-center">
      <Icons.Venus className="w-6 h-6" />
      <span className="text-xs">Women</span>
    </Link>
    <Link href="/men" className="flex flex-col items-center">
      <Icons.Mars className="w-6 h-6" />
      <span className="text-xs">Men</span>
    </Link>
    <Link href="/little" className="flex flex-col items-center">
      <Icons.Users className="w-6 h-6" />
      <span className="text-xs">Little Renivet</span>
    </Link>
    <Link href="/home" className="flex flex-col items-center">
      <Icons.House className="w-6 h-6" />
      <span className="text-xs">Home & Living</span>
    </Link>
    <Link href="/beauty" className="flex flex-col items-center">
      <Icons.Droplet className="w-6 h-6" />
      <span className="text-xs">Beauty</span>
    </Link>
  </div>
</nav>


      {/* ------------------- DESKTOP VIEW ------------------- */}
      <div className="hidden md:block">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full bg-[#F4F0EC]"
        >
          <CarouselContent
            classNames={{
              wrapper: "size-full",
              inner: "size-full ml-0",
            }}
          >
            {banners.map((item, index) => (
              <CarouselItem key={index} className="px-0 py-0">
                <div
                  className="relative w-full overflow-hidden bg-gray-100"
                  style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={1440}
                    height={500}
                    className="absolute inset-0 w-full h-full object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-8"
                      asChild
                    >
                      <Link href={item.url || "/shop"}>Shop Now</Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
{/* ------------------- MOBILE VIEW ------------------- */}
<div className="md:hidden relative bg-[#FDF8F4] text-gray-900 pb-10">

  {/* ---------- Title & Subtitle ---------- */}
  <div className="text-center px-2">
  <h1 className="text-center text-xl font-semibold text-[#9a5aad]">
    welcome to <br /> little renivet
  </h1>
    <p className="text-sm mt-2 text-gray-700 leading-snug">
      Tiny Threads of Heritage <br />
      Handcrafted ethnic wear for your little ones
    </p>
  </div>

  {/* ---------- Main Image ---------- */}
  <div className="mt-6 px-4">
    <Image
      src={banners[0]?.imageUrl || "/placeholder.jpg"}
      alt={banners[0]?.title || "Little renivet banner"}
      width={1440}
      height={500}
      className="w-full h-auto rounded-2xl object-cover"
      priority
    />
  </div>
  <div className="relative flex justify-center items-center mt-8">
  {/* Shop Now Button - perfectly centered */}
  <button className="flex bg-[#f7e3c1] text-black px-4 py-2 rounded-lg shadow hover:bg-[#EBF2ED] text-lg font-semibold whitespace-nowrap z-10">
    Shop Now
  </button>

  {/* Teddy Image - positioned to the right of the button */}
  <Image
    src="/assets/td.jpeg"
    alt="Teddy sitting"
    width={100}
    height={100}
    className="absolute left-1/2 translate-x-[80%] -rotate-12 mix-blend-multiply filter brightness-90 opacity-25"
  />
</div>




  {/* Bottom curve SVG */}
  <div className="mt-2 overflow-hidden w-full">
  <svg
    viewBox="0 0 1440 80"
    className="w-full h-20"
    preserveAspectRatio="none"
  >
    <path
      d="M0,40 C360,0 720,80 1080,40 C1260,20 1440,60 1440,40"
      stroke="#f7e3c1"      // Color of the line
      strokeWidth="20"       // Increased thickness (you can adjust this value)
      fill="none"           // Ensure no fill is applied
    />
  </svg>
</div>

  {/* ---------- Shop By Gender ---------- */}
  <div className="mt-2 px-4">
    <h2 className="text-sm font-semibold mb-3">Shop By Gender</h2>
    <div className="flex gap-3">
      <button className="flex-1 bg-gray-200 rounded-md py-2 text-center text-sm">Boys</button>
      <button className="flex-1 bg-gray-200 rounded-md py-2 text-center text-sm">Girls</button>
      <button className="flex-1 bg-gray-200 rounded-md py-2 text-center text-sm">Unisex</button>
    </div>
  </div>

  {/* ---------- Shop By Age ---------- */}
  <div className="mt-6 px-4">
    <h2 className="text-sm font-semibold mb-3">Shop By Age</h2>
    <div className="flex flex-wrap gap-3">
      <button className="flex-1 min-w-[30%] bg-gray-200 rounded-md py-2 text-center text-sm">All Ages</button>
      <button className="flex-1 min-w-[30%] bg-gray-200 rounded-md py-2 text-center text-sm">Infant(0-2)</button>
      <button className="flex-1 min-w-[30%] bg-gray-200 rounded-md py-2 text-center text-sm">Toddlers(3-5)</button>
    </div>
  </div>

</div>

              
    </section>
  );
}
