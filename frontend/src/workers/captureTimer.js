/**
 
captureTimer — Web Worker that provides un-throttled interval ticks.*
Browsers throttle setInterval/requestAnimationFrame on the main thread
when a tab is in the background. Workers are NOT throttled, so this
timer keeps firing at the requested FPS even when the tab is hidden.*
Messages IN:
{ type: 'start', fps: number }   — start (or restart) the timer
{ type: 'setFps', fps: number }  — change FPS on the fly
{ type: 'stop' }                 — stop the timer*
Messages OUT:
'tick'                            — one tick per interval*/

let timerId = null;

function startTimer(fps) {
    stopTimer();
    const interval = 1000 / fps;
    timerId = setInterval(() => {
        self.postMessage('tick');
    }, interval);
}

function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}

self.onmessage = (e) => {
    const { type, fps } = e.data;

    switch (type) {
        case 'start':
            startTimer(fps);
            break;
        case 'setFps':
            startTimer(fps); // restart with new interval
            break;
        case 'stop':
            stopTimer();
            break;
    }
};