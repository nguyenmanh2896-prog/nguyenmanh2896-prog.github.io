// RECOMMENDATION ENGINE - Pure JavaScript
class RecommendationEngine {
  constructor() {
    this.products = [];
    this.reviews = [];
    this.initialized = false;
  }

  // Khởi tạo hệ thống - load dữ liệu
  async initialize() {
    if (this.initialized) return;

    console.log("🤖 Đang khởi tạo hệ thống đề xuất...");

    try {
      // Load dữ liệu products
      const productsResponse = await fetch("../data/products.json");
      this.products = await productsResponse.json();

      // Load dữ liệu reviews
      const reviewsResponse = await fetch("../data/reviews.json");
      this.reviews = await reviewsResponse.json();

      console.log(
        `✅ Đã tải: ${this.products.length} sản phẩm, ${this.reviews.length} reviews`
      );
      this.initialized = true;
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
    }
  }

  // Lấy thông tin sản phẩm theo ID
  getProductById(productId) {
    return this.products.find((p) => p.asin === productId);
  }

  // Content-Based Filtering - Dựa trên tiêu đề sản phẩm
  contentBasedRecommendations(productId, limit = 5) {
    const targetProduct = this.getProductById(productId);
    if (!targetProduct) return [];

    const targetTitle = targetProduct.title_clean.toLowerCase();
    const targetWords = targetTitle.split(" ");

    // Tính điểm tương đồng cho mỗi sản phẩm
    const scores = this.products
      .filter((p) => p.asin !== productId)
      .map((product) => {
        const productTitle = product.title_clean.toLowerCase();
        const productWords = productTitle.split(" ");

        // Đếm số từ chung
        const commonWords = targetWords.filter((word) =>
          productWords.includes(word)
        );

        const similarity =
          commonWords.length /
          Math.max(targetWords.length, productWords.length);

        return {
          product: product,
          score: similarity,
          reason: `Có ${commonWords.length} từ khóa chung: "${commonWords.join(
            ", "
          )}"`,
        };
      })
      .filter((item) => item.score > 0) // Lọc những cái có điểm > 0
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scores;
  }

  // Collaborative Filtering - Dựa trên hành vi người dùng
  collaborativeRecommendations(productId, limit = 5) {
    // Tìm các user đã đánh giá sản phẩm này
    const usersWhoRated = this.reviews
      .filter((r) => r.asin === productId && r.overall >= 4)
      .map((r) => r.reviewerID);

    if (usersWhoRated.length === 0) return [];

    // Tìm các sản phẩm khác mà những user này cũng thích
    const productScores = {};

    usersWhoRated.forEach((userId) => {
      const userReviews = this.reviews.filter((r) => r.reviewerID === userId);

      userReviews.forEach((review) => {
        if (review.asin !== productId && review.overall >= 4) {
          if (!productScores[review.asin]) {
            productScores[review.asin] = 0;
          }
          productScores[review.asin]++;
        }
      });
    });

    // Chuyển thành mảng và sắp xếp
    const recommendations = Object.entries(productScores)
      .map(([asin, score]) => {
        const product = this.getProductById(asin);
        if (!product) return null;

        return {
          product: product,
          score: score / usersWhoRated.length, // Chuẩn hóa điểm
          reason: `${score} người dùng thích ${targetProduct.title_clean.substring(
            0,
            30
          )}... cũng thích sản phẩm này`,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  // Hybrid System - Kết hợp cả hai phương pháp
  hybridRecommendations(productId, limit = 5) {
    const contentRecs = this.contentBasedRecommendations(productId, limit * 2);
    const collabRecs = this.collaborativeRecommendations(productId, limit * 2);

    // Kết hợp điểm số
    const combinedScores = {};

    // Thêm đề xuất từ Content-Based
    contentRecs.forEach((rec) => {
      combinedScores[rec.product.asin] = {
        product: rec.product,
        score: rec.score * 0.6, // Trọng số 60%
        reasons: [rec.reason],
      };
    });

    // Thêm đề xuất từ Collaborative
    collabRecs.forEach((rec) => {
      if (combinedScores[rec.product.asin]) {
        combinedScores[rec.product.asin].score += rec.score * 0.4; // Trọng số 40%
        combinedScores[rec.product.asin].reasons.push(rec.reason);
      } else {
        combinedScores[rec.product.asin] = {
          product: rec.product,
          score: rec.score * 0.4,
          reasons: [rec.reason],
        };
      }
    });

    // Sắp xếp và trả về kết quả
    return Object.values(combinedScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        product: item.product,
        score: item.score,
        reason: item.reasons.join(" | "),
      }));
  }

  // Lấy sản phẩm mẫu để hiển thị
  getSampleProducts(limit = 8) {
    return this.products.slice(0, limit).map((p) => ({
      id: p.asin,
      name:
        p.title_clean.length > 50
          ? p.title_clean.substring(0, 50) + "..."
          : p.title_clean,
    }));
  }

  // Main recommendation function
  async getRecommendations(productId, method = "hybrid", limit = 5) {
    await this.initialize();

    if (!this.getProductById(productId)) {
      throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
    }

    switch (method) {
      case "content":
        return this.contentBasedRecommendations(productId, limit);
      case "collaborative":
        return this.collaborativeRecommendations(productId, limit);
      case "hybrid":
      default:
        return this.hybridRecommendations(productId, limit);
    }
  }
}

// Tạo instance toàn cục
const recommendationEngine = new RecommendationEngine();

// Export cho browser
if (typeof window !== "undefined") {
  window.RecommendationEngine = recommendationEngine;
}
