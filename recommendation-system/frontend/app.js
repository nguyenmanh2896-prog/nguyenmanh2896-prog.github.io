// FRONTEND APPLICATION
class RecommendationApp {
  constructor() {
    this.engine = recommendationEngine;
    this.initializeApp();
  }

  async initializeApp() {
    console.log("🎯 Khởi tạo ứng dụng...");

    // Load sản phẩm mẫu
    await this.loadSampleProducts();

    // Gắn sự kiện cho form
    this.attachEventListeners();

    console.log("✅ Ứng dụng đã sẵn sàng!");
  }

  // Load sản phẩm mẫu lên giao diện
  async loadSampleProducts() {
    await this.engine.initialize();
    const samples = this.engine.getSampleProducts();

    const sampleContainer = document.getElementById("sample-products");
    sampleContainer.innerHTML = samples
      .map(
        (product) => `
            <div class="sample-product" onclick="app.selectSampleProduct('${product.id}')">
                <div class="product-id">${product.id}</div>
                <div class="product-name">${product.name}</div>
            </div>
        `
      )
      .join("");
  }

  // Gắn sự kiện
  attachEventListeners() {
    const form = document.getElementById("recommendation-form");
    form.addEventListener("submit", (e) => this.handleRecommendation(e));
  }

  // Chọn sản phẩm mẫu
  selectSampleProduct(productId) {
    document.getElementById("product-id").value = productId;
    this.getRecommendations();
  }

  // Xử lý đề xuất
  async handleRecommendation(event) {
    if (event) event.preventDefault();
    await this.getRecommendations();
  }

  // Lấy và hiển thị đề xuất
  async getRecommendations() {
    const productId = document.getElementById("product-id").value.trim();
    const method = document.getElementById("method").value;

    if (!productId) {
      alert("⚠️ Vui lòng nhập Product ID!");
      return;
    }

    // Hiển thị loading
    this.showLoading(true);

    try {
      // Lấy đề xuất
      const recommendations = await this.engine.getRecommendations(
        productId,
        method
      );

      // Hiển thị kết quả
      this.displayResults(productId, recommendations, method);
    } catch (error) {
      this.displayError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  // Hiển thị loading
  showLoading(show) {
    const loading = document.getElementById("loading");
    const btnText = document.querySelector(".btn-text");
    const btnLoading = document.querySelector(".btn-loading");

    if (show) {
      loading.style.display = "block";
      btnText.style.display = "none";
      btnLoading.style.display = "inline";
    } else {
      loading.style.display = "none";
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
    }
  }

  // Hiển thị kết quả
  displayResults(productId, recommendations, method) {
    const originalProduct = this.engine.getProductById(productId);

    if (!originalProduct) {
      this.displayError("Không tìm thấy sản phẩm!");
      return;
    }

    // Hiển thị sản phẩm gốc
    document.getElementById("original-product").innerHTML = `
            <h3>📦 Sản phẩm gốc:</h3>
            <p><strong>${originalProduct.title_clean}</strong></p>
            <p><small>ID: ${productId} | Phương pháp: ${this.getMethodName(
      method
    )}</small></p>
        `;

    // Hiển thị đề xuất
    const recommendationsHTML = recommendations
      .map(
        (rec, index) => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">
                        ${index + 1}. ${rec.product.title_clean}
                    </div>
                    <div class="recommendation-score">
                        ${(rec.score * 100).toFixed(1)}%
                    </div>
                </div>
                <div class="recommendation-reason">
                    📝 ${rec.reason}
                </div>
            </div>
        `
      )
      .join("");

    document.getElementById("recommendations-list").innerHTML =
      recommendationsHTML;

    // Hiển thị section kết quả
    document.getElementById("results-section").style.display = "block";

    // Scroll đến kết quả
    document.getElementById("results-section").scrollIntoView({
      behavior: "smooth",
    });
  }

  // Hiển thị lỗi
  displayError(message) {
    document.getElementById("results-section").style.display = "block";
    document.getElementById("original-product").innerHTML = "";
    document.getElementById("recommendations-list").innerHTML = `
            <div class="error-message">
                ❌ ${message}
            </div>
        `;
  }

  // Lấy tên phương pháp
  getMethodName(method) {
    const methods = {
      hybrid: "Hybrid (Tốt nhất)",
      content: "Content-Based",
      collaborative: "Collaborative",
    };
    return methods[method] || method;
  }
}

// Khởi tạo app khi trang load
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new RecommendationApp();
});
