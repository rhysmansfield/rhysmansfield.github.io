gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll(".collection__card").forEach((card) => {
  const cardSwiper = card.querySelector(".collection__card-swiper");
  const swiper = new Swiper(cardSwiper, {
    slidesPerView: 1,
    loop: true,
    pagination: {
      el: card.querySelector(".collection__card__navigation-dots"),
      bulletClass: "collection__card__navigation-dot",
      bulletActiveClass: "active",
      clickable: true,
    },
  });

  // Use custom navigation buttons
  card
    .querySelector(".collection__card__navigation-next")
    .addEventListener("click", () => {
      swiper.slideNext();
    });

  card
    .querySelector(".collection__card__navigation-prev")
    .addEventListener("click", () => {
      swiper.slidePrev();
    });
});

const header = document.querySelector(".collection__header");
if (window.innerWidth >= 768) {
  gsap.to(header, {
    opacity: 0,
    scrollTrigger: {
      trigger: header,
      start: `bottom+=75% center`,
      end: `bottom+=150% center`,
      scrub: true,
    },
  });
}
