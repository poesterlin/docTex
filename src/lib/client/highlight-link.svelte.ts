import { page } from '$app/state';

/**
 * Sets the aria-current attribute on the link if the href matches the current page path.
 * @param node
 * @returns
 */
export function highlightLink(node: HTMLElement) {
	const href = node.getAttribute('href');

	$effect(() => {
		const path = page.url.pathname;
		if (href === path) {
			node.setAttribute('aria-current', 'page');
		} else {
			node.removeAttribute('aria-current');
		}
	});
}
