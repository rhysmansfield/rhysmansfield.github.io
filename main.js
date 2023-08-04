const MagneticButtons = {
  elements: null,

  /**
   * Pass a selector to initialize the magnetic buttons
   * @param {HTMLElementTagNameMap} selector
   */
  init(selector) {
    this.elements = document.querySelectorAll(selector);

    // Attach event listeners
    this.elements.forEach((element) => {
      element.addEventListener("mousemove", (event) =>
        this.magnetize(event, element)
      );
      element.addEventListener("mouseleave", () => this.detach(element));
    });
  },

  /**
   * Magnetize the button to the mouse position
   * @param {Event} event
   * @param {HTMLButtonElement} button
   */
  magnetize(event, button) {
    const { target } = event;

    const targetTop = target.getBoundingClientRect().top;
    const targetLeft = target.getBoundingClientRect().left;

    const mouseX = event.clientX - targetLeft;
    const mouseY =
      (event.clientY - targetTop) / button.children[0].offsetHeight;

    gsap.to(button, {
      x: ((mouseX - target.offsetWidth / 2) / target.offsetWidth) * 25,
      y: (mouseY - 0.5) * 6,
      ease: "Power3.inOut",
      duration: 0.3,
    });
  },

  /**
   * Detach the button from the mouse position
   * @param {HTMLButtonElement} button
   */
  detach(button) {
    gsap.to(button, {
      x: 0,
      y: 0,
      ease: "Power3.inOut",
      duration: 0.3,
    });
  },
};

