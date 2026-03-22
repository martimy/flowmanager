(function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .ac-wrap  { position: relative; width: 100%; }
    .ac-list  {
      position: absolute; z-index: 200; top: 100%; left: 0; right: 0;
      margin-top: 2px; padding: 4px 0;
      background: var(--white); border: 1.5px solid var(--pcolor-1);
      border-radius: 6px; box-shadow: var(--shadow-md);
      max-height: 220px; overflow-y: auto; list-style: none;
    }
    .ac-item  { display: flex; align-items: baseline; gap: 8px; padding: 6px 10px; cursor: pointer; font-size: 12.5px; }
    .ac-item:hover, .ac-item-active { background: #eff6ff; }
    .ac-key   { font-family: 'DM Mono', monospace; color: var(--text-main); }
    .ac-label { color: var(--text-muted); font-size: 11px; }
  `;
  document.head.appendChild(style);
})();

Vue.component("autocomplete-input", {
  template: `
    <div class="ac-wrap">
      <input
        class="kv-input"
        v-bind="$attrs"
        :value="value"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
        @focus="onFocus"
      />
      <ul v-if="open && filtered.length" class="ac-list">
        <li
          v-for="(item, i) in filtered"
          :key="item.key"
          class="ac-item"
          :class="{ 'ac-item-active': i === cursor }"
          @mousedown.prevent="select(item)"
        >
          <span class="ac-key">{{ item.key }}</span>
          <span v-if="item.label" class="ac-label">{{ item.label }}</span>
        </li>
      </ul>
    </div>`,
  inheritAttrs: false,
  props: {
    value: { type: String, default: "" },
    options: { type: Array, default: () => [] },
  },
  data() {
    return { open: false, cursor: -1 };
  },
  computed: {
    filtered() {
      const q = (this.value || "").toLowerCase();
      if (!q) return this.options.slice(0, 80);
      return this.options
        .filter(
          (o) => o.key.toLowerCase().startsWith(q), //|| (o.label && o.label.toLowerCase().includes(q))
        )
        .slice(0, 80);
    },
  },
  methods: {
    onInput(e) {
      this.$emit("input", e.target.value);
      this.open = true;
      this.cursor = -1;
    },
    onFocus() {
      this.open = true;
    },
    onBlur() {
      setTimeout(() => {
        this.open = false;
      }, 150);
    },
    onKeydown(e) {
      if (!this.open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.cursor = Math.min(this.cursor + 1, this.filtered.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.cursor = Math.max(this.cursor - 1, 0);
      } else if (e.key === "Enter" && this.cursor >= 0) {
        e.preventDefault();
        this.select(this.filtered[this.cursor]);
      } else if (e.key === "Escape") {
        this.open = false;
      }
    },
    select(item) {
      this.$emit("input", item.key);
      this.$emit("change", item.key);
      this.open = false;
      this.cursor = -1;
    },
  },
});
