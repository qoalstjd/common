const dialog = {
    open({ opener, type = "md", title = "알림", content = "내용", footer = null, onApply = null } = {}) {
        if (!opener) opener = document.activeElement;

        const parentEl = opener?.closest(".item") || document.body;
        const dim = document.createElement("div");
        dim.classList.add("dim");

        const pop = document.createElement("div");
        pop.className = `pop ${type}`;

        switch (type) {
            case "alert":
                pop.innerHTML = `
                    <div class="pop-title">
                        <strong>${title}</strong>
                        <div class="formatbar">
                            ${onApply ? '<button data-act="apply" class="yellow">확인</button><button data-act="close">닫기</button>' : '<button data-act="close" class="yellow">확인</button>'}
                        </div>
                    </div>`;
                break;

            case "toast":
                pop.innerHTML = `
                    <div class="pop-title">
                        <strong>${title}</strong>
                        <button data-act="close" class="yellow">확인</button>
                    </div>`;
                break;

            default:
                pop.innerHTML = `
                    <div class="pop-title">
                        <strong>${title}</strong>
                        <div class="formatbar">
                            ${onApply ? '<button data-act="apply" class="yellow">확인</button><button data-act="close">닫기</button>' : '<button data-act="close">확인</button>'}
                        </div>
                    </div>
                    <div class="pop-content">${content}</div>
                    ${footer ? `<div class="pop-footer">${footer}</div>` : ""}`;
                break;
        }

        const close = () => {
            dim.previousElementSibling?.classList.remove("dimmed");
            dim.remove();
            pop.remove();
        };

        // 저장해두면 외부에서도 dialog.close() 가능
        this._close = close;

        const applyBtn = pop.querySelector('[data-act="apply"]');
        if (onApply && applyBtn) {
            applyBtn.addEventListener("click", () => {
                onApply(pop) === false ? null : close();
            });
        }

        pop.querySelector('[data-act="close"]').addEventListener("click", close);

        if (type !== "toast") {
            parentEl.appendChild(dim);
            parentEl.appendChild(pop);
            dim.addEventListener("click", close);
            dim.previousElementSibling?.classList.add("dimmed");
        } else {
            parentEl.appendChild(pop);
            setTimeout(() => pop.remove(), 3000);
        }

        return pop;
    },

    close() {
        this._close?.();
    },
};

window.dialog = dialog;