const Header = {
  element: null,
  megaMenu: {
    openMenu: {},
    menuLinks: [],
    menuContentWrapper: null,
  },
  mobileMenu: {
    isOpen: false,
    menuAction: null,
    menu: null,
    initialMenu: null,
    subMenuLinks: [],
    openSubMenu: {},
  },
  signup: {
    isOpen: false,
    cta: null,
    form: null,
  },
  scroll: {
    offscreenSpeed: 0.25 /* How fast the header moves offscreen */,
    onscreenSpeed: 0.5 /* How fast the header moves onscreen */,
    previousScroll: 0,
    currentTransform: 0,
  },

  /**
   * Initialize the header
   */
  init() {
    this.element = document.querySelector(".global-header");

    // Assign mega menu elements
    this.megaMenu = {
      ...this.megaMenu,
      menuLinks: this.element.querySelectorAll(
        ".global-header__menu [data-open-menu]"
      ),
      menuContentWrapper: this.element.querySelector(
        ".global-header__mega-menu"
      ),
    };

    // Assign mobile menu elements
    this.mobileMenu = {
      ...this.mobileMenu,
      menuAction: this.element.querySelector(
        ".global-header__action-mobile-menu"
      ),
      menu: this.element.querySelector(".global-header__mobile-menu"),
      initialMenu: this.element.querySelector(
        ".global-header__mobile-menu__wrapper [data-initial-menu]"
      ),
      subMenuLinks: this.element.querySelectorAll(
        ".global-header__mobile-menu [data-open-mobile-menu]"
      ),
    };

    // Assign signup flow elements
    this.signup = {
      ...this.signup,
      cta: this.element.querySelector(".global-header__signup-cta"),
      form: this.element.querySelector(".global-header__signup-form"),
    };

    // Init height calculation functionality
    this.initHeight();

    // Initialize scroll functionality
    this.initScroll();

    // Initialize mega menu
    this.initMegaMenu();

    // Initialize mobile menu
    this.initMobileMenu();

    // Initialize header signup
    this.initHeaderSignup();
  },

  /**
   * Initialize the height calculation functionality
   */
  initHeight() {
    // Update header height initially & on resize
    window.addEventListener("resize", this.updateHeaderHeight.bind(this));
    this.updateHeaderHeight();
  },

  /**
   * Initialize the scroll functionality
   */
  initScroll() {
    function updateHeaderTransform() {
      const { scrollY } = window;
      const headerHeight = this.element.offsetHeight;
      let { previousScroll, currentTransform, offscreenSpeed, onscreenSpeed } =
        this.scroll;

      if (this.getOpenMegaMenu() !== null || this.mobileMenu.isOpen) {
        requestAnimationFrame(updateHeaderTransform.bind(this));
        return;
      }

      if (scrollY > previousScroll) {
        // Scrolling down
        currentTransform -= (scrollY - previousScroll) * offscreenSpeed;
        previousScroll = scrollY;
      } else {
        currentTransform += (previousScroll - scrollY) * onscreenSpeed;
        previousScroll = scrollY;
      }

      // Ensure current transform doesnt exceed header height either way
      if (currentTransform > 0) currentTransform = 0;
      if (currentTransform < -headerHeight) currentTransform = -headerHeight;

      this.element.style.transform = `translateY(${currentTransform}px)`;
      this.scroll.currentTransform = currentTransform;
      this.scroll.previousScroll = previousScroll;
      requestAnimationFrame(updateHeaderTransform.bind(this));
    }

    this.scroll.previousScroll = window.scrollY;
    requestAnimationFrame(updateHeaderTransform.bind(this));
  },

  /**
   * Initialize the mega menu
   */
  initMegaMenu() {
    // Add megamenu link event listeners
    this.megaMenu.menuLinks.forEach((menuLink) => {
      const menuId = menuLink.getAttribute("data-open-menu");
      const menuContent = this.megaMenu.menuContentWrapper.querySelector(
        `[data-menu="${menuId}"]`
      );

      menuLink.addEventListener("click", (event) => {
        // If no mega menu do nothing
        if (!menuContent) return;

        // Get open menu
        const openMenu = this.getOpenMegaMenu();
        const { target } = event;

        // If open menu link is clicked
        if (openMenu !== null && openMenu.link === menuLink) {
          // If a has href, go to href
          if (target.hasAttribute("href")) return;

          // Else, close mega menu
          this.closeMegaMenu(menuLink, menuContent);
          return;
        }

        // Else, prevent href click and open mega menu
        event.preventDefault();
        this.openMegaMenu(menuLink, menuContent);
      });
    });

    // Add close mega menu event listener
    document.addEventListener("click", (event) => {
      // Only close if there is a menu open
      const openMenu = this.getOpenMegaMenu();
      if (openMenu === null) return;

      // Close mega menu if click is outside of the menu items/mega menu
      const { target } = event;
      if (
        target.closest(".global-header__mega-menu") ||
        target.closest(".global-header__menu [data-open-menu]")
      )
        return;

      this.closeMegaMenu(openMenu.link, openMenu.content);
    });
  },

  /**
   * Initialize the mobile menu
   */
  initMobileMenu() {
    // Add menuAction event listener
    this.mobileMenu.menuAction.addEventListener("click", () => {
      // If there is a sub menu open, the menuAction button should close it
      if (this.getOpenMobileSubMenu() !== null) {
        this.closeOpenMobileSubMenu();
        return;
      }

      // Else toggle the mobile menu
      this.toggleMobileMenu();
    });

    this.mobileMenu.subMenuLinks.forEach((subMenuLink) => {
      const menuId = subMenuLink.getAttribute("data-open-mobile-menu");
      const menu = this.mobileMenu.menu.querySelector(
        `[data-mobile-menu="${menuId}"]`
      );

      subMenuLink.addEventListener("click", () => {
        this.openMobileSubMenu(subMenuLink, menu);
      });
    });
  },

  /**
   * Initialize the header signup
   */
  initHeaderSignup() {
    // When header cta is clicked, hide cta and show form
    this.signup.cta.addEventListener("click", () => {
      this.signup.cta.parentNode.style.display = "none";
      this.signup.form.style.display = "";
    });
  },

  /**
   * Reset header transform
   */
  resetHeaderTransform() {
    this.element.style.transform = "";
    this.scroll.currentTransform = 0;
    this.scroll.previousScroll = window.scrollY;
  },

  updateHeaderHeight() {
    // Calculate real header height
    this.element.style.height = "auto";
    const headerHeight = this.element.querySelector(
      ".global-header__wrapper"
    ).offsetHeight;
    this.element.style.setProperty(
      "--global-header-height",
      `${headerHeight}px`
    );
    this.element.style.height = "";
  },

  /**
   * Get the currently open mega menu
   * @returns {Object|null} The open mega menu object, or null if none
   */
  getOpenMegaMenu() {
    return Object.keys(this.megaMenu.openMenu).length === 0
      ? null
      : this.megaMenu.openMenu;
  },

  /**
   * Open a mega menu
   * @param {HTMLAnchorElement} menuLink
   * @param {HTMLDivElement} menuContent
   */
  openMegaMenu(menuLink, menuContent) {
    // If a menu is already open, close it
    const openMenu = this.getOpenMegaMenu();
    if (openMenu !== null) {
      this.closeMegaMenu(openMenu.link, openMenu.content, false);
    }

    // Ensure header transform is reset
    this.resetHeaderTransform();

    // Assign new open menu
    this.megaMenu.openMenu = {
      link: menuLink,
      content: menuContent,
    };

    // Open the menu
    menuLink.classList.add("active");
    menuContent.classList.add("active");
    this.megaMenu.menuContentWrapper.style.height = `${menuContent.offsetHeight}px`;
    this.element.classList.add("mega-menu-active");
  },

  /**
   * Close a mega menu
   * @param {HTMLAnchorElement} menuLink
   * @param {HTMLDivElement} menuContent
   * @param {Boolean} resetHeight - Whether to reset the wrapper height
   */
  closeMegaMenu(menuLink, menuContent, resetHeight = true) {
    // Reset open menu
    this.megaMenu.openMenu = {};

    // Ensure header transform is reset
    this.resetHeaderTransform();

    menuLink.classList.remove("active");
    menuContent.classList.remove("active");
    this.element.classList.remove("mega-menu-active");

    // Reset wrapper height
    if (resetHeight) this.megaMenu.menuContentWrapper.style.height = 0;
  },

  /**
   * Get the currently open mega menu
   * @returns {Object|null} The open mega menu object, or null if none
   */
  getOpenMobileSubMenu() {
    return Object.keys(this.mobileMenu.openSubMenu).length === 0
      ? null
      : this.mobileMenu.openSubMenu;
  },

  /**
   * Toggle the mobile menu
   */
  toggleMobileMenu() {
    // Ensure header transform is reset
    this.resetHeaderTransform();

    this.mobileMenu.isOpen = !this.mobileMenu.isOpen;

    this.mobileMenu.menuAction.classList.toggle("active");
    this.mobileMenu.menu.classList.toggle("active");
    this.element.classList.toggle("mobile-menu-active");
  },

  /**
   * Open a mobile sub menu
   * @param {HTMLAnchorElement} subMenuLink
   * @param {HTMLDivElement} subMenuContent
   */
  openMobileSubMenu(subMenuLink, subMenuContent) {
    // Assign new open sub menu
    this.mobileMenu.openSubMenu = {
      link: subMenuLink,
      content: subMenuContent,
    };

    // Fade out initial menu
    this.mobileMenu.initialMenu.classList.toggle("hidden");

    // Change menu action icon
    this.mobileMenu.menuAction.classList.add("sub-menu-active");

    // Show sub menu
    subMenuLink.classList.toggle("active");
    subMenuContent.classList.toggle("active");
  },

  /**
   * Close the opened mobile sub menu
   */
  closeOpenMobileSubMenu() {
    const { openSubMenu } = this.mobileMenu;
    this.mobileMenu.openSubMenu = {};

    // Hide sub menu
    openSubMenu.link.classList.remove("active");
    openSubMenu.content.classList.remove("active");

    // Change menu action icon
    this.mobileMenu.menuAction.classList.remove("sub-menu-active");

    // Fade in initial menu
    this.mobileMenu.initialMenu.classList.toggle("hidden");
  },
};

Header.init();
MagneticButtons.init(".magnetic-button");
