const SUPABASE_URL = "https://dhcpgjexxodqwlktuwlg.supabase.co";
const SUPABASE_KEY = "sb_publishable_o6ZOZV8KktcjJei9eApATQ_l_YhyFsX";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const intro = document.getElementById("intro");
const ratingScreen = document.getElementById("ratingScreen");
const thanksScreen = document.getElementById("thanksScreen");
const reviewsScreen = document.getElementById("reviewsScreen");
const stars = [...document.querySelectorAll(".star")];
const ratingLabel = document.getElementById("ratingLabel");
const ratingHint = document.getElementById("ratingHint");
const comment = document.getElementById("comment");
const charCount = document.getElementById("charCount");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const resetBtn = document.getElementById("resetBtn");
const viewReviewsBtn = document.getElementById("viewReviewsBtn");
const backToRatingBtn = document.getElementById("backToRatingBtn");
const rateFromReviewsBtn = document.getElementById("rateFromReviewsBtn");
const thanksTitle = document.getElementById("thanksTitle");
const thanksText = document.getElementById("thanksText");
const formMessage = document.getElementById("formMessage");
const openReviewsBtn = document.getElementById("openReviewsBtn");
const averageRating = document.getElementById("averageRating");
const averageStars = document.getElementById("averageStars");
const totalReviews = document.getElementById("totalReviews");
const reviewsGrid = document.getElementById("reviewsGrid");
const showMoreReviews = document.getElementById("showMoreReviews");

let rating = 0;
let sending = false;
let publicReviews = [];
let visibleReviewCount = 6;


function starsText(value) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function formatReviewDate(value) {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function renderPublicReviews() {
  reviewsGrid.innerHTML = "";

  if (!publicReviews.length) {
    reviewsGrid.innerHTML = `
      <div class="reviews-empty">
        Todavía no hay comentarios publicados. Sé de los primeros en compartir tu experiencia 💙
      </div>
    `;
    showMoreReviews.hidden = true;
    return;
  }

  publicReviews.slice(0, visibleReviewCount).forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent = starsText(review.rating);

    const text = document.createElement("p");
    text.className = "review-comment";
    text.textContent = `“${review.comment}”`;

    const meta = document.createElement("div");
    meta.className = "review-meta";

    const user = document.createElement("span");
    user.className = "review-user";
    user.textContent = "Usuario anónimo";

    const date = document.createElement("span");
    date.textContent = formatReviewDate(review.created_at);

    meta.append(user, date);
    card.append(stars, text, meta);
    reviewsGrid.appendChild(card);
  });

  showMoreReviews.hidden = visibleReviewCount >= publicReviews.length;
}

async function loadReviewSummary() {
  try {
    const { data, error } = await supabaseClient.rpc("get_review_summary");
    if (error) throw error;

    const summary = Array.isArray(data) ? data[0] : data;
    const average = Number(summary?.average_rating || 0);
    const total = Number(summary?.total_reviews || 0);

    averageRating.textContent = total ? average.toFixed(1) : "—";
    averageStars.textContent = total ? starsText(average) : "☆☆☆☆☆";
    totalReviews.textContent = total === 1 ? "1 opinión" : `${total} opiniones`;
  } catch (error) {
    console.error("No se pudo cargar el resumen:", error);
    averageRating.textContent = "—";
    averageStars.textContent = "☆☆☆☆☆";
    totalReviews.textContent = "Opiniones";
  }
}

async function loadPublicReviews() {
  try {
    const { data, error } = await supabaseClient
      .from("service_reviews")
      .select("rating, comment, created_at")
      .eq("approved", true)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    publicReviews = (data || []).filter(
      (review) => typeof review.comment === "string" && review.comment.trim()
    );
    visibleReviewCount = 6;
    renderPublicReviews();
  } catch (error) {
    console.error("No se pudieron cargar las reseñas:", error);
    reviewsGrid.innerHTML = `
      <div class="reviews-empty">
        No pudimos cargar las opiniones en este momento.
      </div>
    `;
    showMoreReviews.hidden = true;
  }
}

async function refreshReviewSection() {
  await Promise.all([loadReviewSummary(), loadPublicReviews()]);
}

showMoreReviews.addEventListener("click", () => {
  visibleReviewCount += 6;
  renderPublicReviews();
});

window.addEventListener("load", () => {
  refreshReviewSection();
  window.setTimeout(() => {
    intro.classList.add("exit-up");
    window.setTimeout(() => {
      intro.classList.remove("active", "exit-up");
      ratingScreen.classList.add("active");
    }, 460);
  }, 1500);
});

