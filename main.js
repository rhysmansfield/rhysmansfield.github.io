gsap.registerPlugin(ScrollTrigger);

new Swiper(".collection__card-swiper", {
  slidesPerView: 1,
  loop: true,
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
