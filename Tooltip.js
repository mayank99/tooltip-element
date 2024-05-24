import { computePosition, flip, shift, offset } from "@floating-ui/dom";

function roundByDPR(value) {
	const dpr = window.devicePixelRatio || 1;
	return Math.round(value * dpr) / dpr;
}

export class Tooltip extends HTMLElement {
	constructor() {
		super();
		this.tooltipName = `${this.tagName}-content`;

		this.attachShadow({ mode: "open" });
		this.shadowRoot?.appendChild(this.ownerDocument.createElement("slot"));
		this.addStyles();
	}

	static register({ tagName = "tool-tip" } = {}) {
		if (customElements.get(tagName) === undefined) {
			customElements.define(tagName, this);
		}
	}

	connectedCallback() {
		if (!this.firstElementChild) return;
		this.trigger = this.firstElementChild;

		this.tooltip = this.ownerDocument.createElement(this.tooltipName);
		this.tooltip.textContent = this.getAttribute("text");
		this.tooltip.setAttribute("aria-hidden", "true");
		this.tooltip.setAttribute("popover", "manual");
		this.shadowRoot?.appendChild(this.tooltip);

		if (this.getAttribute("type") === "description") {
			this.trigger.setAttribute(
				"aria-description",
				this.getAttribute("text") || ""
			);
		}

		this.setupEventHandlers();
	}

	setupEventHandlers() {
		function hovered() {
			this.hovered = true;
			this.show();
		}
		function unhovered() {
			this.hovered = false;
			this.hide();
		}
		function focused() {
			this.focused = true;
			this.show();
		}
		function unfocused() {
			this.focused = false;
			this.hide();
		}

		if (matchMedia("(hover: hover)").matches) {
			this.trigger.addEventListener("pointerenter", hovered.bind(this));
			this.trigger.addEventListener("pointerleave", unhovered.bind(this));
			this.trigger.addEventListener("focus", focused.bind(this));
			this.trigger.addEventListener("blur", unfocused.bind(this));
		}

		this.tooltip.addEventListener("pointerenter", hovered.bind(this));
		this.tooltip.addEventListener("pointerleave", unhovered.bind(this));

		this.ownerDocument.addEventListener(
			"keydown",
			function ({ key, ctrlKey }) {
				if (key === "Escape" || ctrlKey) {
					this.tooltip.togglePopover?.(false);
				}
			}.bind(this)
		);

		async function pointerdown(e) {
			if (e.pointerType !== "touch") return;
			this.tapping = true;

			await new Promise((resolve) => setTimeout(resolve, 500));
			if (!this.tapping) return;

			navigator.vibrate(10);
			this.show();
		}
		async function pointerup(e) {
			if (e.pointerType !== "touch") return;
			this.tapping = false;

			await new Promise((resolve) => setTimeout(resolve, 1500));
			this.hide();
		}

		this.trigger.addEventListener("pointerdown", pointerdown.bind(this));
		this.trigger.addEventListener("pointerup", pointerup.bind(this));
		this.trigger.addEventListener("pointerleave", pointerup.bind(this));
	}

	async show() {
		await new Promise((resolve) => setTimeout(resolve, 100));

		if (!this.hovered && !this.focused && !this.tapping) return;
		this.tooltip.togglePopover?.(true);

		const { x, y } = await computePosition(this.trigger, this.tooltip, {
			placement: "top",
			middleware: [offset(4), flip(), shift({ padding: 4 })],
		});
		this.tooltip.style.transform = `translate(${roundByDPR(x)}px,${roundByDPR(
			y
		)}px)`;
	}

	async hide() {
		await new Promise((resolve) => setTimeout(resolve, 100));
		if (this.focused || this.hovered) return;
		this.tooltip.togglePopover?.(false);
	}

	addStyles(tooltipTag = this.tooltipName.toLowerCase()) {
		const cssText = `\
			${tooltipTag} {
				box-sizing: border-box;
				margin: unset;
				inset: 0;
				overflow: visible;
				display: block;
				position: absolute;
				color: white;
				background: hsl(0 0% 0% / 0.5);
				backdrop-filter: blur(5px);
				border: 1px solid hsl(0 0% 50%);
				padding-inline: 8px;
				padding-block: 4px;
				border-radius: 4px;
				font-size: max(90%, 1rem);
				inline-size: max-content;
				max-inline-size: min(90vi, 30ch);
				z-index: 9999;
			}
			${tooltipTag}:not(:popover-open) {
				display: none !important;
			}
			${tooltipTag}::before {
				box-sizing: border-box;
				content: '';
				position: absolute;
				inset: -5px;
				z-index: -1;
			}
		`;
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(cssText);
		this.shadowRoot?.adoptedStyleSheets.push(sheet);
	}

	static get observedAttributes() {
		return ["text", "type"];
	}

	attributeChangedCallback(name, old, value) {
		if (name === "text" && this.tooltip) {
			this.tooltip.textContent = this.getAttribute("text");
		}
		if (name === "type" && value === "description") {
			this.trigger?.setAttribute(
				"aria-description",
				this.getAttribute("text") || ""
			);
		}
		if (name === "type" && old === "description" && value !== "description") {
			this.trigger?.removeAttribute("aria-description");
		}
	}

	disconnectedCallback() {
		this.tooltip?.togglePopover?.(false);
		this.tooltip.remove();
	}
}
