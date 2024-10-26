"use client";

import { BlogCard } from "@/components/globals/cards";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";

// Assuming you have a type for your blog posts
type Blog = {
    title: string;
    slug: string;
    description: string;
    thumbnailUrl: string;
    publishedAt: Date;
    author: {
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    };
};

interface BlogListWithPaginationProps {
    blogs: Blog[];
}

export default function BlogListWithPagination({
    blogs,
}: BlogListWithPaginationProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(blogs.length / itemsPerPage);

    const getPaginatedBlogs = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return blogs.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-10">
            <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
                {getPaginatedBlogs().map((blog, i) => (
                    <BlogCard key={i} blog={blog} />
                ))}
            </div>

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() =>
                                handlePageChange(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                        />
                    </PaginationItem>
                    {/* {[...Array(totalPages)].map((_, index) => (
                        <PaginationItem key={index}>
                            <PaginationLink
                                onClick={() => handlePageChange(index + 1)}
                                isActive={currentPage === index + 1}
                            >
                                {index + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))} */}
                    {[...Array(totalPages)].length > 3
                        ? [...Array(totalPages)].map((_, index) => {
                              if (
                                  index === 0 ||
                                  index === totalPages - 1 ||
                                  (index >= currentPage - 1 &&
                                      index <= currentPage + 1)
                              ) {
                                  return (
                                      <PaginationItem key={index}>
                                          <PaginationLink
                                              onClick={() =>
                                                  handlePageChange(index + 1)
                                              }
                                              isActive={
                                                  currentPage === index + 1
                                              }
                                          >
                                              {index + 1}
                                          </PaginationLink>
                                      </PaginationItem>
                                  );
                              } else if (
                                  index === currentPage - 2 ||
                                  index === currentPage + 2
                              ) {
                                  return (
                                      <PaginationItem key={index}>
                                          <PaginationEllipsis />
                                      </PaginationItem>
                                  );
                              }
                          })
                        : [...Array(totalPages)].map((_, index) => (
                              <PaginationItem key={index}>
                                  <PaginationLink
                                      onClick={() =>
                                          handlePageChange(index + 1)
                                      }
                                      isActive={currentPage === index + 1}
                                  >
                                      {index + 1}
                                  </PaginationLink>
                              </PaginationItem>
                          ))}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() =>
                                handlePageChange(
                                    Math.min(totalPages, currentPage + 1)
                                )
                            }
                            disabled={currentPage === totalPages}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
