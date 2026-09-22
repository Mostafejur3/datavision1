import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { blogPosts } from "@/data/blog";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Blog() {
  return (
    <Layout>
      <section className="pt-8 md:pt-10 pb-4 md:pb-6">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="font-heading text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3"
          >
            Insights & <span className="gradient-text">Blog</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto"
          >
            Tutorials, guides, and industry insights from our data experts.
          </motion.p>
        </div>
      </section>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {blogPosts.map((post, i) => (
              <motion.article key={post.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Link to={`/blog/${post.id}`} className="block glass-card-strong rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer hover:border-accent/30 transition-all h-full">
                  <div className="h-24 md:h-40 bg-gradient-to-br from-primary/20 to-accent/20" />
                  <div className="p-3 md:p-6">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <span className="text-[10px] md:text-xs text-accent bg-accent/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full font-medium">{post.category}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-xs md:text-base mb-1 md:mb-2 group-hover:text-accent transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-muted-foreground text-[11px] md:text-sm mb-2 md:mb-4 line-clamp-2 hidden sm:block">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] md:text-xs text-muted-foreground">{post.date}</span>
                      <span className="text-accent text-[11px] md:text-sm font-medium flex items-center gap-0.5">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
