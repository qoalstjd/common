const ui = {
    init(root = document) {
        this.global.init();
        this.page.init(root);
    },
    global: {
        _inited: false,
        init() {
            if (this._inited) return;
            this._inited = true;
            ui.btn.init();
            ui.tab.init();
            ui.accordion.init();
            ui.detectOS();
        },
    },
    page: {
        init(root) {
            ui.tag.init(root);
            // ui.swiper.init(root);
            ui.tab?.init(root);
        },
    },
    loading: function (target, boolean) {
        target.classList.toggle("loading", boolean);
    },
    empty: function (target, boolean, type = "file", msg = "데이터가 없어요") {
        target.classList.toggle("empty", boolean);
        if (!boolean) {
            target.dataset.emptyimg = type;
            target.dataset.emptymsg = msg;
        }
    },
    debouncer: function (fn, delay = 200) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    },
    detectOS: function () {
        ui.isMobile = /iphone|ipod|ipad|android/i.test(navigator.userAgent);
        if (ui.isMobile) {
            document.documentElement.dataset.env = "pc";
        } else {
            document.documentElement.dataset.env = "mo";
        }
    },
    scrollLock: {
        _locked: false,
        lock() {
            if (this._locked) return;
            this._locked = true;
            const sbw = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = sbw ? sbw + "px" : "";
        },
        unlock() {
            this._locked = false;
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        },
    },
    lottie: {
        init() {
            document.querySelectorAll(".lottie").forEach((el) => {
                this.setup(el);
                this.load(el);
            });
        },
        setup(el) {
            const size = el.dataset.size || 96;
            el.style.width = size * 0.1 + "rem";
            el.style.height = size * 0.1 + "rem";
        },
        load(el) {
            const src = el.dataset.src;
            lottie.loadAnimation({
                container: el,
                renderer: "svg",
                loop: false,
                autoplay: true,
                path: src,
                clearCanvas: true,
            });
        },
        msg(msg, target = document.body, src = "https://cdn.jsdelivr.net/gh/qoalstjd/common/images/error.json") {
            const wrap = document.createElement("div");
            wrap.className = "lottie-wrap";
            wrap.innerHTML = `
                <div class="lottie" data-src="${src}"></div>
                <strong class="fs-20">${msg[0]}</strong>
                <p>${msg[1]}</p>
            `;
            target.innerHTML = "";
            target.appendChild(wrap);

            this.setup(wrap.querySelector(".lottie"));
            this.load(wrap.querySelector(".lottie"));

            return wrap;
        },
    },
    tag: {
        init(root = document) {
            root.querySelectorAll(".tag-wrap").forEach((wrap) => {
                let isDown = false;
                let startX = 0;
                let startScroll = 0;

                wrap.style.cursor = "grab";

                wrap.addEventListener("mousedown", (e) => {
                    isDown = true;
                    startX = e.pageX;
                    startScroll = wrap.scrollLeft;
                    wrap.style.cursor = "grabbing";
                });

                wrap.addEventListener("mousemove", (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    wrap.scrollLeft = startScroll - (e.pageX - startX);
                });

                window.addEventListener("mouseup", () => {
                    isDown = false;
                    wrap.style.cursor = "grab";
                });
            });
        },
    },
    btn: {
        init() {
            document.addEventListener("click", (e) => {
                const el = e.target.closest("[data-act]");
                if (!el) return;
                const action = el.dataset.act;
                this[action]?.(el);
            });
        },
        theme() {
            const root = document.documentElement;
            const next = root.dataset.theme === "dark" ? "light" : "dark";
            root.dataset.theme = next;
            window.cacheManager.set("theme", next);
        },
        sort(el) {
            const next = el.dataset.sort === "desc" ? "asc" : "desc";
            el.dataset.sort = next;
            el.dispatchEvent(
                new CustomEvent("sortChange", {
                    bubbles: true,
                    detail: {
                        key: el.dataset.sortKey,
                        order: next,
                    },
                })
            );
        },
        toggle(el) {
            el.classList.toggle("is-active");
        },
        share() {
            const data = {
                title: document.title,
                url: location.href,
            };
            if (navigator.share) {
                navigator.share(data);
            } else {
                navigator.clipboard.writeText(data.url);
                alert("링크가 복사되었습니다");
            }
        },
        fullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
        },
    },
    accordion: {
        init() {
            document.addEventListener("click", (e) => {
                this.btn = e.target.closest(".acc-btn");
                if (!this.btn) return;
                this.item = this.btn.closest(".acc-item");
                this.panel = this.item.querySelector(".acc-panel");

                // 다른거 닫기 (한개만 열림)
                // this.wrap.querySelectorAll(".acc-item.is-open").forEach((el) => {
                //     el.classList.remove("is-open");
                //     el.querySelector(".acc-panel").style.maxHeight = null;
                // });
                this.toggle();
            });
        },
        toggle() {
            const isOpen = this.item.classList.contains("is-active");
            if (isOpen) {
                this.item.classList.remove("is-active");
                this.panel.style.height = 0;
            } else {
                const offset = 24;

                this.item.classList.add("is-active");
                this.panel.style.height = this.panel.scrollHeight + offset + "px";
            }
        },
    },
    dropdown: {
        setupDropdown(dropdown) {
            const label = dropdown.querySelector(".dropdown-label");
            const list = dropdown.querySelector(".dropdown-list");
            const buttons = list.querySelectorAll("button, a");
            let isOpen = false;

            dropdown.setAttribute("aria-expanded", "false");
            list.hidden = true;

            // ?�치?�인
            const rect = list.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            if (spaceBelow < getListHeight(list) && spaceAbove > rect.height) {
                dropdown.classList.add("above");
            } else {
                dropdown.classList.remove("above");
            }
            function getListHeight() {
                let height = 0;
                buttons.forEach((el, i) => {
                    height += el.offsetHeight;
                });
                return height;
            }
            function open() {
                isOpen = true;
                dropdown.setAttribute("aria-expanded", "true");
                list.style.height = getListHeight(list) + "px";
                list.hidden = false;
            }
            function close() {
                isOpen = false;
                dropdown.setAttribute("aria-expanded", "false");
                list.hidden = true;
                list.style.height = 0 + "rem";
            }
            // ?�벤?? 바인??
            label.addEventListener("click", function () {
                isOpen ? close() : open();
            });
            buttons.forEach((btn, i) => {
                btn.addEventListener("click", () => {
                    close();
                    if (btn.tagName.toLowerCase() === "button") {
                        buttons.forEach((b, j) => {
                            b.setAttribute("aria-selected", i === j ? "true" : "false");
                        });
                        label.textContent = buttons[i].textContent;
                        if (label.textContent == "The last month" || label.textContent == "The last three month" || label.textContent == "The last six month") {
                            searchReportList();
                        }
                    }
                });
            });
            window.addEventListener("resize", () => {
                close();
            });
            document.addEventListener("click", (e) => {
                if (!dropdown.contains(e.target)) close();
            });
        },
        init(_selector, options = {}) {
            let root;
            if (!_selector) {
                root = document;
            } else if (typeof _selector === "string") {
                root = document.querySelector(_selector);
            } else if (_selector instanceof Element) {
                root = _selector;
            } else {
                console.warn("Invalid selector or element:", _selector);
                return;
            }
            if (!root) return;
            root.querySelectorAll(".dropdown").forEach((el) => this.setupDropdown(el, options));
        },
    },
    copyClipBoard: function (text) {
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(text)
                .then(() => alert("클립보드에 복사되었습니다."))
                .catch(fallback);
        } else {
            fallback();
        }
        function fallback() {
            const t = document.createElement("textarea");
            t.value = text;
            t.style.position = "fixed";
            t.style.opacity = "0";
            document.body.appendChild(t);
            t.focus();
            t.select();
            try {
                const ok = document.execCommand("copy");
                alert(ok ? "클립보드에 복사되었습니다." : "복사에 실패했습니다.");
            } catch {
                alert("복사에 실패했습니다.");
            }
            document.body.removeChild(t);
        }
    },
    tab: {
        init() {
            const tabs = document.querySelectorAll("[id^='tab']");
            tabs.forEach((el, i) => {
                el.style.display = i === 0 ? "block" : "none";
            });
            const buttons = document.querySelectorAll("[data-tab]");
            buttons.forEach((btn, i) => {
                if (i === 0) btn.classList.add("is-active");
            });
            document.addEventListener("click", (e) => {
                const el = e.target.closest("[data-tab]");
                if (!el) return;
                const prefix = el.dataset.tab.slice(0, 4); // "tab0"

                // 버튼 활성화 토글
                buttons.forEach((btn) => btn.classList.toggle("is-active", btn === el));

                // 탭 콘텐츠 토글
                document.querySelectorAll(`[id^="${prefix}"]`).forEach((c) => {
                    c.style.display = c.id === el.dataset.tab ? "block" : "none";
                });
            });
        },
        setupTabs(tabWrap) {
            const container = tabWrap.parentElement;
            const tabs = tabWrap.querySelectorAll('[role="tab"]');
            tabs.forEach((tab) => {
                const targetPanel = document.getElementById(tab.getAttribute("aria-controls"));
                tab.addEventListener("click", () => {
                    container.querySelectorAll('[role="tabpanel"]').forEach((panel) => (panel.hidden = true));
                    if (targetPanel) targetPanel.hidden = false;

                    if (!tab.getAttribute("href")?.startsWith("#")) {
                        tabs.forEach((t) => t.setAttribute("aria-selected", false));
                        tab.setAttribute("aria-selected", true);
                    } else {
                        e.preventDefault();
                        const tabAreaBottom = document.querySelector("#header").getBoundingClientRect().bottom + document.querySelector(".tab-area a").offsetHeight;
                        const tabHeight = document.querySelector(tab.getAttribute("href")).offsetTop;
                        const y = tabHeight - tabAreaBottom;
                        requestAnimationFrame(() => {
                            window.scrollTo({ top: y, behavior: "auto" });
                        });
                    }
                    if (typeof tabClickHandler === "function") {
                        tabClickHandler(tab.getAttribute("aria-controls"));
                    }
                });
            });
        },
        setupScrollTab() {
            const scrollY = window.scrollY;
            const tabAreaBottom = document.querySelector("#header").getBoundingClientRect().bottom + document.querySelector(".tab-area a").offsetHeight;
            document.querySelectorAll("section").forEach((section) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionBottom = sectionTop + sectionHeight;
                if (scrollY + tabAreaBottom >= sectionTop - 4 && scrollY + tabAreaBottom < sectionBottom) {
                    document.querySelectorAll(".tab-area .tab-wrap a").forEach((tab) => {
                        const href = tab.getAttribute("href");
                        tab.setAttribute("aria-selected", href === `#${section.id}`);
                    });
                }
            });
        },
        scrollTable: {
            scrollRatio: 0.2,
            minDistance: 100,
            setup(container) {
                const table = container.querySelector("table");
                const thead = table.querySelector("thead");
                const firstCol = table.querySelector("tr th:first-child, tr td:first-child");
                const leftBtn = Object.assign(document.createElement("button"), {
                    className: "left",
                    textContent: "scroll to left",
                });
                const rightBtn = Object.assign(document.createElement("button"), {
                    className: "right",
                    textContent: "scroll to right",
                });

                const wrapper = document.createElement("div");
                wrapper.className = "arrow-btns";
                wrapper.append(leftBtn, rightBtn);
                container.prepend(wrapper);
                const update = () => {
                    const { offsetWidth: cW, scrollLeft } = container;
                    const tW = table.offsetWidth;
                    leftBtn.style.display = scrollLeft > 0 ? "inline-block" : "none";
                    rightBtn.style.display = scrollLeft + cW < tW ? "inline-block" : "none";
                    const thHeight = thead?.offsetHeight || 42;
                    const firstW = firstCol?.offsetWidth || 0;
                    wrapper.style.top = `${thHeight / 2 - 8}px`;
                    leftBtn.style.left = `${firstW + 8}px`;
                };
                leftBtn.addEventListener("click", () =>
                    container.scrollBy({
                        left: -Math.max(this.minDistance, container.scrollWidth * this.scrollRatio),
                        behavior: "smooth",
                    })
                );
                rightBtn.addEventListener("click", () =>
                    container.scrollBy({
                        left: Math.max(this.minDistance, container.scrollWidth * this.scrollRatio),
                        behavior: "smooth",
                    })
                );
                container.addEventListener("scroll", update);
                new ResizeObserver(update).observe(thead);
                new ResizeObserver(update).observe(container);
                new ResizeObserver(update).observe(firstCol);
                update();
            },
            init() {
                document.querySelectorAll(".table-wrap").forEach((el) => this.setup(el));
            },
        },
    },
    setScrollLock: (lock = true) => {
        document.body.style.overflow = lock ? "hidden" : "";
    },
    setDimmed: (active = true, zIndex = "") => {
        const dim = document.querySelector(".dim");
        if (!dim) return;
        if (active) {
            dim.classList.add("active");
            dim.style.zIndex = zIndex;
            dim.style.pointerEvents = "auto";
        } else {
            dim.classList.remove("active");
            dim.style.zIndex = "";
            dim.style.pointerEvents = "none";
        }
    },
};

