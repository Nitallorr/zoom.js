import { toOffset, usableWidth } from "./common.js";
import { ZoomImage } from "./zoom-image.js";
// Values for the currently active zoomed instance.
// There can be at most one.
let activeZoom = null;
let onZoomDismiss = null;
let initialScrollPos = null;
let initialTouchPos = null;
let closeScrollDelta = null;
let closeTouchDelta = null;
function openActiveZoom(img, c, onDismiss) {
    if (activeZoom !== null) {
        throw "a zoom is already active";
    }
    const tooNarrow = img.width >= usableWidth(document.documentElement, toOffset(c.padding));
    activeZoom = new ZoomImage(img, toOffset(tooNarrow ? c.paddingNarrow : c.padding));
    onZoomDismiss = onDismiss !== undefined ? onDismiss : null;
    initialScrollPos = null;
    initialTouchPos = null;
    closeScrollDelta = c.dismissScrollDelta;
    closeTouchDelta = c.dismissTouchDelta;
    activeZoom.zoom();
    addCloseListeners();
}
function closeActiveZoom() {
    if (activeZoom === null) {
        throw "no active zoom";
    }
    removeCloseListeners();
    activeZoom.dismiss();
    onZoomDismiss === null || onZoomDismiss === void 0 ? void 0 : onZoomDismiss();
    closeScrollDelta = null;
    closeTouchDelta = null;
    initialScrollPos = null;
    initialTouchPos = null;
    onZoomDismiss = null;
    activeZoom = null;
}
function addCloseListeners() {
    document.addEventListener("scroll", handleDocumentScroll);
    document.addEventListener("keyup", handleDocumentKeyup);
    document.addEventListener("touchstart", handleDocumentTouchStart);
    document.addEventListener("click", handleDocumentClick, true);
}
function removeCloseListeners() {
    document.removeEventListener("scroll", handleDocumentScroll);
    document.removeEventListener("keyup", handleDocumentKeyup);
    document.removeEventListener("touchstart", handleDocumentTouchStart);
    document.removeEventListener("click", handleDocumentClick, true);
}
function handleDocumentScroll() {
    if (closeScrollDelta === null) {
        // Should not happen since it is assigned in openActiveZoom.
        throw "null closeScrollDelta";
    }
    if (initialScrollPos === null) {
        initialScrollPos = window.scrollY;
        return;
    }
    const deltaY = Math.abs(initialScrollPos - window.scrollY);
    if (deltaY < closeScrollDelta) {
        return;
    }
    closeActiveZoom();
}
function handleDocumentKeyup(e) {
    if (e.code !== "Escape") {
        return;
    }
    closeActiveZoom();
}
function handleDocumentTouchStart(e) {
    if (e.touches.length === 0) {
        return;
    }
    initialTouchPos = e.touches[0].pageY;
    document.addEventListener("touchmove", handleDocumentTouchMove);
}
function handleDocumentTouchMove(e) {
    if (closeTouchDelta === null) {
        // Should not happen since it is assigned in openActiveZoom.
        throw "null closeTouchDelta";
    }
    if (initialTouchPos === null) {
        // Should not happen (see touchstart handler), but guard anyway.
        // This guard is also required to show TypeScript that the
        // variable is non-null below.
        return;
    }
    if (e.touches.length === 0) {
        return;
    }
    if (Math.abs(e.touches[0].pageY - initialTouchPos) < closeTouchDelta) {
        return;
    }
    closeActiveZoom();
    document.removeEventListener("touchmove", handleDocumentTouchMove);
}
function handleDocumentClick(e) {
    e.stopPropagation();
    closeActiveZoom();
}
export const defaultConfig = {
    padding: 40,
    paddingNarrow: 25,
    dismissScrollDelta: 15,
    dismissTouchDelta: 10,
};
// zoom zooms the specified image. The function throws if there is already an
// image actively zoomed at the time of the call.
//
// The onDismiss callback, if provided, is invoked when the zoom is dismissed.
// The zoom can either be dimissed by user interaction (e.g. clicking, scrolling
// away), or it can be dismissed programmatically by calling dismissZoom.
// onDismiss is called as soon as the zoom is dismissed. Dismissal animations
// and transitions may still be in progress at the time of the call.
export function zoom(img, cfg = defaultConfig, onDismiss) {
    openActiveZoom(img, cfg !== undefined ? cfg : defaultConfig, onDismiss);
}
// dismissZoom programmatically dismisses the presently active zoom. The
// function throws if there is no zoom active at the time of the call.
export function dismissZoom() {
    closeActiveZoom();
}
// zoomActive returns the <img> element that is zoomed if one is actively
// zoomed at the time of the call. Otherwise it returns null.
export function zoomActive() {
    if (activeZoom !== null) {
        return activeZoom.img;
    }
    return null;
}
