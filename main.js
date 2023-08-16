gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll(".collection__card").forEach((card, index) => {
  const cardSwiper = card.querySelector(".collection__card-swiper");
  const swiper = new Swiper(cardSwiper, {
    loop: true,
    slidesPerView: 1,
    pagination: {
      el: card.querySelector(".collection__card__navigation-dots"),
      bulletClass: "collection__card__navigation-dot",
      bulletActiveClass: "active",
      clickable: true,
    },
    on: {
      init:
        index === 0 &&
        function (swiper) {
          const wrapper = swiper.wrapperEl;
          const delay = 600;
          const duration = 500;
          swiper.enabled = false;

          var video = wrapper.querySelector("video");
          if (video) {
            // Wait for video to load
            video.addEventListener("loadeddata", async () => {
              // Add additonal delay
              await new Promise((resolve) => setTimeout(resolve, delay));

              // Get current transform
              const currentTransformX = wrapper.style.transform.match(
                /translate3d\((?<x>[-\d]+)px/
              ).groups.x;

              // Move transform 100px
              wrapper.style.transitionDuration = `${duration}ms`;
              wrapper.style.transform = `translate3d(${
                currentTransformX - 100
              }px, 0px, 0px)`;

              // Wait for transition to finish
              await new Promise((resolve) =>
                setTimeout(resolve, duration * 1.25)
              );

              // Reset transform
              wrapper.style.transform = `translate3d(${currentTransformX}px, 0px, 0px)`;
              await new Promise((resolve) => setTimeout(resolve, duration));
              wrapper.style.transitionDuration = "0ms";

              swiper.enabled = true;
            });
          }
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
      start: `top+=25% top`,
      end: `bottom+=25% top`,
      scrub: true,
    },
  });
}
