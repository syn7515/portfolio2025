// Pass as `onUpdate` to a motion element whose opacity or filter animation has to land cleanly.
//
// Motion hands opacity and filter to the browser's own animations (WAAPI). When one finishes, it
// cancels it straight away but writes the end value through a motion value, which only reaches the
// element's style on Motion's next frame. For that one frame the element shows its underlying
// inline style instead: a fade-in drops back to where it started (invisible) right as it lands,
// and a fade-out flashes back to fully visible just before it unmounts. Motion keeps any element
// with an `onUpdate` on its own animation loop, where the end value is written in the same frame.
// That loop already drives these elements' x/y/scale, so their fades now run in step with it.
export function keepOnMainThread() {}
