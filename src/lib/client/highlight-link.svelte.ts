import { page } from '$app/stores';

/**
 * Sets the aria-current attribute on the link if the href matches the current page path.
 * @param node
 * @returns
 */
export function highlightLink(node: HTMLElement) {
	const href = node.getAttribute('href');

	const unsubscribe = page.subscribe(({ url }) => {
		const path = url.pathname;
		if (href === path) {
			node.setAttribute('aria-current', 'page');
		} else {
			node.removeAttribute('aria-current');
		}
	});

	return {
		destroy() {
			unsubscribe();
		}
	};
}
