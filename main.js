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
  scroll: {
    offscreenSpeed: 0.25 /* How fast the header moves offscreen */,
    onscreenSpeed: 0.5 /* How fast the header moves onscreen */,
    previousScroll: 0,
    currentTransform: 0,
  },
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
    backSwipeThreshold: 75 /* Pixels user swipes to close sub menu */,
  },
  signup: {
    cta: null,
    forms: [],
  },
  countrySelector: null,

  /**
   * Initialize the header
   */
  init() {
    this.element = document.querySelector(".global-header");

    // Assign mega menu elements
    this.megaMenu = {
      ...this.megaMenu,
      menuLinks: this.element.querySelectorAll("[data-open-menu]"),
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
      forms: this.element.querySelectorAll(".global-header__signup-form"),
    };

    // Assign country selector back buttons
    this.countrySelector = InlineCountrySelector.init(
      `[data-menu="country-selector"] .inline-country-selector`
    );
    console.log(this.countrySelector);
    this.countrySelector.wrapper = this.element.querySelector(
      `[data-menu="country-selector"]`
    );
    this.countrySelector.isOpen = false;
    this.countrySelector.previousMenu = {};

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

    // Initialize country selector
    this.initCountrySelector();
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
   * To fix scroll rubberbanding on iOS, we init the animation on first scroll
   * and then remove the event listener to prevent multiple calls
   */
  initScroll() {
    function updateHeaderTransform() {
      const { scrollY } = window;
      const headerHeight = this.element.offsetHeight;
      let { previousScroll, currentTransform, offscreenSpeed, onscreenSpeed } =
        this.scroll;

      if (this.getOpenMegaMenu() !== null || this.mobileMenu.isOpen) {
        requestAnimationFrame(updateHeaderTransform);
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
      requestAnimationFrame(updateHeaderTransform);
    }

    // Bind updateHeaderTransform to Header
    updateHeaderTransform = updateHeaderTransform.bind(this);

    function initAnimation() {
      this.scroll.previousScroll = window.scrollY;
      requestAnimationFrame(updateHeaderTransform);
      window.removeEventListener("scroll", initAnimation);
    }

    // Bind initAnimation to Header
    initAnimation = initAnimation.bind(this);

    window.addEventListener("scroll", initAnimation);
  },

  /**
   * Initialize the mega menu
   */
  initMegaMenu() {
    const { menuLinks, menuContentWrapper } = this.megaMenu;

    // Add megamenu link event listeners
    menuLinks.forEach((menuLink) => {
      const menuId = menuLink.getAttribute("data-open-menu");
      const menuContent = menuContentWrapper.querySelector(
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
    const { menuAction, subMenuLinks } = this.mobileMenu;

    // Add menuAction event listener
    menuAction.addEventListener("click", () => {
      const openSubMenu = this.getOpenMobileSubMenu();
      // If there is a sub menu open, the menuAction button should close it
      if (openSubMenu !== null) {
        this.closeMobileSubMenu(openSubMenu.link, openSubMenu.content);
        return;
      }

      // Else toggle the mobile menu
      this.toggleMobileMenu();
    });

    // Add subMenuLinks event listeners
    subMenuLinks.forEach((subMenuLink) => {
      const menuId = subMenuLink.getAttribute("data-open-mobile-menu");
      const menu = this.mobileMenu.menu.querySelector(
        `[data-mobile-menu="${menuId}"]`
      );

      // Open sub menu on click
      subMenuLink.addEventListener("click", () => {
        this.openMobileSubMenu(subMenuLink, menu);
      });

      // Handle back swipe on sub menu
      this.handleMobileSubMenuBackSwipe(menu);
    });
  },

  /**
   * Initialize the header signup
   */
  initHeaderSignup() {
    const { cta, forms } = this.signup;

    // When header cta is clicked, hide cta and show form
    cta.addEventListener("click", () => {
      cta.parentNode.style.display = "none";
      cta.parentNode.nextElementSibling.style.display = "block";
    });

    forms.forEach((form) => {
      const formId = form.getAttribute("data-form");
      const emailAddress = form.querySelector(`input[type="email"]`);
      const button = form.querySelector(`button[type="submit"]`);
      const inputWrapper = emailAddress.parentNode;
      const error = this.element.querySelector(`[data-form-error="${formId}"]`);

      emailAddress.addEventListener("input", () => {
        const value = emailAddress.value;

        if (value.length > 0) {
          inputWrapper.classList.add("has-value");
        } else {
          inputWrapper.classList.remove("has-value");
        }

        inputWrapper.classList.remove("has-error");
        error.style.display = "none";
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        // Prevent form change if form has submitted
        if (inputWrapper.classList.contains("has-success")) return;

        const email = emailAddress.value;

        // Validate email address
        const validEmail = email.match(
          /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        if (!validEmail) {
          inputWrapper.classList.add("has-error");
          error.style.display = "";
          return;
        }

        // Is valid email address
        inputWrapper.classList.add("has-success");
        emailAddress.disabled = true;
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-width="2" d="m2 7.41 4.235 4.09L14 4"/></svg>`;

        console.log("Submit form with email address: " + emailAddress.value);

        setTimeout(() => {
          // Reset form
          inputWrapper.classList.remove("has-success");
          emailAddress.disabled = false;
          button.innerHTML = "<span>Stay Notified</span>";
        }, 5000);
      });
    });
  },

  /**
   * Initialize country selector
   */
  initCountrySelector() {
    this.countrySelector.setBackButtonCallback((button) => {
      this.handleCountrySelectBack(button);
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

  /**
   * Update header height CSS variable
   */
  updateHeaderHeight() {
    // Calculate real header height
    const headerHeight = this.element.querySelector(
      ".global-header__wrapper"
    ).offsetHeight;
    this.element.style.setProperty(
      "--global-header-height",
      `${headerHeight}px`
    );
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
   * Update header megamenu height to current open menu
   */
  updateMegaMenuHeight() {
    const openMenu = this.getOpenMegaMenu();
    if (openMenu === null) return;

    const menuHeight = openMenu.content.offsetHeight;
    this.megaMenu.menuContentWrapper.style.height = `${menuHeight}px`;
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

    // If country selector, keep current menu link active
    if (menuContent === this.countrySelector.wrapper) {
      this.countrySelector.isOpen = true;
      this.countrySelector.previousMenu = openMenu;
      openMenu.link.classList.add("active");
    }

    // Assign new open menu
    this.megaMenu.openMenu = {
      link: menuLink,
      content: menuContent,
    };

    // Open the menu
    menuLink.classList.add("active");
    menuContent.classList.add("active");

    this.updateMegaMenuHeight();
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

    // If country selector has previous menu, close it
    const countrySelector = this.countrySelector;
    if (countrySelector.isOpen) {
      countrySelector.previousMenu.link.classList.remove("active");
      this.countrySelector.isOpen = false;
      this.countrySelector.previousMenu = {};
    }

    // Ensure header transform is reset
    this.resetHeaderTransform();

    menuLink.classList.remove("active");
    menuContent.classList.remove("active");
    this.element.classList.remove("mega-menu-active");

    // Reset wrapper height
    if (resetHeight) {
      this.megaMenu.menuContentWrapper.style.height = 0;

      document.dispatchEvent(new CustomEvent("megaMenuClosed"));
    }
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
  closeMobileSubMenu(subMenuLink, subMenuContent) {
    this.mobileMenu.openSubMenu = {};

    // Hide sub menu
    subMenuLink.classList.remove("active");
    subMenuContent.classList.remove("active");

    // Change menu action icon
    this.mobileMenu.menuAction.classList.remove("sub-menu-active");

    // Fade in initial menu
    this.mobileMenu.initialMenu.classList.toggle("hidden");
  },

  /**
   * Handle back swipes on mobile sub menus
   * @param {HTMLDivElement} menu
   */
  handleMobileSubMenuBackSwipe(menu) {
    const { backSwipeThreshold } = this.mobileMenu;
    let touchstartX = 0,
      touchendX = 0;

    // Add back swipe event listener to close sub menus
    menu.addEventListener("touchstart", (event) => {
      touchstartX = event.changedTouches[0].screenX;
    });

    menu.addEventListener("touchend", (event) => {
      touchendX = event.changedTouches[0].screenX;

      // Calculate the distance swiped
      const distanceSwiped = touchendX - touchstartX;

      // If direction is left to right and the distance swiped is greater than the threshold, close sub menu
      if (distanceSwiped > backSwipeThreshold) {
        const openSubMenu = this.getOpenMobileSubMenu();
        this.closeMobileSubMenu(openSubMenu.link, openSubMenu.content);
      }

      touchstartX = 0;
      touchendX = 0;
    });
  },

  /**
   * Handle country select back
   */
  handleCountrySelectBack() {
    const { previousMenu } = this.countrySelector;
    const openMenu = this.getOpenMegaMenu();

    // Close country selector
    this.closeMegaMenu(openMenu.link, openMenu.content);

    // Open previous menu
    this.openMegaMenu(previousMenu.link, previousMenu.content);

    this.countrySelector.isOpen = false;
    this.countrySelector.previousMenu = {};
  },
};

const InlineCountrySelector = {
  element: null,
  backButton: null,
  backButtonCallback: null,
  saveButton: null,
  originallySelected: {},
  selected: {},
  sites: [],
  currencies: [],

  /**
   * Pass a selector to initialize the magnetic buttons
   * @param {HTMLDivElement} selector
   */
  init(selector) {
    this.element = document.querySelector(selector);
    this.backButton = this.element.querySelector(
      `[data-country-selector="back"]`
    );
    this.saveButton = this.element.querySelector(
      `[data-country-selector="save"]`
    );

    // Load sites and currencies
    this.loadSites();
    this.loadCurrencies();

    // Add event listeners
    this.addEventListeners();

    // Set initial selected site and currency
    const initialSite = getCookie("site") || "UK",
      initialCurrency = getCookie("currency") || "GBP";

    // Set selected site and currency
    this.originallySelected = {
      site: initialSite,
      currency: initialCurrency,
    };
    this.setSelectedSite(initialSite);
    this.setSelectedCurrency(initialCurrency);

    return this;
  },

  /**
   * Create sites array of objects
   */
  loadSites() {
    const siteElements = this.element.querySelectorAll(
      "[data-country-selector-site]"
    );

    const sites = Array.from(siteElements).map((site) => {
      const id = site.getAttribute("data-country-selector-site");
      const availableCurrencies = site
        .getAttribute("data-country-selector-currencies")
        .split(", ");

      return {
        id,
        element: site,
        availableCurrencies,
      };
    });

    this.sites = sites;
  },

  /**
   * Create currencies array of objects
   */
  loadCurrencies() {
    const currencyElements = this.element.querySelectorAll(
      "[data-country-selector-currency]"
    );

    const currencies = Array.from(currencyElements).map((currency) => {
      const id = currency.getAttribute("data-country-selector-currency");

      return {
        id,
        element: currency,
      };
    });

    this.currencies = currencies;
  },

  /**
   * Add event listeners
   */
  addEventListeners() {
    function revertSelections() {
      this.setSelectedSite(this.originallySelected.site);
      this.setSelectedCurrency(this.originallySelected.currency);
    }

    // Add event listener to back button
    this.backButton.addEventListener("click", revertSelections.bind(this));

    // Ensure back button callback is called when button is clicked
    this.backButton.addEventListener("click", () => {
      if (this.backButtonCallback) {
        this.backButtonCallback();
      }
    });

    // Add event listener to mega menu close
    document.addEventListener("megaMenuClosed", revertSelections.bind(this));

    // Add event listener to save button
    this.saveButton.addEventListener("click", () => {
      // Set site & currency cookie to selected currency (14 days for testing)
      setCookie("site", this.selected.site, 14);
      setCookie("currency", this.selected.currency, 14);
      window.location.reload();
    });

    // Add event listener to site buttons
    this.sites.forEach((site) => {
      site.element.addEventListener("click", () => {
        this.setSelectedSite(site.id);

        /**
         * If current select currency is not available for the new site,
         * set selected currency to the first available currency in the new site
         */
        if (!site.availableCurrencies.includes(this.selected.currency)) {
          this.setSelectedCurrency(site.availableCurrencies[0]);
        }
      });
    });

    // Add event listener to currency buttons
    this.currencies.forEach((currency) => {
      currency.element.addEventListener("click", () => {
        this.setSelectedCurrency(currency.id);
      });
    });

    if (Header && Header.element) {
      Header.element.addEventListener("countrySelectorBack", () => {
        this.setSelectedSite(this.originallySelected.site);
        this.setSelectedCurrency(this.originallySelected.currency);
      });
    }
  },

  /**
   * Get selected site object
   * @returns {Object} The selected site object
   */
  getSelectedSite() {
    return this.sites.find((site) => site.id === this.selected.site);
  },

  /**
   * Set selected site
   */
  setSelectedSite(site) {
    this.selected.site = site;
    const siteObject = this.getSelectedSite();

    // Hide currencies that are not available for the selected site
    this.currencies.forEach((currency) => {
      if (siteObject.availableCurrencies.includes(currency.id)) {
        currency.element.style.display = "";
      } else {
        currency.element.style.display = "none";
      }
    });

    if (Header && Header.updateMegaMenuHeight) {
      Header.updateMegaMenuHeight();
    }

    // Remove active class from all sites
    this.sites.forEach((site) => {
      site.element.classList.remove("active");
    });

    // Set new site to active
    siteObject.element.classList.add("active");
  },

  /**
   * Get selected currency object
   * @returns {Object} The selected currency object
   */
  getSelectedCurrency() {
    return this.currencies.find(
      (currency) => currency.id === this.selected.currency
    );
  },

  /**
   * Set selected currency
   */
  setSelectedCurrency(currency) {
    const siteObject = this.getSelectedSite();
    if (!siteObject.availableCurrencies.includes(currency)) {
      console.error("Currency not available for this site");
      return;
    }

    this.selected.currency = currency;
    const currencyObject = this.getSelectedCurrency();

    // Remove active class from all currencies
    this.currencies.forEach((currency) => {
      currency.element.classList.remove("active");
    });

    // Set new currency to active
    currencyObject.element.classList.add("active");
  },

  /**
   * Set back button callback function
   */
  setBackButtonCallback(callback) {
    this.backButtonCallback = callback;
  },
};

const MobileCountrySelector = {};

/* Util function */
window.setCookie = function (name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
};

window.getCookie = function (name) {
  var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
};

MagneticButtons.init(".magnetic-button");
Header.init();
