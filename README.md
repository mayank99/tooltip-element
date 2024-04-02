# tooltip-element

An accessible tooltip built using web components and `@floating-ui/dom`.

See `Tooltip.js` for source code and `index.html` for example usage.

Codesandbox demo: https://codesandbox.io/s/github/mayank99/tooltip-element

## Usage

Import the Tooltip class and call `.register()` on it, optionally passing `triggerTag` into it.
```js
import { Tooltip } from './Tooltip.js';
Tooltip.register();
```

Now the tooltip can be used by wrapping it around the element that should trigger it on hover/focus. The `text` attribute will be used to populate the tooltip text. By default, tooltip does not add any ARIA attributes, so the trigger element must bring its own label.

```html
<tool-tip text='Save file' style='display: contents'>
	<button>
		<span aria-hidden='true'>💾</span>
		<span class='visually-hidden'>Save file</span>
	</button>
</tool-tip>
```

Alternatively, the tooltip can be automatically be associated with the trigger using `aria-describedby`. To opt into this, pass `aria="description"`.

```html
<tool-tip
	text='Deletion might take a minute'
	aria='description'
	style='display: contents'
>
	<button>Delete project</button>
</tool-tip>
```

Important: `display: contents` must be set in CSS or as an inline style, in order to keep the custom element from participating in layout.
