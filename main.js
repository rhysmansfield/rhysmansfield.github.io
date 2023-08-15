gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll(".collection__card").forEach((card) => {
  const cardSwiper = card.querySelector(".collection__card-swiper");
  const swiper = new Swiper(cardSwiper, {
    initialSlide: 0,
    slidesPerView: 1,
    loop: true,
    pagination: {
      el: card.querySelector(".collection__card__navigation-dots"),
      bulletClass: "collection__card__navigation-dot",
      bulletActiveClass: "active",
      clickable: true,
    },
    on: {
      init: async function (swiper) {
        const wrapper = swiper.wrapperEl;
        const duration = 500;
        wrapper.style.transform = "translate3d(0px, 0px, 0px)";
        swiper.enabled = false;

        var observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach(async (entry) => {
              if (!entry.isIntersecting) return;

              wrapper.style.transitionDuration = `${duration}ms`;
              wrapper.style.transform = "translate3d(-100px, 0px, 0px)";
              await new Promise((resolve) =>
                setTimeout(resolve, duration * 1.25)
              );
              wrapper.style.transform = "translate3d(0px, 0px, 0px)";
              await new Promise((resolve) => setTimeout(resolve, duration));
              wrapper.style.transitionDuration = "0ms";

              // Enable interaction
              swiper.enabled = true;
              swiper.update();

              // Remove observer
              observer.unobserve(entry.target);
            });
          },
          {
            root: null,
            threshold: 0,
            rootMargin: "0px 0px -50% 0px",
          }
        );

        observer.observe(wrapper);
      },
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
