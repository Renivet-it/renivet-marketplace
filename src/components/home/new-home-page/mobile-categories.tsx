"use client";

import Image from "next/image";
import Link from "next/link";

export function MobileCategories() {
  const categories = [
    {
      title: "Indian Wear",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNOZuGknHKYuSX87vxCz1aEsjfWTRVJZ9QmtnN",
      link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=0cb0f01f-4c17-47ff-8251-4ea5a7a65a09&productTypeId=0f13d48d-50de-43ec-8bab-a7bfbbcf8773",
    },
    {
      title: "Western Wear",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQYQ3xig0rgXZuWwadPABUqnljV5RbJMFsx1",
      link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=f050d1bc-f435-45fc-ac22-47942a4d4a74",
    },
    {
      title: "Foot Wear",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNkGqI6DxYt1TxMBy6jes3QdWaELUvNIiXHwRO",
      link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=4489ecbd-cb3e-47f0-aced-defcf134629b",
    },
    {
      title: "Shirts",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNHt3Y72cpctzNSTlLa4Po2KvFZm05urDqnVsw",
      link: "https://renivet.com/shop?categoryId=0b7046fc-6962-4469-81c2-412ed6949c02&subcategoryId=7f1e41e3-e7a9-46ef-aaf6-f0e0a37a971d&productTypeId=e027b0df-5287-4114-849d-1f3bfc05e594",
    },
    {
      title: "Accessories",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNZTPHusI6Gw03SBYgknrdpcjuJ8IvhPb5W9zy",
      link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=32674fe3-d167-4b48-914b-0819b17a2292",
    },
    {
      title: "Home Decor",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNp9XWJrYoKFqlYMSWzhgNZG6Cm5OtIUjre39T",
      link: "https://renivet.com/shop?categoryId=173e1e71-e298-4301-b542-caa29d3950bf",
    },
    {
      title: "Handbags",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN4VgCB4KTrA2wJk4WKdFytgsaQSNjmBo8I5CG",
      link: "https://renivet.com/shop?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1&subcategoryId=711eac71-1676-40eb-b637-7e4074d542d0",
    },
    {
      title: "Kids",
      imageUrl:
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNXLfwmU3We049OUSYNxCLnRIka3FhcqBZlbsP",
      link: "https://renivet.com/shop?categoryId=22816fa3-d57e-4e3b-bc0e-72edf4635124",
    },
  ];

  return (
    <section className="w-full bg-[#FCFBF4] py-6 px-4 block md:hidden">
      <div className="grid grid-cols-4 gap-y-6 gap-x-3 place-items-center">
        {categories.map((item, index) => (
          <Link
            key={index}
            href={item.link}
            className="flex flex-col items-center "
          >
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
          </Link>
        ))}
      </div>
    </section>
  );
}
