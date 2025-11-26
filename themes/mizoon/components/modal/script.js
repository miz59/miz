class Modal {
    constructor() {
        this.initialPositions = new Map()
        this.init()
    }

    init() {
        this.initToggles()
        this.initClose()
        this.initDraggable()
    }

    initToggles() {
        document.querySelectorAll(".modal-toggle").forEach(btn => {
            const id = btn.dataset.modalId
            btn.addEventListener("click", () => {
                const modal = document.getElementById(id)
                if (!modal) return
                const modalContent = modal.querySelector(".modal-content")
                const container = modal.closest(".modal-container") || modal
                container.style.zIndex = 999;

                modal.style.display = "flex"
                modal.classList.remove("hide")
                modal.classList.add("show")

                modalContent.addEventListener("animationend", () => {
                    if (modal.classList.contains("modal-remember-position") && modal.dataset.position) {
                        try {
                            const { top, left } = JSON.parse(modal.dataset.position)
                            modalContent.style.position = "absolute"
                            modalContent.style.top = `${top}px`
                            modalContent.style.left = `${left}px`
                            return
                        } catch (e) { }
                    }

                    if (!this.initialPositions.has(modal)) {
                        const rect = modalContent.getBoundingClientRect()
                        const parentRect = container.getBoundingClientRect()

                        const top = rect.top - parentRect.top
                        const left = rect.left - parentRect.left

                        this.initialPositions.set(modal, { top, left })
                    }

                    const initial = this.initialPositions.get(modal)
                    if (initial) {
                        modalContent.style.position = "absolute"
                        modalContent.style.top = `${initial.top}px`
                        modalContent.style.left = `${initial.left}px`
                    }
                }, { once: true })
            })
        })
    }

    initClose() {
        document.querySelectorAll(".modal-close").forEach(btn => {
            btn.addEventListener("click", () => {
                const modal = btn.closest(".modal-container, .modal-draggable")
                if (!modal) return
                const modalContent = modal.querySelector(".modal-content")

                modal.classList.remove("show")
                modal.classList.add("hide")

                modal.addEventListener("animationend", () => {
                    if (!modal.classList.contains("hide")) return

                    if (!modal.classList.contains("modal-remember-position") && modalContent) {
                        const initial = this.initialPositions.get(modal)
                        if (initial) {
                            modalContent.style.top = `${initial.top}px`
                            modalContent.style.left = `${initial.left}px`
                        }
                    }

                    modal.style.display = "none"
                    modal.classList.remove("hide")
                }, { once: true })
            })
        })
    }

    initDraggable() {
        document.querySelectorAll(".modal-draggable .modal-content .modal-header").forEach(header => {
            let isDragging = false
            let offsetX = 0
            let offsetY = 0
            const modalContent = header.closest(".modal-content")
            const modalContainer = header.closest(".modal-draggable")
            const parent = modalContainer.closest(".modal-container") || modalContainer
            modalContainer.style.zIndex = 999

            header.addEventListener("mousedown", e => {
                if (e.target.classList.contains("modal-close") || e.target.tagName === "BUTTON") return

                isDragging = true
                modalContent.classList.add("dragging")

                const rect = modalContent.getBoundingClientRect()
                const parentRect = parent.getBoundingClientRect()

                modalContent.style.left = `${rect.left - parentRect.left}px`
                modalContent.style.top = `${rect.top - parentRect.top}px`
                modalContent.style.position = "absolute"
                modalContent.style.margin = "0"

                offsetX = e.clientX - rect.left
                offsetY = e.clientY - rect.top
            })

            document.addEventListener("mousemove", e => {
                if (!isDragging) return

                const parentRect = parent.getBoundingClientRect()
                let newLeft = e.clientX - parentRect.left - offsetX
                let newTop = e.clientY - parentRect.top - offsetY

                if (modalContainer.classList.contains("modal-bounds")) {
                    const modalRect = modalContent.getBoundingClientRect()
                    const maxLeft = parentRect.width - modalRect.width
                    const maxTop = parentRect.height - modalRect.height

                    if (newLeft < 0) newLeft = 0
                    if (newTop < 0) newTop = 0
                    if (newLeft > maxLeft) newLeft = maxLeft
                    if (newTop > maxTop) newTop = maxTop
                }

                modalContent.style.left = `${newLeft}px`
                modalContent.style.top = `${newTop}px`
            })

            document.addEventListener("mouseup", () => {
                if (!isDragging) return
                isDragging = false
                modalContent.classList.remove("dragging")

                if (modalContainer.classList.contains("modal-remember-position")) {
                    modalContainer.dataset.position = JSON.stringify({
                        top: parseFloat(modalContent.style.top),
                        left: parseFloat(modalContent.style.left)
                    })
                }
            })
        })
    }
}

new Modal()