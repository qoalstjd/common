// =========================
// URL 파라미터 관리
// =========================
const paramManager = {
    /**
     * URL 파라미터 추가/수정
     * @@ add({ linkcd: 'string' })
     */
    add(obj) {
        const url = new URL(location.href);
        const p = url.searchParams;
        Object.entries(obj).forEach(([k, v]) => p.set(k, v));
        history.replaceState({}, "", url);
    },
    /**
     * 특정 파라미터 제거
     * @@ remove("page")
     */
    remove(key) {
        const url = new URL(location.href);
        url.searchParams.delete(key);
        history.replaceState({}, "", url);
    },
    /**
     * 모든 파라미터 객체로 반환
     * @@ getAll() → { page: "2", sort: "new" }
     */
    getAll() {
        const p = new URL(location.href).searchParams;
        const obj = {};
        p.forEach((v, k) => (obj[k] = v));
        return obj;
    },
    /**
     * 단일 파라미터 조회
     * @@ get("page") → "2"
     */
    get(key) {
        return new URL(location.href).searchParams.get(key);
    },
};
// =========================
// localStorage 캐시 관리
// =========================
const cacheManager = {
    defaultTTL: 3600 * 1000, // 1시간
    get prefix() {
        return `${window.rootDir || "app"}_cache_`;
    },
    _getKey(key) {
        return this.prefix + key;
    },
    /**
     * 캐시 저장
     * @@ set("list", data)
     * @@ set("theme", "dark", { persist: true })
     * @@ set("api", data, { ttl: 5000 })
     */
    set(key, data, { persist = false, ttl } = {}) {
        try {
            localStorage.setItem(
                this._getKey(key),
                JSON.stringify({
                    data,
                    persist,
                    ttl: persist ? null : ttl ?? this.defaultTTL,
                    timestamp: persist ? null : Date.now(),
                })
            );
        } catch (e) {
            console.error("Cache set 에러:", e);
        }
    },
    /**
     * 캐시 조회
     * @@ get("list")
     */
    get(key) {
        try {
            const cached = localStorage.getItem(this._getKey(key));
            if (!cached) return null;
            const { data, persist, ttl, timestamp } = JSON.parse(cached);
            if (!persist && ttl && timestamp && Date.now() - timestamp > ttl) {
                this.remove(key);
                return null;
            }
            return data;
        } catch (e) {
            console.error("Cache get 에러:", e);
            return null;
        }
    },
    /**
     * 캐시 제거
     * @@ remove("list")
     */
    remove(key) {
        localStorage.removeItem(this._getKey(key));
    },
    /** prefix 기준 전체 캐시 제거 */
    clear() {
        const prefix = this.prefix;
        Object.keys(localStorage)
            .filter((k) => k.startsWith(prefix))
            .forEach((k) => localStorage.removeItem(k));
    },
};
// =========================
// fetch + cache 래퍼
// =========================
const fetchManager = {
    /**
     * GET 요청 (자동 캐싱)
     * @@ get(url)
     * @@ get(url, { parse: "text" })
     */
    async get(url, options = {}) {
        const { parse = "json", caching = true } = options;

        try {
            const cached = cacheManager.get(url);
            if (cached) return cached;

            const res = await fetch(url, options);
            if (!res.ok) throw new Error(res.status);

            let data;
            switch (parse) {
                case "text":
                    data = await res.text();
                    break;
                case "blob":
                    data = await res.blob();
                    break;
                case "arrayBuffer":
                    data = await res.arrayBuffer();
                    break;
                default:
                    data = await res.json();
            }

            if (caching) {
                cacheManager.set(url, data);
            }
            return data;
        } catch (err) {
            console.error("fetchManager 에러:", err);
            return null;
        }
    },

    /**
     * fetch 캐시 제거
     * @@ clear(url)
     * @@ clear() // 전체
     */
    clear(url) {
        if (url) cacheManager.remove(url);
        else cacheManager.clear();
    },
};
// =========================
// 데이터 바인딩
// =========================
const bindData = (root, data) => {
    const tpl = (s) => s.replace(/{{(.*?)}}/g, (_, k) => data[k.trim()] ?? "");

    root.querySelectorAll("[data-bind]").forEach((el) => {
        el.dataset.bind.split(/\s+/).forEach((type) => {
            if (type === "txt") el.textContent = tpl(el.textContent);
            if (type === "html") el.innerHTML = tpl(el.innerHTML);
            if (type === "href") el.href = tpl(el.getAttribute("href"));
            if (type === "src") el.src = tpl(el.getAttribute("src"));
            if (type === "onerror") {
                const fallback = el.dataset.onerror;
                if (!fallback) return;
                el.onerror = () => {
                    el.onerror = null;
                    el.src = tpl(fallback);
                };
            }
        });
    });
};
const formatDate = (input = new Date(), format = "YYYY-MM-DD HH:mm:ss") => {
    let date;

    if (/^\d{8}$/.test(input)) {
        const s = String(input);
        date = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    } else {
        date = input instanceof Date ? input : new Date(input);
    }

    if (isNaN(date)) return "";

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();
    const wd = ["일", "월", "화", "수", "목", "금", "토"];
    const wdL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    return format.replace(
        /YYYY|YY|MM|M|DD|D|E|EEEE|HH|H|hh|h|mm|m|ss|s|A/g,
        (t) =>
            ({
                YYYY: y,
                YY: String(y).slice(2),
                MM: String(m).padStart(2, "0"),
                M: m,
                DD: String(d).padStart(2, "0"),
                D: d,
                E: wd[date.getDay()],
                EEEE: wdL[date.getDay()],
                HH: String(h).padStart(2, "0"),
                H: h,
                hh: String(h % 12 || 12).padStart(2, "0"),
                h: h % 12 || 12,
                mm: String(mm).padStart(2, "0"),
                m: mm,
                ss: String(ss).padStart(2, "0"),
                s: ss,
                A: h < 12 ? "AM" : "PM",
            }[t])
    );
};

window.paramManager = paramManager;
window.cacheManager = cacheManager;
window.fetchManager = fetchManager;
window.bindData = bindData;
window.formatDate = formatDate;

// cacheManager.clear();
