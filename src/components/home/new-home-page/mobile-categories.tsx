"use client";

import Image from "next/image";

export function MobileCategories() {
  const categories = [
    {
      title: "Indian Wear",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNOZuGknHKYuSX87vxCz1aEsjfWTRVJZ9QmtnN",
    },
    {
      title: "Western Wear",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQYQ3xig0rgXZuWwadPABUqnljV5RbJMFsx1",
    },
    {
      title: "Foot Wear",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkGqI6DxYt1TxMBy6jes3QdWaELUvNIiXHwRO",
    },
    {
      title: "Shirts",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNHt3Y72cpctzNSTlLa4Po2KvFZm05urDqnVsw",
    },
    {
      title: "Accessories",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNZTPHusI6Gw03SBYgknrdpcjuJ8IvhPb5W9zy",
    },
    {
      title: "Home Decor",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNp9XWJrYoKFqlYMSWzhgNZG6Cm5OtIUjre39T",
    },
    {
      title: "Handbags",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN4VgCB4KTrA2wJk4WKdFytgsaQSNjmBo8I5CG",
    },
    {
      title: "Kids",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXLfwmU3We049OUSYNxCLnRIka3FhcqBZlbsP",
    },
  ];

  return (
    <section className="w-full bg-[#f4f0ec] py-6 px-4 block md:hidden">
      <div className="grid grid-cols-4 gap-y-6 gap-x-3 place-items-center">
        {categories.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-[78px] h-[78px] relative overflow-hidden">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>

            <p className="text-[12px] mt-2 text-center text-[#333] leading-tight">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
