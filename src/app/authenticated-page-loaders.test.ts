import { NAVIGATION_ITEMS, type NavigationPath } from "@/components/layout/navigation";
import { AUTHENTICATED_PAGE_LOADERS, preloadAuthenticatedPage } from "./authenticated-page-loaders";

describe("authenticated-page-loaders", () => {
	it("tem um loader para cada path do menu", () => {
		const menuPaths = NAVIGATION_ITEMS.map((item) => item.path).sort();
		const loaderPaths = Object.keys(AUTHENTICATED_PAGE_LOADERS).sort();
		expect(loaderPaths).toEqual(menuPaths);
	});

	it("preloadAuthenticatedPage dispara o loader do path", async () => {
		const path: NavigationPath = "/calendar";
		const original = AUTHENTICATED_PAGE_LOADERS[path];
		const load = vi.fn(() => Promise.resolve({ default: () => null }));
		AUTHENTICATED_PAGE_LOADERS[path] = load;

		try {
			preloadAuthenticatedPage(path);
			expect(load).toHaveBeenCalledOnce();
			await expect(load.mock.results[0]?.value).resolves.toMatchObject({
				default: expect.any(Function),
			});
		} finally {
			AUTHENTICATED_PAGE_LOADERS[path] = original;
		}
	});
});
