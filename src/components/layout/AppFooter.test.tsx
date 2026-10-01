import { render, screen, within } from "@testing-library/react";
import { AppFooter, DEVELOPER_CONTACT_LABEL } from "./AppFooter";
import { copyrightNotice, DEVELOPER_LINKS, DEVELOPER_NAME, DEVELOPER_ROLE } from "./developer";

describe("AppFooter", () => {
	it("credita o desenvolvedor com nome, cargo e aviso de direitos", () => {
		render(<AppFooter />);
		expect(screen.getByText(DEVELOPER_NAME)).toBeInTheDocument();
		expect(screen.getByText(DEVELOPER_ROLE)).toBeInTheDocument();
		expect(screen.getByText(copyrightNotice())).toBeInTheDocument();
	});

	it("lista os contatos do desenvolvedor em links externos seguros", () => {
		render(<AppFooter />);
		const nav = screen.getByRole("navigation", { name: DEVELOPER_CONTACT_LABEL });

		expect(within(nav).getAllByRole("link")).toHaveLength(DEVELOPER_LINKS.length);
		for (const { label, href } of DEVELOPER_LINKS) {
			const link = within(nav).getByRole("link", { name: `${label} (abre em nova aba)` });
			expect(link).toHaveAttribute("href", href);
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		}
	});
});
