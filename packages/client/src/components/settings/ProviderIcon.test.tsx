import { cleanup, render } from "@testing-library/react/pure";
import { afterEach, describe, expect, it } from "vitest";
import { ProviderIcon } from "./ProviderIcon";

describe("ProviderIcon", () => {
  afterEach(cleanup);

  it("should render Google icon for 'google' provider", () => {
    const { container } = render(<ProviderIcon provider="google" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Microsoft icon for 'azure' provider", () => {
    const { container } = render(<ProviderIcon provider="azure" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Github icon for 'github' provider", () => {
    const { container } = render(<ProviderIcon provider="github" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Apple icon for 'apple' provider", () => {
    const { container } = render(<ProviderIcon provider="apple" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Facebook icon for 'facebook' provider", () => {
    const { container } = render(<ProviderIcon provider="facebook" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Twitter icon for 'twitter' provider", () => {
    const { container } = render(<ProviderIcon provider="twitter" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Gitlab icon for 'gitlab' provider", () => {
    const { container } = render(<ProviderIcon provider="gitlab" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Slack icon for 'slack' provider", () => {
    const { container } = render(<ProviderIcon provider="slack" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Linkedin icon for 'linkedin' provider", () => {
    const { container } = render(<ProviderIcon provider="linkedin" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Supabase icon for 'supabase' provider", () => {
    const { container } = render(<ProviderIcon provider="supabase" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should render Google Apps Script icon for 'gas' provider", () => {
    const { container } = render(<ProviderIcon provider="gas" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("should return null for unknown provider 'keycloak'", () => {
    const { container } = render(<ProviderIcon provider="keycloak" />);
    expect(container.innerHTML).toBe("");
  });

  it("should return null for unknown provider 'saml'", () => {
    const { container } = render(<ProviderIcon provider="saml" />);
    expect(container.innerHTML).toBe("");
  });

  const KNOWN_PROVIDERS = [
    "google",
    "azure",
    "github",
    "apple",
    "facebook",
    "twitter",
    "gitlab",
    "slack",
    "linkedin",
    "supabase",
    "gas",
  ];

  it.each(
    KNOWN_PROVIDERS,
  )("should set aria-hidden='true' on %s provider icon", (provider) => {
    const { container } = render(<ProviderIcon provider={provider} />);
    const svgElement = container.querySelector("svg");
    expect(svgElement).not.toBeNull();
    expect(svgElement!.getAttribute("aria-hidden")).toBe("true");
  });
});
