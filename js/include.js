window.BASE = document.querySelector("base")?.getAttribute("href")?.replace(/\/$/, "") || "";

const DEFAULT_LINKCD = "m0100";
const SPA = {
    wrap: document.querySelector(".wrap"),
    main: document.querySelector(".wrap > main"),
    routes: {},
    // linkcd 가져오기: history.state → sessionStorage → 기본값
    getLinkcd() {
        return history.state?.linkcd || sessionStorage.getItem("linkcd") || DEFAULT_LINKCD;
    },
    // 현재화면의 depth1 메뉴 link 가져오기
    getDep1Key(linkcd) {
        const route = this.routes[linkcd];
        if (!route) return linkcd;
        return route.depth === 1 ? linkcd : route.parent?.[0];
    },
    showErrorFallback({ code = "default" } = {}) {
        const msg = {
            401: ["로그인이 필요합니다.", "로그인 후 이용해주세요."],
            403: ["접근 권한이 없습니다.", "권한을 확인해주세요."],
            404: ["페이지를 찾을 수 없습니다.", "입력한 주소를 확인해주세요."],
            500: ["서버 오류가 발생했습니다.", "잠시 후 다시 시도해주세요."],
            503: ["서비스 점검 중입니다.", "잠시 후 다시 이용해주세요."],
            default: ["요청을 처리할 수 없습니다.", "다시 시도해주세요."],
        }[code] || ["요청을 처리할 수 없습니다.", "다시 시도해주세요."];
        window.ui?.lottie?.msg?.(msg, this.main);
        history.replaceState({ linkcd: "error" }, "", `${window.BASE}/`);
    },
    // LNB 렌더링 (dep1key)
    renderLNB(dep1Key) {
        const lnb = this.wrap.querySelector(".lnb");
        lnb?.remove();
        const items = Object.entries(this.routes)
            .filter(([key, r]) => r.parent?.includes(dep1Key) && r.depth === 2)
            .map(([key, r]) => `<li><a href="${window.BASE}/index.html?linkcd=${key}">${r.name}</a></li>`);
        if (items.length) {
            const dep1Name = this.routes[dep1Key]?.name || "";
            const newLnb = document.createElement("div");
            newLnb.className = "lnb";
            newLnb.innerHTML = `<h1>${dep1Name}</h1><ul>${items.join("")}</ul>`;
            this.wrap.prepend(newLnb);
        }
    },
    // GNB/ LNB active 처리
    setActive(linkcd) {
        const gnb = document.querySelector(".gnb");
        const lnb = document.querySelector(".lnb");
        gnb?.querySelectorAll("li a").forEach((a) => a.classList.remove("is-active"));
        const route = this.routes[linkcd];
        const dep1Key = this.getDep1Key(linkcd);
        gnb?.querySelector(`a[href*="linkcd=${dep1Key}"]`)?.classList.add("is-active");
        lnb?.querySelectorAll("li a").forEach((a) => a.classList.remove("is-active"));
        const lnbCur = lnb?.querySelector(`a[href*="linkcd=${linkcd}"]`) || lnb?.querySelector("li:first-child a");
        lnbCur?.classList.add("is-active");
        this.main.className = this.routes[dep1Key]?.name?.toLowerCase() || "";
    },
    _eventBound: false,
    bindEvent() {
        if (this._eventBound) return;
        this._eventBound = true;
        document.addEventListener("click", (e) => {
            const a = e.target.closest("a");
            if (!a) return;
            const href = a.getAttribute("href");
            if (!href) return;
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (href.startsWith("#")) {
                e.preventDefault();
                const id = decodeURIComponent(href.slice(1));
                let top = 0;
                if (id !== "top") {
                    const el = document.getElementById(id);
                    if (el) top = el.getBoundingClientRect().top + window.pageYOffset - 80;
                }
                window.scrollTo({ top });
                return;
            }
            const isExternalLink = /^(https?:|mailto:|tel:)/i.test(href);
            const isInternal = !isExternalLink && (href.startsWith("/") || href.startsWith(window.BASE));
            if (!isInternal) return;
            e.preventDefault();
            const url = new URL(href, location.origin);
            const params = Object.fromEntries(url.searchParams.entries());
            if (!params.linkcd) params.linkcd = DEFAULT_LINKCD;
            sessionStorage.setItem("pageParams", JSON.stringify(params));
            this.loadPage(params, false);
        });
        window.addEventListener("popstate", (e) => {
            if (dialog.stack.length > 0) return dialog.closeTop();
            const state = e.state || {};
            if (!state.linkcd) state.linkcd = DEFAULT_LINKCD;
            sessionStorage.setItem("pageParams", JSON.stringify(state));
            this.loadPage(state, true);
        });
    },
    loadPage(params = { linkcd: DEFAULT_LINKCD }, replaceHistory = false) {
        let route = this.routes[params.linkcd];
        if (!route) return this.showErrorFallback({ code: 404 });
        const gnb = document.querySelector(".gnb");
        if (gnb?.classList.contains("is-opened")) {
            gnb.classList.remove("is-opened");
            gnb.classList.add("is-closing");
            gnb.addEventListener(
                "animationend",
                () => {
                    gnb.classList.remove("is-closing");
                },
                { once: true }
            );
        }

        const dep1Key = this.getDep1Key(params.linkcd);
        if (route.depth === 1) {
            const firstChild = Object.entries(this.routes).find(([k, r]) => r.parent?.includes(params.linkcd) && r.depth === 2);
            if (firstChild) {
                params.linkcd = firstChild[0];
                route = this.routes[params.linkcd];
            }
        }
        const pageUrl = `${window.BASE}${route.path}`;
        fetch(pageUrl)
            .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
            .then((html) => {
                this.main.innerHTML = html;
                this.main.querySelectorAll("img").forEach((img) => {
                    const src = img.getAttribute("src");
                    if (src.startsWith("/")) {
                        img.src = window.BASE + src;
                    }
                });
                window.scrollTo({ top: 0, behavior: "auto" });
                if (route.lnb !== false) this.renderLNB(dep1Key);
                this.setActive(params.linkcd);
                this.loadPageScript(route, params);
                window.ui?.init?.(this.wrap);
                window.common?.init?.(this.wrap);

                const url = `${window.BASE}/index.html?${new URLSearchParams(params).toString()}`;
                if (replaceHistory) {
                    history.replaceState(params, "", url);
                } else {
                    if (history.state?.linkcd === "error") {
                        history.replaceState(params, "", url);
                    } else {
                        history.pushState(params, "", url);
                    }
                }
                document.dispatchEvent(new CustomEvent("spa:change", { detail: params }));
            })
            .catch((code) => {
                this.showErrorFallback({ code });
            });
    },
    loadPageScript(route, params) {
        if (!route) return;

        const jsPath = `${window.BASE}${route.path.replace(/\.html$/, ".js")}?t=${Date.now()}`;

        const existing = document.querySelector(`script[data-page="${route.path}"]`);
        if (existing) existing.remove();

        const script = document.createElement("script");
        script.type = "module";
        script.src = jsPath;
        script.dataset.page = route.path;
        script.onload = () => {
            if (window.initModule) {
                window.initModule({ root: this.main, params });
                delete window.initModule;
            }
        };
        script.onerror = (e) => {
            console.error("Failed to load script:", jsPath, e);
        };
        document.body.appendChild(script);
    },
    init() {
        window.ui.loading(this.main, true);
        fetch(`${window.BASE}/js/menu.json`)
            .then((res) => {
                if (!res.ok) throw new Error(res.status);
                return res.json();
            })
            .then((data) => {
                this.routes = data;
                const url = new URL(window.location.href, window.location.origin);
                let params = Object.fromEntries(url.searchParams.entries());
                if (Object.keys(params).length === 0) {
                    const saved = sessionStorage.getItem("pageParams");
                    if (saved) params = JSON.parse(saved);
                }
                if (!params.linkcd) params.linkcd = DEFAULT_LINKCD;
                this.loadPage(params, true);
                this.bindEvent();
            })
            .catch((err) => {
                this.showErrorFallback({ code: err.message || 500 });
            })
            .finally(() => {
                window.ui.loading(this.main, false);
            });
    },
};

SPA.init();

window.SPA = SPA;
