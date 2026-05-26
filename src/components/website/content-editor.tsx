"use client";

import { useAppStore } from "@/state/app-store";
import {
  type Service,
  type Review,
  type PortfolioItem,
  type TeamMember,
  type BlogPost,
  type Product,
} from "@/lib/types";
import { Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const card =
  "rounded-lg border border-white/10 bg-white/5 p-6";
const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none disabled:opacity-50";
const label = "mb-1 block text-xs font-medium text-white/70";
const sectionTitle =
  "mb-4 flex items-center justify-between text-lg font-semibold text-white";

const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-white transition hover:bg-accent/20"
  >
    <Plus className="h-4 w-4" />
    {label}
  </button>
);

const RemoveButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-md p-1.5 text-white/60 transition hover:bg-red-500/20 hover:text-red-400"
    aria-label="Remove"
  >
    <Trash2 className="h-4 w-4" />
  </button>
);

const Empty = ({ msg }: { msg: string }) => (
  <p className="rounded-md border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/40">
    {msg}
  </p>
);

export const ContentEditor = () => {
  const info = useAppStore((s) => s.websiteInfo);
  const add = useAppStore((s) => s.addContentItem);
  const update = useAppStore((s) => s.updateContentItem);
  const remove = useAppStore((s) => s.removeContentItem);
  const sections = info.sections;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#1a1a1a] p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Content</h1>
          <p className="mt-2 text-white/60">
            Add the real content for each enabled section. Hide sections from the &ldquo;Sections&rdquo; tab.
          </p>
        </div>

        {/* SERVICES */}
        {sections.services && (
          <div className={card}>
            <div className={sectionTitle}>
              <span>Services</span>
              <AddButton
                label="Add service"
                onClick={() =>
                  add("services", {
                    id: uid(),
                    title: "",
                    description: "",
                    price: "",
                  } as Service)
                }
              />
            </div>
            {info.services.length === 0 ? (
              <Empty msg="No services yet. Click 'Add service' to create one." />
            ) : (
              <div className="space-y-4">
                {info.services.map((s) => (
                  <div key={s.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className={label}>Title</label>
                        <input
                          className={input}
                          value={s.title}
                          placeholder="Haircut & style"
                          onChange={(e) => update("services", s.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="w-32">
                        <label className={label}>Price</label>
                        <input
                          className={input}
                          value={s.price ?? ""}
                          placeholder="$45"
                          onChange={(e) => update("services", s.id, { price: e.target.value })}
                        />
                      </div>
                      <RemoveButton onClick={() => remove("services", s.id)} />
                    </div>
                    <label className={label}>Description</label>
                    <textarea
                      className={input}
                      rows={2}
                      value={s.description}
                      placeholder="Short description shown on the card"
                      onChange={(e) => update("services", s.id, { description: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {sections.reviews && (
          <div className={card}>
            <div className={sectionTitle}>
              <span>Reviews</span>
              <AddButton
                label="Add review"
                onClick={() =>
                  add("reviews", {
                    id: uid(),
                    author: "",
                    rating: 5,
                    text: "",
                  } as Review)
                }
              />
            </div>
            {info.reviews.length === 0 ? (
              <Empty msg="No reviews yet." />
            ) : (
              <div className="space-y-4">
                {info.reviews.map((r) => (
                  <div key={r.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className={label}>Author</label>
                        <input
                          className={input}
                          value={r.author}
                          placeholder="Jane Doe"
                          onChange={(e) => update("reviews", r.id, { author: e.target.value })}
                        />
                      </div>
                      <div className="w-40">
                        <label className={label}>Rating</label>
                        <div className="flex items-center gap-1 py-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => update("reviews", r.id, { rating: n })}
                              className="text-white/80 transition hover:scale-110"
                              aria-label={`${n} stars`}
                            >
                              <Star
                                className={cn(
                                  "h-5 w-5",
                                  n <= r.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-white/30"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <RemoveButton onClick={() => remove("reviews", r.id)} />
                    </div>
                    <label className={label}>Review text</label>
                    <textarea
                      className={input}
                      rows={3}
                      value={r.text}
                      placeholder="What did they say?"
                      onChange={(e) => update("reviews", r.id, { text: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO */}
        {sections.portfolio && (
          <div className={card}>
            <div className={sectionTitle}>
              <span>Portfolio</span>
              <AddButton
                label="Add item"
                onClick={() =>
                  add("portfolio", {
                    id: uid(),
                    title: "",
                    description: "",
                    imageUrl: "",
                  } as PortfolioItem)
                }
              />
            </div>
            {info.portfolio.length === 0 ? (
              <Empty msg="No portfolio items yet." />
            ) : (
              <div className="space-y-4">
                {info.portfolio.map((p) => (
                  <div key={p.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className={label}>Title</label>
                        <input
                          className={input}
                          value={p.title}
                          placeholder="Modern bathroom remodel"
                          onChange={(e) => update("portfolio", p.id, { title: e.target.value })}
                        />
                      </div>
                      <RemoveButton onClick={() => remove("portfolio", p.id)} />
                    </div>
                    <ImageUpload
                      label="Image"
                      value={p.imageUrl}
                      onChange={(url) => update("portfolio", p.id, { imageUrl: url })}
                    />
                    <label className={cn(label, "mt-3")}>Description</label>
                    <textarea
                      className={input}
                      rows={2}
                      value={p.description}
                      onChange={(e) => update("portfolio", p.id, { description: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAM */}
        {sections.technicians && (
          <div className={card}>
            <div className={sectionTitle}>
              <span>Team</span>
              <AddButton
                label="Add member"
                onClick={() =>
                  add("team", {
                    id: uid(),
                    name: "",
                    role: "",
                    bio: "",
                    photoUrl: "",
                  } as TeamMember)
                }
              />
            </div>
            {info.team.length === 0 ? (
              <Empty msg="No team members yet." />
            ) : (
              <div className="space-y-4">
                {info.team.map((m) => (
                  <div key={m.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className={label}>Name</label>
                        <input
                          className={input}
                          value={m.name}
                          placeholder="Alex Smith"
                          onChange={(e) => update("team", m.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="flex-1">
                        <label className={label}>Role</label>
                        <input
                          className={input}
                          value={m.role}
                          placeholder="Founder"
                          onChange={(e) => update("team", m.id, { role: e.target.value })}
                        />
                      </div>
                      <RemoveButton onClick={() => remove("team", m.id)} />
                    </div>
                    <ImageUpload
                      label="Photo"
                      value={m.photoUrl}
                      onChange={(url) => update("team", m.id, { photoUrl: url })}
                    />
                    <label className={cn(label, "mt-3")}>Short bio</label>
                    <textarea
                      className={input}
                      rows={2}
                      value={m.bio ?? ""}
                      onChange={(e) => update("team", m.id, { bio: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BLOG */}
        {sections.blog && (
          <div className={card}>
            <div className={sectionTitle}>
              <span>Blog posts</span>
              <AddButton
                label="Add post"
                onClick={() =>
                  add("blog", {
                    id: uid(),
                    title: "",
                    date: "",
                    excerpt: "",
                  } as BlogPost)
                }
              />
            </div>
            {info.blog.length === 0 ? (
              <Empty msg="No blog posts yet." />
            ) : (
              <div className="space-y-4">
                {info.blog.map((b) => (
                  <div key={b.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className={label}>Title</label>
                        <input
                          className={input}
                          value={b.title}
                          placeholder="Why X matters"
                          onChange={(e) => update("blog", b.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="w-40">
                        <label className={label}>Date</label>
                        <input
                          className={input}
                          value={b.date ?? ""}
                          placeholder="2026-05-01"
                          onChange={(e) => update("blog", b.id, { date: e.target.value })}
                        />
                      </div>
                      <RemoveButton onClick={() => remove("blog", b.id)} />
                    </div>
                    <label className={label}>Excerpt</label>
                    <textarea
                      className={input}
                      rows={3}
                      value={b.excerpt}
                      placeholder="Short summary shown on the homepage card"
                      onChange={(e) => update("blog", b.id, { excerpt: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHOP */}
        {sections.shop && (
          <div className={card}>
            <div className={sectionTitle}>
              <span>Shop products</span>
              <AddButton
                label="Add product"
                onClick={() =>
                  add("products", {
                    id: uid(),
                    name: "",
                    price: "",
                    description: "",
                    imageUrl: "",
                  } as Product)
                }
              />
            </div>
            {info.products.length === 0 ? (
              <Empty msg="No products yet." />
            ) : (
              <div className="space-y-4">
                {info.products.map((p) => (
                  <div key={p.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className={label}>Name</label>
                        <input
                          className={input}
                          value={p.name}
                          placeholder="Conditioner"
                          onChange={(e) => update("products", p.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="w-32">
                        <label className={label}>Price</label>
                        <input
                          className={input}
                          value={p.price}
                          placeholder="$25"
                          onChange={(e) => update("products", p.id, { price: e.target.value })}
                        />
                      </div>
                      <RemoveButton onClick={() => remove("products", p.id)} />
                    </div>
                    <ImageUpload
                      label="Image"
                      value={p.imageUrl}
                      onChange={(url) => update("products", p.id, { imageUrl: url })}
                    />
                    <label className={cn(label, "mt-3")}>Description</label>
                    <textarea
                      className={input}
                      rows={2}
                      value={p.description}
                      onChange={(e) => update("products", p.id, { description: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!sections.services &&
          !sections.reviews &&
          !sections.portfolio &&
          !sections.technicians &&
          !sections.blog &&
          !sections.shop && (
            <Empty msg="Enable sections from the 'Sections' tab to add their content here." />
          )}
      </div>
    </div>
  );
};