const dialog = {
    stack: [],
    z: 1000,
    _resizeBound: false,
    async open(opts = {}) {
        let { url, html, data = {}, size = "md", parent = document.body, dim = true, esc = true, opener = document.activeElement, onClose, onApply } = opts;
        if (!url && !html) return;
        url = window.BASE + url;
        const type = url && !html ? "popup" : "alert";
        history.pushState({ dialog: true }, "");

        let content;
        if (type === "popup") {
            const res = await fetch(url);
            content = await res.text();
        } else {
            content = `
                <div class="dialog-title">
                    <p><svg class="wh-24"><use href="#ui-document"></use></svg>소식</p>
                </div>
                <div class="dialog-content alert">${html}</div>
                <div class="btn-wrap jc-c">
                    <button class="btn sm bg-point" data-act="close">확인</button>
                </div>`;
        }
        // 레이어
        const pop = document.createElement("article");
        pop.className = "dialog " + size;
        pop.style.zIndex = ++this.z;
        pop.innerHTML = content;
        const titleEl = pop.querySelector(".dialog-title");
        if (titleEl) {
            pop.querySelector(".dialog-title").innerHTML += `
                <button class="ico-wrap pd-4" data-act="close">
                    <svg><use href="#act-close"></use></svg>
                </button>
            `;
        }
        // data-bind 처리
        if (window.bindData) {
            window.bindData(pop, data);
        }
        let dimEl;
        const close = () => {
            this.stack.pop();
            dimEl?.remove();
            pop.remove();
            opener?.focus();
            onClose?.();
            document.removeEventListener("keydown", escClose);

            if (!this.stack.length) ui.scrollLock.unlock();
            this.syncDim();
        };
        const escClose = (e) => esc && e.key === "Escape" && this.closeTop();
        const apply = (payload) => {
            onApply?.(payload);
            close(); // 적용 후 닫기
        };
        pop.querySelectorAll("[data-act='close']").forEach((b) => (b.onclick = close));
        pop.querySelectorAll("[data-act='apply']").forEach(
            (b) =>
                (b.onclick = () => {
                    const payload = window.collectDialogData?.(pop);
                    apply(payload);
                })
        );

        if (dim) {
            dimEl = document.createElement("div");
            dimEl.className = "dim";
            dimEl.style.zIndex = this.z;
            dimEl.onclick = close;
            parent.append(dimEl);
        }

        document.addEventListener("keydown", escClose);
        parent.append(pop);
        this.loadModule(url, data, pop);
        this.stack.push({ pop, dimEl, close, apply });
        ui.scrollLock.lock();
        this.trapFocus(pop);
        this.syncDim();

        this.centerDialog(pop);
        if (!this._resizeBound) {
            const resizeHandler = ui.debouncer(() => {
                this.stack.forEach(({ pop }) => this.centerDialog(pop));
            }, 50);
            window.addEventListener("resize", resizeHandler);
            const observer = new ResizeObserver(resizeHandler);
            this.stack.forEach(({ pop }) => observer.observe(pop));
            this._observer = observer;
            this._resizeBound = true;
        } else {
            this._observer.observe(pop);
        }
        return { pop, close };
    },
    closeTop() {
        this.stack.at(-1)?.close();
    },
    syncDim() {
        this.stack.forEach((s, i) => {
            if (s.dimEl) s.dimEl.style.display = i === this.stack.length - 1 ? "block" : "none";
        });
    },
    trapFocus(el) {
        const f = el.querySelectorAll("button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])");
        if (!f.length) return;

        const [first, last] = [f[0], f[f.length - 1]];
        first.focus();

        el.onkeydown = (e) => {
            if (e.key !== "Tab") return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
    },
    centerDialog(pop) {
        pop.style.left = Math.max((window.innerWidth - pop.offsetWidth) / 2, 0) + "px";
        pop.style.top = Math.max((window.innerHeight - pop.offsetHeight) / 2, 0) + "px";
    },
    loadModule(url, params, root) {
        if (!url) return;
        const jsPath = `${location.hostname.includes("github.io") ? "/" + location.pathname.split("/")[1] : ""}${url.replace(/\.html$/, ".js")}?t=${Date.now()}`;
        const existing = document.querySelector(`script[data-page="${url}"]`);
        if (existing) existing.remove();
        const script = document.createElement("script");
        script.type = "module";
        script.src = jsPath;
        script.dataset.page = url;
        script.onload = () => {
            if (window.initModule) {
                window.initModule({ root, params });
                delete window.initModule;
            }
        };
        script.onerror = (e) => {
            console.error("Failed to load script:", jsPath, e);
        };

        document.body.appendChild(script);
    },
};

window.ui = ui;
window.dialog = dialog;