function paintStars(value, temporary = false) {
  stars.forEach((star) => {
    const starValue = Number(star.dataset.value);
    star.classList.toggle(temporary ? "hovered" : "selected", starValue <= value);
    if (!temporary) star.classList.remove("hovered");
  });
}

function updateRatingCopy(value) {
  const messages = {
    1: ["Lamentamos que no haya sido lo esperado", "Gracias por contárnoslo. Tu opinión nos ayuda a mejorar."],
    2: ["Podemos hacerlo mejor", "Gracias por ayudarnos a identificar qué podemos mejorar."],
    3: ["Gracias por tu opinión", "Seguiremos trabajando para ofrecerte una mejor experiencia."],
    4: ["¡Nos alegra que te haya ido bien!", "Gracias por confiar en nosotros."],
    5: ["¡Qué alegría saberlo! ✨", "Muchas gracias por tu excelente calificación."]
  };
  const [title, hint] = messages[value];
  ratingLabel.textContent = title;
  ratingHint.textContent = hint;
}

stars.forEach((star) => {
  const value = Number(star.dataset.value);
  star.addEventListener("mouseenter", () => paintStars(value, true));
  star.addEventListener("mouseleave", () => paintStars(rating, false));
  star.addEventListener("click", () => {
    rating = value;
    paintStars(rating, false);
    updateRatingCopy(rating);
    submitBtn.disabled = false;
    formMessage.textContent = "";
    star.classList.remove("pop");
    void star.offsetWidth;
    star.classList.add("pop");
  });
});

comment.addEventListener("input", () => {
  charCount.textContent = `${comment.value.length}/600`;
});


openReviewsBtn.addEventListener("click", async () => {
  await refreshReviewSection();
  ratingScreen.classList.add("fade-out");

  window.setTimeout(() => {
    ratingScreen.classList.remove("active", "fade-out");
    reviewsScreen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 420);
});

submitBtn.addEventListener("click", async () => {
  if (!rating || sending) return;

  sending = true;
  submitBtn.disabled = true;
  submitText.textContent = "Enviando...";
  formMessage.textContent = "";

  const cleanComment = comment.value.trim();

  try {
    const insertRequest = supabaseClient
      .from("service_reviews")
      .insert({
        rating: rating,
        comment: cleanComment || null
      });

    const result = await Promise.race([
      insertRequest,
      new Promise((_, reject) =>
        window.setTimeout(
          () => reject(new Error("Tiempo de espera agotado")),
          12000
        )
      )
    ]);

    if (result.error) throw result.error;

    loadReviewSummary().catch(() => {});

    if (rating >= 5) {
      thanksTitle.textContent = "¡Muchas gracias! 💙";
      thanksText.textContent = "Nos alegra muchísimo saber que tu experiencia fue excelente.";
    } else if (rating >= 3) {
      thanksTitle.textContent = "¡Gracias por tu opinión!";
      thanksText.textContent = "Tu respuesta nos ayuda a seguir mejorando cada día.";
    } else {
      thanksTitle.textContent = "Gracias por contarnos 💙";
      thanksText.textContent = "Tomamos en serio tu opinión y queremos seguir mejorando.";
    }

    ratingScreen.classList.add("fade-out");
    window.setTimeout(() => {
      ratingScreen.classList.remove("active", "fade-out");
      thanksScreen.classList.add("active");
      sending = false;
    }, 420);

  } catch (error) {
    console.error(error);
    formMessage.textContent = "No pudimos enviar tu respuesta. Intenta nuevamente.";
    submitText.textContent = "Enviar calificación";
    submitBtn.disabled = false;
    sending = false;
  }
});


viewReviewsBtn.addEventListener("click", async () => {
  thanksScreen.classList.add("fade-out");
  await refreshReviewSection();

  window.setTimeout(() => {
    thanksScreen.classList.remove("active", "fade-out");
    reviewsScreen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 420);
});

function openRatingFromReviews() {
  reviewsScreen.classList.add("fade-out");
  window.setTimeout(() => {
    reviewsScreen.classList.remove("active", "fade-out");
    ratingScreen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 420);
}

backToRatingBtn.addEventListener("click", openRatingFromReviews);
rateFromReviewsBtn.addEventListener("click", openRatingFromReviews);

resetBtn.addEventListener("click", () => {
  rating = 0;
  comment.value = "";
  charCount.textContent = "0/600";
  ratingLabel.textContent = "Toca una estrella";
  ratingHint.textContent = "Queremos conocer tu opinión.";
  formMessage.textContent = "";
  submitText.textContent = "Enviar calificación";
  submitBtn.disabled = true;
  paintStars(0, false);

  thanksScreen.classList.add("fade-out");
  window.setTimeout(() => {
    thanksScreen.classList.remove("active", "fade-out");
    ratingScreen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 420);
});
