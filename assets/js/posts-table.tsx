import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  type SuccessDataFunc,
  buildCSRFHeaders,
} from "./ash_rpc";

// Type definitions
type Post = {
  id: string;
  title: string;
  body: string;
//   exchange?: {
//     name: string;
//   } | null;
};

type PostsData = SuccessDataFunc<typeof listPosts>;

// Column helper for type safety
const columnHelper = createColumnHelper<Post>();

export const PostsTable = () => {
  const PAGE_SIZE = 10; // Number of posts to fetch per page

  // Infinite query for fetching posts data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam }) => {
      const page = pageParam
        ? { after: pageParam as string, limit: PAGE_SIZE }
        : { limit: PAGE_SIZE };

      const result = await listPosts({
        fields: ["id", "title", "body"],
        page,
        headers: buildCSRFHeaders(),
      });

      if (!result.success) {
        throw new Error(
          (result as Extract<typeof result, { success: false }>).errors[0]
            ?.message || "Failed to fetch posts",
        );
      }

      return result.data as any;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (Array.isArray(lastPage)) return undefined;
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
  });

  // Flatten paginated data into a single array
  const posts = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => (Array.isArray(page) ? page : page.results));
  }, [data]);

  // UI state and query client
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const startEdit = useCallback((row: Post) => {
    setEditingId(row.id);
    setEditTitle(row.title ?? "");
    setEditBody(row.body ?? "");
    setShowEditModal(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
    setShowEditModal(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingId) return;
    await updatePost({ identity: editingId, input: { title: editTitle, body: editBody }, fields: ["id", "title", "body"], headers: buildCSRFHeaders() });
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
    cancelEdit();
  }, [editingId, editTitle, editBody, queryClient, cancelEdit]);

  const handleDelete = useCallback(async (id: string) => {
    await deletePost({ identity: id, headers: buildCSRFHeaders() });
    setDeleteCandidate(null);
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
  }, [queryClient]);

  const handleCreate = useCallback(async () => {
    if (!newTitle) return;
    await createPost({ input: { title: newTitle, body: newBody }, fields: ["id", "title", "body"], headers: buildCSRFHeaders() });
    setNewTitle("");
    setNewBody("");
    await queryClient.invalidateQueries({ queryKey: ["posts"] });
  }, [newTitle, newBody, queryClient]);

  // Column definitions (including actions)
  const columns = [
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => {
        const value = info.getValue() as string;

        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {value}
          </span>
        );
      },
      size: 120,
    }),

    columnHelper.accessor("body", {
      header: "Body",
      cell: (info) => {
        const value = info.getValue() as string;

        return (
          <div className="text-sm font-medium text-gray-900 truncate">
            {value}
          </div>
        );
      },
      size: 300,
    }),

    columnHelper.accessor("id", {
      header: "Actions",
      cell: (info) => {
        const id = info.getValue() as string;
        const row = info.row.original as Post;

        return (
          <div className="flex items-center space-x-2 justify-end">
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => startEdit(row)}
            >
              Edit
            </button>
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => setDeleteCandidate(id)}
            >
              Delete
            </button>
          </div>
        );
      },
      size: 120,
    }),
  ];

  // Initialize table
  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Ref for the scrollable container
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 5,
  });

  // Intersection Observer for infinite scrolling with virtualization
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= posts.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    posts.length,
    virtualizer.getVirtualItems(),
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Posts</h1>
          <p className="text-lg text-gray-600">Browse all listed posts</p>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading posts...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Posts</h1>
          <p className="text-lg text-gray-600">Browse all listed posts</p>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-red-200 p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-2">
              Failed to load posts
            </div>
            <p className="text-gray-600">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="py-8">

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Posts</h1>
        <p className="text-lg text-gray-600">Browse all listed posts</p>
      </div>

      {/* Create form */}
      <div className="mb-4 flex items-center space-x-2">
        <input className="border rounded px-3 py-2" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New post title" />
        <input className="border rounded px-3 py-2" value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="New post body" />
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleCreate}>Create Post</button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              className="grid grid-cols-12 gap-4 px-6 py-3"
            >
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  className={`
                    text-xs font-medium text-gray-500 uppercase tracking-wider
                    
                    ${header.column.id === "title" ? "col-span-5" : ""}
                    ${header.column.id === "body" ? "col-span-2" : ""}
                    ${header.column.id === "id" ? "col-span-5" : ""}
                  `}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Virtualized Scrollable Table Body */}
        <div
          ref={parentRef}
          className="h-96 overflow-y-auto bg-white"
          style={{ contain: "strict" }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const row = table.getRowModel().rows[virtualItem.index];
              if (!row) return null;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className={`
                        flex items-center
                        ${cell.column.id === "title" ? "col-span-5" : ""}
                        ${cell.column.id === "body" ? "col-span-5" : ""}
                        ${cell.column.id === "id" ? "col-span-2" : ""}
                      `}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <div
                style={{
                  position: "absolute",
                  top: `${virtualizer.getTotalSize()}px`,
                  left: 0,
                  width: "100%",
                  height: "60px",
                }}
                className="grid grid-cols-12 gap-4 px-6 py-4"
              >
                <div className="col-span-12 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Loading more posts...
                  </span>
                </div>
              </div>
            )}

            {/* End of results message */}
            {!hasNextPage && posts.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${virtualizer.getTotalSize()}px`,
                  left: 0,
                  width: "100%",
                  height: "80px",
                }}
                className="text-center py-8"
              >
                <p className="text-gray-500 text-sm">
                  You've reached the end of the list
                </p>
              </div>
            )}

            {/* Empty state */}
            {posts.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No posts found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results counter */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Showing {posts.length} posts
        {data?.pages[0]?.hasMore && " (scroll down for more)"}
      </div>
    </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={cancelEdit} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Post</h2>
            <div className="space-y-3">
              <input className="w-full border rounded px-3 py-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
              <textarea className="w-full border rounded px-3 py-2 h-32" value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Body" />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={cancelEdit}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setDeleteCandidate(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm deletion</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setDeleteCandidate(null)}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => handleDelete(deleteCandidate)}>Delete</button>
            </div>
          </div>
        </div>
        )}
        </>
      );
};
