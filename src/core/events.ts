import {
	getUrlAfterStateChange,
	isTargetElement,
	isTargetInputElement,
	overrideFunction,
} from "../utils";

export interface EventData<V = any> {
	name: string;
	value: V;
	event:
		| Event
		| {
				name: string;
				params: any[];
		  };
}

// element click
export function listenClick(callback: (data: EventData<HTMLElement>) => void) {
	const onClick = (event: MouseEvent) => {
		const target = event.target;
		if (isTargetElement(target)) {
			document.addEventListener(
				"mouseup",
				() => {
					callback({
						name: "click",
						value: target,
						event,
					});
				},
				{
					once: true,
					capture: true,
				}
			);
		}
	};
	document.addEventListener("mousedown", onClick, true);
	return () => {
		document.removeEventListener("mousedown", onClick, true);
	};
}

// input value
export function listenInput(callback: (data: EventData<string>) => void) {
	const onFocus = (event: Event) => {
		const target = event.target;
		if (isTargetInputElement(target)) {
			const beforeValue = target.textContent ?? "";

			const onInputEnd = () => {
				const afterValue = target.textContent ?? "";
				if (beforeValue !== afterValue) {
					callback({
						name: "input",
						value: afterValue,
						event,
					});
				}
				window.removeEventListener("beforeunload", onInputEnd, {
					capture: true,
				});
				document.removeEventListener("blur", onInputEnd, {
					capture: true,
				});
			};

			document.addEventListener("blur", onInputEnd, {
				once: true,
				capture: true,
			});
			window.addEventListener("beforeunload", onInputEnd, {
				once: true,
				capture: true,
			});
		}
	};

	document.addEventListener("focus", onFocus, true);

	return () => {
		document.removeEventListener("focus", onFocus, true);
	};
}

// script error
export function listenScriptError(
	callback: (error: EventData<string>) => void
) {
	const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
		callback({
			name: "error",
			value:
				(event as ErrorEvent).message ??
				(event as PromiseRejectionEvent).reason,
			event,
		});
	};

	window.addEventListener("error", onError, true);
	window.addEventListener("unhandledrejection", onError, true);
	return () => {
		window.removeEventListener("error", onError, true);
		window.removeEventListener("unhandledrejection", onError, true);
	};
}

// url change
export function listenUrlChange(
	callback: (data: EventData<{ from: string; to: string }>) => void
) {
	let alive = true;

	overrideFunction(history, "pushState", (data, unused, url) => {
		if (!alive) return;
		callback({
			name: "url-change",
			value: {
				from: location.href,
				to: getUrlAfterStateChange(url),
			},
			event: {
				name: "history-push-state",
				params: [data, unused, url],
			},
		});
	});

	overrideFunction(history, "replaceState", (data, unused, url) => {
		if (!alive) return;
		callback({
			name: "url-change",
			value: {
				from: location.href,
				to: getUrlAfterStateChange(url),
			},
			event: {
				name: "history-replace-state",
				params: [data, unused, url],
			},
		});
	});

	const onHashChange = (event: HashChangeEvent) => {
		callback({
			name: "url-change",
			value: {
				from: location.href,
				to: event.newURL,
			},
			event,
		});
	};

	const onPopState = (event: PopStateEvent) => {
		callback({
			name: "url-change",
			value: {
				from: location.href,
				to: event.state.route,
			},
			event,
		});
	};

	window.addEventListener("hashchange", onHashChange);
	window.addEventListener("popstate", onPopState);

	return () => {
		alive = false;
		window.removeEventListener("hashchange", onHashChange);
		window.removeEventListener("popstate", onPopState);
	};
}

// network change
export function listenNetwork() {}

// element exposure
export function listenExpose() {}

// mouse move
export function listenMouse(
	callback: (data: EventData<{ x: number; y: number }>) => void
) {
	const onMove = (event: MouseEvent) => {
		callback({
			name: "mouse",
			value: {
				x: event.clientX,
				y: event.clientY,
			},
			event,
		});
	};

	document.addEventListener("mousemove", onMove, true);

	return () => {
		document.removeEventListener("mousemove", onMove, true);
	};
}

// assets load
export function listenAssets() {}

// performance
export function listenPerformance() {}
