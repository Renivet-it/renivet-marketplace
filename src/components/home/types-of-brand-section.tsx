import Image from "next/image";
import Link from "next/link";

export function BrandCollaboration() {
  return (
    <div className="w-full bg-[#F4F0EC] py-12 md:py-16 px-4 md:px-0">
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <p className="text-xs md:text-sm uppercase tracking-widest text-gray-600 text-center mb-8 md:mb-12">
          THE TYPE OF BRAND THAT WE ARE COLLABORATING WITH
        </p>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4 md:px-8">
          {/* Card 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full aspect-[250/160] max-w-[250px] relative mb-3 md:mb-4">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNLR9K2TUt5ndSiE7wT2jaklrZXQ6vYpAbfHyW"
                alt="Local roots"
                fill
                className="object-cover"
                style={{ objectPosition: 'center' }}
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full aspect-[250/160] max-w-[250px] relative mb-3 md:mb-4">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNgSrQNt2ENPRLZdGUpA0elOxytCDfJibYIko7"
                alt="Sustainable design"
                fill
                className="object-cover"
                style={{ objectPosition: 'center' }}
              />
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full aspect-[250/160] max-w-[250px] relative mb-3 md:mb-4">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNbUgPwmuZc50VbmLPHAdU9KwxEkCINyqDWJRr"
                alt="Handcrafted"
                fill
                className="object-cover"
                style={{ objectPosition: 'center' }}
              />
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-full aspect-[250/160] max-w-[250px] relative mb-3 md:mb-4">
              <Image
                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNvurZjy5dPZsh5fuDbkAelMyqICmp3NU7X4nH"
                alt="Thoughtful pieces"
                fill
                className="object-cover"
                style={{ objectPosition: "center" }}
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/collaborations"
            className="inline-block border border-black px-6 py-2 uppercase tracking-widest text-xs md:text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            Explore Collaborations
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Page() {
  return (
    <div className="bg-[#F4F0EC]">
      <BrandCollaboration />
    </div>
  );
}