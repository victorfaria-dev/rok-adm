// Helpers shared by the lazy 3D views (crest F-61, guide tower F-62): build a scene in steps that yield to
// the main thread (Q2 P2-10), and wait for the GPU without blocking. No Three.js import here.

/** Let the browser handle input and paint between heavy steps. */
export function yieldToMain(): Promise<void> {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof s?.yield === "function") return s.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Resolve once the GPU has run the commands issued so far (WebGL2 fence, polled per task; max ~2 s). */
export async function gpuIdle(gl: WebGLRenderingContext | WebGL2RenderingContext, stop: () => boolean): Promise<void> {
  if (typeof WebGL2RenderingContext === "undefined" || !(gl instanceof WebGL2RenderingContext)) return yieldToMain();
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) return yieldToMain();
  gl.flush();
  try {
    for (let i = 0; i < 120 && !stop(); i++) {
      await new Promise((r) => setTimeout(r, 16));
      if (gl.getSyncParameter(sync, gl.SYNC_STATUS) === gl.SIGNALED) return;
    }
  } finally {
    gl.deleteSync(sync);
  }
}
