(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var root = document.documentElement;

  root.classList.add("js-enhanced");
  requestAnimationFrame(function () { document.body.classList.add("page-ready"); });

  document.querySelectorAll(".page-intro-grid, .grid, .list, .event-list, .image-grid, .artwork-grid, .event-item").forEach(function (item) {
    item.setAttribute("data-enhance-reveal", "");
  });
  document.querySelectorAll(".artwork-card img, .image-card img").forEach(function (image) {
    image.loading = "lazy";
    image.decoding = "async";
  });

  function localLink(link) {
    var href = link.getAttribute("href");
    return href && !href.startsWith("#") && !href.startsWith("http") && !href.startsWith("mailto:") && !link.hasAttribute("download");
  }

  if (!reduceMotion) {
    document.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (!localLink(link) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        document.body.classList.add("page-leaving");
        setTimeout(function () { window.location.href = link.href; }, 420);
      });
    });
  }

  var revealItems = document.querySelectorAll("[data-enhance-reveal]");
  if (revealItems.length && !reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-enhanced-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-enhanced-visible"); });
  }

  if (!reduceMotion && !coarsePointer) {
    document.querySelectorAll("[data-magnetic], .back").forEach(function (button) {
      button.addEventListener("pointermove", function (event) {
        var rect = button.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        var y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        button.style.transform = "translate(" + x + "px," + y + "px)";
      });
      button.addEventListener("pointerleave", function () {
        button.style.transform = "translate(0,0)";
      });
    });
  }

  var cursorRing = document.querySelector(".cursor-ring");
  var cursorDot = document.querySelector(".cursor-dot");
  if (finePointer && !cursorRing) {
    cursorDot = document.createElement("span");
    cursorDot.className = "cursor-dot enhanced-cursor-dot";
    cursorRing = document.createElement("span");
    cursorRing.className = "cursor-ring enhanced-cursor-ring";
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);
    var cursorX = 0;
    var cursorY = 0;
    var ringX = 0;
    var ringY = 0;
    document.addEventListener("pointermove", function (event) {
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursorDot.style.transform = "translate(" + cursorX + "px," + cursorY + "px) translate(-50%,-50%)";
    });
    function cursorFrame() {
      ringX += (cursorX - ringX) * 0.16;
      ringY += (cursorY - ringY) * 0.16;
      cursorRing.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
      requestAnimationFrame(cursorFrame);
    }
    cursorFrame();
  }

  if (finePointer && cursorRing) {
    document.querySelectorAll("a, button, [data-magnetic], .event-item, .image-card, .artwork-card").forEach(function (element) {
      element.addEventListener("mouseenter", function () { cursorRing.classList.add("is-active"); });
      element.addEventListener("mouseleave", function () { cursorRing.classList.remove("is-active", "is-view"); });
    });
    document.querySelectorAll(".image-card, .artwork-card").forEach(function (element) {
      element.addEventListener("mouseenter", function () { cursorRing.classList.add("is-view"); });
    });
  }

  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".artwork-card, .image-card"));
  var lightbox;
  var lightboxImage;
  var lightboxTitle;
  var activeIndex = 0;
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.close();
  }
  function showLightbox(index) {
    if (!galleryItems.length) return;
    activeIndex = (index + galleryItems.length) % galleryItems.length;
    var image = galleryItems[activeIndex].querySelector("img");
    if (!image) return;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxTitle.textContent = image.alt || "DesignX artwork";
    if (!lightbox.open) lightbox.showModal();
  }
  if (galleryItems.length) {
    lightbox = document.createElement("dialog");
    lightbox.className = "artwork-lightbox";
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close artwork viewer">Close</button><button class="lightbox-prev" type="button" aria-label="Previous artwork">Prev</button><figure><img alt=""><figcaption></figcaption></figure><button class="lightbox-next" type="button" aria-label="Next artwork">Next</button>';
    document.body.appendChild(lightbox);
    lightboxImage = lightbox.querySelector("img");
    lightboxTitle = lightbox.querySelector("figcaption");
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", function () { showLightbox(activeIndex - 1); });
    lightbox.querySelector(".lightbox-next").addEventListener("click", function () { showLightbox(activeIndex + 1); });
    lightbox.addEventListener("click", function (event) { if (event.target === lightbox) closeLightbox(); });
    galleryItems.forEach(function (item, index) {
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      if (!item.querySelector(".gallery-caption")) {
        var caption = document.createElement("span");
        caption.className = "gallery-caption";
        caption.textContent = item.querySelector("img").alt || "DesignX work";
        item.appendChild(caption);
      }
      item.addEventListener("click", function () { showLightbox(index); });
      item.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showLightbox(index); }
      });
    });
    document.addEventListener("keydown", function (event) {
      if (!lightbox.open) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showLightbox(activeIndex - 1);
      if (event.key === "ArrowRight") showLightbox(activeIndex + 1);
    });
  }

  document.querySelectorAll(".event-item").forEach(function (item, index) {
    item.tabIndex = 0;
    item.addEventListener("click", function () {
      var slug = item.querySelector("h3").textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      window.history.replaceState(null, "", "#" + slug);
      item.classList.add("is-selected");
    });
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); item.click(); }
    });
    item.style.setProperty("--event-index", index);
  });

  if (document.title.indexOf("FAQ") !== -1) {
    document.querySelectorAll(".list article").forEach(function (article) {
      var heading = article.querySelector("h3");
      var answer = article.querySelector("p");
      if (!heading || !answer) return;
      var toggle = document.createElement("button");
      toggle.className = "faq-toggle";
      toggle.type = "button";
      toggle.textContent = heading.textContent;
      toggle.setAttribute("aria-expanded", "false");
      heading.replaceWith(toggle);
      answer.hidden = true;
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        answer.hidden = open;
        article.classList.toggle("is-open", !open);
      });
    });
  }

  var heroImage = document.querySelector(".hero-image");
  if (heroImage && finePointer && !reduceMotion) {
    heroImage.addEventListener("pointermove", function (event) {
      var rect = heroImage.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      heroImage.style.transform = "perspective(900px) rotateX(" + (y * -3) + "deg) rotateY(" + (x * 4) + "deg) scale(1.015)";
    });
    heroImage.addEventListener("pointerleave", function () { heroImage.style.transform = "none"; });
  }

  var horizontal = document.querySelector("[data-horizontal-gallery]");
  if (horizontal && !reduceMotion && !coarsePointer) {
    var horizontalTicking = false;
    function moveGallery() {
      var rect = horizontal.parentElement.getBoundingClientRect();
      var progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      horizontal.style.transform = "translate3d(" + (-progress * Math.max(0, horizontal.scrollWidth - window.innerWidth * 0.72)) + "px,0,0)";
      horizontalTicking = false;
    }
    window.addEventListener("scroll", function () {
      if (!horizontalTicking) { requestAnimationFrame(moveGallery); horizontalTicking = true; }
    }, { passive: true });
    moveGallery();
  }
})();
