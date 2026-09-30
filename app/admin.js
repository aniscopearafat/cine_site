const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const csrf = $('meta[name="csrf-token"]').content;
let state = null,
  section = new URLSearchParams(location.search).get("section") || "dashboard",
  page = 1,
  search = "",
  statusFilter = "",
  editing = null,
  importResults = [];
const labels = {
  dashboard: "Dashboard",
  movies: "Movies",
  series: "TV Series",
  import: "API Import",
  taxonomy: "Genres & Languages",
  watches: "Watch Links",
  downloads: "Download Links",
  reports: "Broken Link Reports",
  ads: "Ads Manager",
  apis: "Movie APIs",
  settings: "Site Settings",
  activity: "Activity Logs",
  analytics: "Download Analytics",
  moderators: "Moderators",
};
const captions = {
  dashboard: "Your catalog, activity, and download performance.",
  analytics: "Total clicks and unique download visitors.",
  moderators: "Add moderators and control their access.",
  settings: "Branding, colors, logo, favicon, and website preferences.",
};
const adminOnly = ["ads", "apis", "settings", "moderators"];
const num = (v) => Number(v || 0).toLocaleString();
const date = (v) => (v ? new Date(v).toLocaleString() : "—");
function flash(text) {
  $("#feedback").textContent = text;
  $("#feedback").classList.add("visible");
  setTimeout(() => $("#feedback").classList.remove("visible"), 4500);
}
async function api(path, body) {
  const r = await fetch("/admin/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw Error(
      "The server could not complete this request. Please try again.",
    );
  }
  if (!r.ok) throw Error(data.error || "Request failed.");
  return data;
}
async function refresh() {
  state = await api("state");
  for (const id of adminOnly)
    document.querySelector(`[data-nav="${id}"]`).hidden =
      state.role !== "admin";
  if (adminOnly.includes(section) && state.role !== "admin")
    section = "dashboard";
  render();
}
function go(id) {
  section = Object.hasOwn(labels, id) ? id : "dashboard";
  page = 1;
  search = "";
  statusFilter = "";
  history.pushState(null, "", "/admin?section=" + section);
  closeNav();
  render();
}
window.onpopstate = () => {
  section = new URLSearchParams(location.search).get("section") || "dashboard";
  render();
};
function empty(title, copy, action = "") {
  return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(copy)}</p>${action}</div>`;
}
function button(text, action, id = "", cls = "secondary") {
  return `<button type="button" class="${cls}" data-action="${action}" data-id="${esc(id)}">${esc(text)}</button>`;
}
function badge(status) {
  return `<span class="badge ${esc(status)}">${esc(status)}</span>`;
}
function titleOf(id) {
  return state.records.find((r) => r.id === id)?.title || "Deleted title";
}
function head(title, copy = "", action = "") {
  return `<div class="panel-head"><div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>${action}</div>`;
}
function pagination(total) {
  return `<div class="pagination"><span>${total ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total}` : "0 records"}</span><div>${button("Previous", "previous")}${button("Next", "next", String(total))}</div></div>`;
}
function titleRows(rows, full = true) {
  return rows
    .map(
      (r) =>
        `<tr><td><div class="row-title">${r.data.poster ? `<img src="${esc(r.data.poster)}" alt="" loading="lazy">` : `<span class="letter">${esc(r.title[0])}</span>`}<div><b>${esc(r.title)}</b><small>${esc(r.kind)} · ${r.data.year || "Year not set"}</small></div></div></td><td>${badge(r.status)}</td><td>${esc(r.data.quality || "—")}</td>${full ? `<td>${date(r.updated_at)}</td>` : ""}<td><div class="actions">${button("Edit", "edit-record", r.id)}<a class="quiet" target="_blank" rel="noopener" href="/admin/preview/${esc(r.id)}">Preview</a>${full ? button("Delete", "delete-catalog", r.id, "danger") : ""}</div></td></tr>`,
    )
    .join("");
}
function dashboard() {
  const count = (kind, status) =>
    state.counts
      .filter(
        (c) => (!kind || c.kind === kind) && (!status || c.status === status),
      )
      .reduce((s, c) => s + c.total, 0);
  const today = new Date().toISOString().slice(0, 10);
  const metrics = [
    ["▶", "Movies", count("movie")],
    ["▤", "TV series", count("series")],
    ["✓", "Published", count(null, "published")],
    ["◷", "Drafts", count(null, "draft")],
    [
      "⇩",
      "Download clicks today",
      state.metrics.find((x) => x.kind === "download")?.total || 0,
    ],
    [
      "♙",
      "Unique visitors today",
      state.visitorStats.find((x) => x.day === today)?.total || 0,
    ],
    [
      "⚑",
      "Open reports",
      state.reports.filter((x) => x.status === "open").length,
    ],
  ];
  return `<div class="quick">${button("＋ Add Movie", "add-movie", "", "primary")}${button("＋ Add Series", "add-series")}${button("⌁ API Import", "import")}${button("⇩ Download Analytics", "analytics")}</div><div class="stats-grid">${metrics.map(([icon, label, total]) => `<article class="stat"><span class="stat-icon">${icon}</span><div><small>${label}</small><strong>${num(total)}</strong></div></article>`).join("")}</div><div class="dashboard-grid"><section class="panel">${head("Latest titles", "Your most recently saved content.", button("View all", "movies"))}${state.records.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Quality</th><th>Actions</th></tr></thead><tbody>${titleRows(state.records.slice(0, 6), false)}</tbody></table></div>` : empty("Your catalog is ready", "Import metadata or add your first title.", button("Add Movie", "add-movie", "", "primary"))}</section><section class="panel">${head("Recent activity", "Saved administrator and moderator actions.")}${activityRows(state.logs.slice(0, 6))}</section></div><section class="panel">${head("Download performance", "Clicks count Continue-to-download actions. Unique visitors are estimated by browser per day.", button("View analytics", "analytics"))}${analyticsTable(5)}</section>`;
}
function activityRows(rows) {
  return rows.length
    ? rows
        .map(
          (r) =>
            `<div class="activity-item"><b>${esc(r.action)}</b><div>${esc(r.detail)}</div><small>${esc(r.actor)} · ${date(r.created_at)}</small></div>`,
        )
        .join("")
    : empty("No activity yet", "Saved actions will appear here.");
}
function analyticsTable(limit = 100) {
  const list = state.downloadStats.slice(0, limit);
  return list.length
    ? `<div class="table-wrap"><table><thead><tr><th>Title / Server</th><th>Total clicks</th><th>Today</th></tr></thead><tbody>${list
        .map((x) => {
          const l = state.links.find((y) => y.id === x.target);
          return `<tr><td><b>${esc(l ? titleOf(l.title_id) : "Deleted link")}</b><small>${esc(l?.name || x.target)}</small></td><td>${num(x.total)}</td><td>${num(x.today)}</td></tr>`;
        })
        .join("")}</tbody></table></div>`
    : empty(
        "No download clicks yet",
        "Counts appear when visitors continue to an active external download link.",
      );
}
function analytics() {
  const total = state.downloadStats.reduce((s, x) => s + x.total, 0),
    today = new Date().toISOString().slice(0, 10);
  return `<div class="stats-grid"><article class="stat"><div><small>Total download clicks</small><strong>${num(total)}</strong></div></article><article class="stat"><div><small>Clicks today</small><strong>${num(state.downloadStats.reduce((s, x) => s + x.today, 0))}</strong></div></article><article class="stat"><div><small>Unique download visitors today</small><strong>${num(state.visitorStats.find((x) => x.day === today)?.total)}</strong></div></article></div><div class="note">Unique visitors are estimated using a first-party browser cookie, not verified people. Counts use UTC days. Repeated downloads count as additional clicks.</div><section class="panel">${head("Most-clicked download links")}${analyticsTable()}</section><section class="panel">${head("Most-clicked titles")}<div class="table-wrap"><table><thead><tr><th>Title</th><th>Total clicks</th></tr></thead><tbody>${state.titleStats.map((r) => `<tr><td>${esc(titleOf(r.target))}</td><td>${num(r.total)}</td></tr>`).join("")}</tbody></table></div></section><section class="panel">${head("Unique visitors by day", "Last 30 recorded days.")}<div class="table-wrap"><table><thead><tr><th>Date (UTC)</th><th>Unique browsers</th></tr></thead><tbody>${state.visitorStats.map((r) => `<tr><td>${esc(r.day)}</td><td>${num(r.total)}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function toolbar(add, action, filters = true) {
  return `<div class="toolbar"><input id="list-search" type="search" value="${esc(search)}" placeholder="Search records…" aria-label="Search records">${filters ? `<select id="status-filter" aria-label="Filter by status"><option value="">All statuses</option>${["draft", "published", "scheduled"].map((x) => `<option ${statusFilter === x ? "selected" : ""}>${x}</option>`).join("")}</select>` : ""}${button(add, action, "", "primary")}</div>`;
}
function catalogPage() {
  let rows = state.records.filter((r) =>
    section === "movies"
      ? r.kind === "movie"
      : section === "series"
        ? r.kind === "series"
        : false,
  );
  rows = rows.filter(
    (r) =>
      (!statusFilter || r.status === statusFilter) &&
      JSON.stringify([
        r.title,
        r.data.originalTitle,
        r.data.genres,
        r.data.cast,
        r.data.languages,
      ])
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const start = (page - 1) * 20;
  return (
    toolbar(
      section === "movies"
        ? "＋ Add Movie"
        : "＋ Add Series",
      section === "movies"
        ? "add-movie"
        : "add-series",
    ) +
    `<section class="panel">${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Quality</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${titleRows(rows.slice(start, start + 20))}</tbody></table></div>${pagination(rows.length)}` : empty("No titles found", "Add a title or change your search.")}</section>`
  );
}
function watches() {
  const rows = state.watches.filter((r) =>
    JSON.stringify([r.name, titleOf(r.title_id)])
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    toolbar("＋ Add Watch Link", "add-watch", false) +
    `<div class="note">Watch links open an external website in a new tab. They do not replace the YouTube trailer player.</div><section class="panel">${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Button label</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(titleOf(r.title_id))}</td><td>${esc(r.name)}</td><td>${badge(r.active ? "active" : "disabled")}</td><td><div class="actions">${button("Edit", "edit-watch", r.id)}${button("Delete", "delete-watches", r.id, "danger")}</div></td></tr>`).join("")}</tbody></table></div>` : empty("No watch links", "Add a link that opens your external watch page.")}</section>`
  );
}
function downloads() {
  const rows = state.links.filter((r) =>
    JSON.stringify([r.name, titleOf(r.title_id), r.data])
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    toolbar("＋ Add Download Link", "add-link", false) +
    `<section class="panel">${
      rows.length
        ? `<div class="table-wrap"><table><thead><tr><th>Title / Server</th><th>Quality / Language</th><th>Clicks</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows
            .slice((page - 1) * 20, page * 20)
            .map(
              (r) =>
                `<tr><td><b>${esc(titleOf(r.title_id))}</b><small>${esc(r.name)}</small></td><td>${esc(r.data.quality || "—")}<small>${esc(r.data.language)} · ${esc(r.data.size)}</small></td><td>${num(state.downloadStats.find((x) => x.target === r.id)?.total)}</td><td>${badge(r.active ? "active" : "disabled")}</td><td><div class="actions">${button("Edit", "edit-link", r.id)}${button("Delete", "delete-downloads", r.id, "danger")}</div></td></tr>`,
            )
            .join("")}</tbody></table></div>${pagination(rows.length)}`
        : empty(
            "No download links",
            "Add a title first, then attach an authorized external destination.",
          )
    }</section>`
  );
}
function reports() {
  return `<section class="panel">${head("Broken link reports", "Resolve reports or disable the affected download link.")}${
    state.reports.length
      ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Reason</th><th>Status</th><th>Received</th><th>Actions</th></tr></thead><tbody>${state.reports
          .map((r) => {
            const link = state.links.find((x) => x.id === r.link_id);
            return `<tr><td>${esc(link ? titleOf(link.title_id) : "Removed link")}<small>${esc(link?.name)}</small></td><td>${esc(r.reason)}</td><td>${badge(r.status)}</td><td>${date(r.created_at)}</td><td><div class="actions">${button("Resolve", "resolve-report", r.id)}${button("Ignore", "ignore-report", r.id)}${link?.active ? button("Disable link", "disable-link", link.id, "danger") : ""}</div></td></tr>`;
          })
          .join("")}</tbody></table></div>`
      : empty("No reports", "Visitor reports will appear here.")
  }</section>`;
}
function ads() {
  return `<section class="panel setup-steps">${head("Add Adsterra ads in 3 steps")}<ol><li>Copy your Adsterra ad code.</li><li>Click Add Advertisement and paste the code.</li><li>Choose where it should appear, switch it on, then save.</li></ol></section><div class="quick">${button("＋ Add Advertisement", "add-ad", "", "primary")}${button("Global ad settings", "settings")}</div><div class="note">Ads are ${state.site.adsEnabled ? "enabled" : "disabled"} for visitors. Use Automatic · Every visitor page for the simplest setup. Ad code is isolated from the admin login.</div><section class="panel">${state.ads.length ? `<div class="table-wrap"><table><thead><tr><th>Ad / Provider</th><th>Slot / Device</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.ads.map((r) => `<tr><td>${esc(r.name)}<small>${esc(r.data.provider)}</small></td><td>${esc(r.slot)}<small>${esc(r.data.device)}</small></td><td>${badge(r.active ? "active" : "disabled")}</td><td><div class="actions">${button("Edit", "edit-ad", r.id)}${button("Delete", "delete-ads", r.id, "danger")}</div></td></tr>`).join("")}</tbody></table></div>` : empty("No advertisements", "Choose Automatic · Every visitor page to show your ad across the site, then enable global ads.")}</section>`;
}
function field(label, name, value = "", type = "text", extra = "") {
  return `<label class="field ${extra.includes("full") ? "full" : ""}">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra.replace("full", "")}></label>`;
}
function area(label, name, value = "", rows = 4) {
  return `<label class="field full">${label}<textarea name="${name}" rows="${rows}">${esc(value)}</textarea></label>`;
}
function select(label, name, options, value) {
  return `<label class="field">${label}<select name="${name}">${options
    .map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`;
    })
    .join("")}</select></label>`;
}
function check(label, name, value) {
  return `<label class="checks"><input type="checkbox" name="${name}" ${value ? "checked" : ""}>${label}</label>`;
}
function providerPage() {
  return `<div class="note">TVMaze works without an API key for TV series. TMDb and OMDb need your own free key. Keys are encrypted on the server and are never returned to this page.</div><div class="provider-grid">${Object.entries(
    state.providers,
  )
    .map(
      ([id, p]) =>
        `<form class="panel provider-form" data-provider="${id}"><div class="provider-logo">${id === "tmdb" ? "TM" : id === "tvmaze" ? "TV" : "OM"}</div><h2>${id === "tmdb" ? "TMDb" : id === "tvmaze" ? "TVMaze" : "OMDb"}</h2><p>${p.keyConfigured ? "API key saved" : id === "tvmaze" ? "No key required" : "API key not set"}</p>${check("Enable provider", "enabled", p.enabled)}${id !== "tvmaze" ? field("API key (leave blank to keep current)", "key", "", "password", 'autocomplete="new-password"') : ""}${field("API language", "language", p.language)}${field("Region", "region", p.region)}${id !== "tvmaze" ? check("Remove stored key", "clearKey", false) : ""}<p class="muted">${p.lastTest ? `${esc(p.lastTest.message)} · ${date(p.lastTest.at)}` : "Not tested yet"}</p><div class="form-actions"><button class="primary" type="submit">Save</button>${button("Test", "test-provider", id)}</div></form>`,
    )
    .join("")}</div>`;
}
function importPage() {
  return `<section class="panel">${head("Import movie or TV metadata", "Select a result, review the fields, then save it as a draft or publish.")}<form id="import-search" class="toolbar"><select name="provider" aria-label="Metadata provider"><option value="tvmaze">TVMaze</option><option value="tmdb">TMDb</option><option value="omdb">OMDb</option></select><select name="kind" aria-label="Type"><option value="series">TV series</option><option value="movie">Movies</option></select><input name="query" placeholder="Search by title…" aria-label="Movie or series title" required><button class="primary">Search API</button></form><p class="muted">TVMaze searches TV series only. Movies require a configured TMDb or OMDb key.</p><div id="import-error"></div></section><div id="results" class="search-results"></div>`;
}
function settingsPage() {
  const s = state.site;
  return `<form id="site-settings"><section class="panel">${head("Site identity", "Changes apply to the visitor website after saving.")}<div class="form-grid">${field("Site title", "name", s.name, "text", 'required maxlength="60"')}${area("Site description", "description", s.description, 2)}${field("Logo URL", "logo", s.logo, "text", 'placeholder="https://… or upload below"')}${field("Favicon URL", "favicon", s.favicon, "text", 'placeholder="https://… or upload below"')}<label class="field">Upload logo<input type="file" data-upload="logo" accept="image/png,image/jpeg,image/webp,image/x-icon"><small>PNG, JPG, WebP, or ICO · Maximum 512 KB</small></label><label class="field">Upload favicon<input type="file" data-upload="favicon" accept="image/png,image/jpeg,image/webp,image/x-icon"><small>PNG or ICO recommended · Maximum 512 KB</small></label></div></section><section class="panel">${head("Footer & social links", "Leave any social link blank to hide it.")}<div class="form-grid">${area("Footer text", "footerText", s.footerText, 2)}${field("Facebook page URL", "facebook", s.facebook, "url", 'placeholder="https://facebook.com/…"')}${field("Telegram channel URL", "telegram", s.telegram, "url", 'placeholder="https://t.me/…"')}${field("YouTube channel URL", "youtube", s.youtube, "url", 'placeholder="https://youtube.com/@…"')}${field("Instagram URL", "instagram", s.instagram, "url", 'placeholder="https://instagram.com/…"')}</div></section><section class="panel">${head("Site colors")}<div class="form-grid">${field("Accent / Buttons", "accent", s.accent, "color")}${field("Background", "background", s.background, "color")}${field("Panel background", "panel", s.panel, "color")}${field("Primary text", "textColor", s.textColor, "color")}</div></section><section class="panel">${head("Ads & download gateway")}<div class="form-grid">${check("Enable advertisements globally", "adsEnabled", s.adsEnabled)}${select(
    "Ad rotation",
    "adRotation",
    [
      ["priority", "Highest priority"],
      ["weighted", "Weighted rotation"],
    ],
    s.adRotation,
  )}${field("Download wait time (seconds)", "gatewaySeconds", s.gatewaySeconds, "number", 'min="0" max="300" step="1"')}<p class="muted full">Set 0 for no wait, or choose up to 300 seconds. The change applies to newly opened download pages.</p></div><div class="form-actions"><button class="primary" type="submit">Save site settings</button></div><div class="form-error"></div></section></form>`;
}
function moderators() {
  return `<div class="quick">${button("＋ Add Moderator", "add-moderator", "", "primary")}</div><div class="note">Moderators can manage movies, TV series, watch links, download links, and broken-link reports; import from enabled providers; and view download analytics. Only you can manage ads, API credentials, branding, and moderator accounts. Updating or disabling an account ends its existing sessions.</div><section class="panel">${state.moderators.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.moderators.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.username)}</td><td>${badge(r.active ? "active" : "disabled")}</td><td>${button("Edit / Reset password", "edit-moderator", r.id)}</td></tr>`).join("")}</tbody></table></div>` : empty("No moderators yet", "Add a moderator to help manage your catalog.")}</section>`;
}
function taxonomy() {
  return ["genres", "languages", "countries"]
    .map((k) => {
      const counts = {};
      for (const r of state.records)
        for (const x of r.data[k] || []) counts[x] = (counts[x] || 0) + 1;
      return `<section class="panel">${head(k[0].toUpperCase() + k.slice(1), "Edit these fields in the title editor.")}<div class="chip-list">${
        Object.entries(counts)
          .map(([x, n]) => `<span class="chip">${esc(x)} · ${n}</span>`)
          .join("") || '<p class="muted">No entries yet.</p>'
      }</div></section>`;
    })
    .join("");
}
function render() {
  if (!state) return;
  if (adminOnly.includes(section) && state.role !== "admin")
    section = "dashboard";
  $("#page-heading").textContent = labels[section] || "Dashboard";
  $("#page-caption").textContent =
    captions[section] || "Manage your saved records.";
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) => a.classList.toggle("active", a.dataset.nav === section));
  const views = {
    dashboard,
    analytics,
    movies: catalogPage,
    series: catalogPage,
    watches,
    downloads,
    reports,
    ads,
    apis: providerPage,
    import: importPage,
    settings: settingsPage,
    moderators,
    taxonomy,
    activity: () =>
      `<section class="panel">${head("Activity history", "Most recent 60 saved actions.")}${activityRows(state.logs)}</section>`,
  };
  $("#workspace").innerHTML = (views[section] || dashboard)();
  bindForms();
}
function localDate(n) {
  if (!n) return "";
  const d = new Date(n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function watchFields(link = {}) {
  return `<fieldset class="download-editor" data-watch-id="${esc(link.id || "")}"><legend>Watch link</legend><div class="form-grid">${field("Watch URL", "watch_url", link.url, "url", 'required placeholder="https://example.com/watch"')}${field("Button label", "watch_name", link.name || "Watch now", "text", 'maxlength="100"')}${check("Active watch link", "watch_active", link.active ?? true)}</div>${link.id ? "<small>Uncheck Active to hide it from visitors.</small>" : button("Remove", "remove-watch")}</fieldset>`;
}
function downloadFields(link = {}) {
  const d = link.data || {};
  return `<fieldset class="download-editor" data-link-id="${esc(link.id || "")}"><legend>Download link</legend><div class="form-grid">${field("Download URL", "link_url", link.url, "url", 'required placeholder="https://example.com/download"')}${field("Button / Server name", "link_name", link.name || "Download", "text", 'required maxlength="100"')}${field("Quality / Resolution", "link_quality", d.quality || "", "text", 'placeholder="1080p WEB-DL"')}${field("File size", "link_size", d.size || "", "text", 'placeholder="2.36 GB"')}${field("Language", "link_language", d.language || "", "text", 'placeholder="Dual Audio"')}${field("Format", "link_format", d.format || "", "text", 'placeholder="MKV · x265 · HEVC"')}${field("Source", "link_source", d.source || "", "text", 'placeholder="Direct, R2, MEGA…"')}${field("Priority", "link_priority", d.priority ?? 0, "number", 'min="0" max="1000"')}${check("Active link", "link_active", link.active ?? true)}</div>${link.id ? "<small>Uncheck Active link to hide it from visitors.</small>" : button("Remove", "remove-download")}</fieldset>`;
}
function openEditor(type, record = {}) {
  editing = { type, record: structuredClone(record) };
  const d = record.data || {};
  let content = "",
    title = "",
    copy = "";
  if (type === "catalog") {
    const kind = record.kind || "movie";
    title = record.id ? "Edit title" : "Add " + kind;
    copy =
      kind === "series"
        ? "Add TV series details, watch links, and download links."
        : "Add movie details, watch links, and download links.";
    const parentKind = kind === "season" ? "series" : "season";
    const downloads =
        record.downloads || state.links.filter((x) => x.title_id === record.id),
      watchLinks =
        record.watches || state.watches.filter((x) => x.title_id === record.id),
      child = ["season", "episode"].includes(kind);
    content = `<div class="form-grid">${field("Title", "title", record.title, "text", 'required maxlength="200"')}<label class="field">Page slug (optional)<input name="slug" value="${esc(record.slug)}" placeholder="inception" maxlength="160" pattern="[^:/?#\\s]+" aria-describedby="slug-help"><small id="slug-help">Page address: /title/inception. Leave blank to generate from the title.</small></label><section class="field full"><h3>Watch links</h3><p class="muted">These buttons open an external watch page. The YouTube trailer remains a separate player.</p><div id="title-watches">${watchLinks.map(watchFields).join("")}</div>${button("＋ Add watch link", "add-title-watch")}</section><section class="field full"><h3>Download links</h3><p class="muted">Add separate links for each server or quality. All links save with this title.</p><div id="title-downloads">${downloads.map(downloadFields).join("")}</div>${button("＋ Add download link", "add-title-download")}</section><div class="field full"><span>Browse collections</span>${check("Anime", "collection_anime", d.collections?.includes("anime"))}${check("Superhero · Marvel / DC and more", "collection_superhero", d.collections?.includes("superhero"))}</div><input type="hidden" name="kind" value="${esc(kind)}">${select("Publication status", "status", ["draft", "published", "scheduled"], record.status || "draft")}${["season", "episode"].includes(kind) ? select("Parent " + parentKind, "parent_id", [["", "Select parent"], ...state.records.filter((x) => x.kind === parentKind).map((x) => [x.id, x.title])], record.parent_id) : ""}${field("Scheduled publication", "publish_at", localDate(record.publish_at), "datetime-local")}${check("Feature on homepage", "featured", record.featured)}${field("Original title", "originalTitle", d.originalTitle)}${field("Release year", "year", d.year || "", "number", 'min="0" max="2200"')}${area("Synopsis", "overview", d.overview, 5)}${field("Poster image URL", "poster", d.poster, "url")}${field("Backdrop image URL", "backdrop", d.backdrop, "url")}${field("Genres (comma separated)", "genres", (d.genres || []).join(", "))}${field("Languages (comma separated)", "languages", (d.languages || []).join(", "))}${field("Countries (comma separated)", "countries", (d.countries || []).join(", "))}${field("Release date", "releaseDate", d.releaseDate)}${field("Runtime (minutes)", "runtime", d.runtime || "", "number", 'min="0"')}${field("Rating (0–10)", "rating", d.rating || "", "number", 'min="0" max="10" step="0.1"')}${field("Rating provider", "ratingProvider", d.ratingProvider)}${field("Quality badge", "quality", d.quality, "text", 'placeholder="1080p WEB-DL"')}${field("Director / Creator", "director", d.director)}${field("Writers", "writers", d.writers)}${area("Main cast", "cast", d.cast, 2)}${field("YouTube trailer URL", "trailer", d.trailer, "url")}${field("Season / Episode number", "number", d.number || "", "number", 'min="0"')}${field("SEO title", "seoTitle", d.seoTitle)}${field("Meta description", "metaDescription", d.metaDescription)}${field("IMDb ID", "imdbId", d.imdbId)}${field("Metadata source URL", "sourceUrl", d.sourceUrl, "url")}</div>${d.providerId ? `<div class="note">Imported from ${esc(d.provider)} · ${esc(d.providerId)}</div><div class="quick">${button("Update metadata", "update-metadata")}${check("Replace existing fields", "replaceExisting", false)}</div>` : ""}`;
    if (child) {
      content = `<input type="hidden" name="kind" value="${esc(kind)}"><div class="form-grid">${field(kind === "season" ? "Season title" : "Episode title", "title", record.title, "text", 'required maxlength="200"')}<label class="field">Page slug (optional)<input name="slug" value="${esc(record.slug)}" placeholder="${kind}-1" maxlength="160"></label>${select("Publication status", "status", ["draft", "published", "scheduled"], record.status || "draft")}${select("Parent " + parentKind, "parent_id", [["", "Select " + parentKind], ...state.records.filter((x) => x.kind === parentKind).map((x) => [x.id, x.title])], record.parent_id)}${field("Scheduled publication", "publish_at", localDate(record.publish_at), "datetime-local")}${field(kind === "season" ? "Season number" : "Episode number", "number", d.number || "", "number", 'required min="0"')}${area("Short description", "overview", d.overview, 3)}<section class="field full"><h3>Watch links</h3><div id="title-watches">${watchLinks.map(watchFields).join("")}</div>${button("＋ Add watch link", "add-title-watch")}</section><section class="field full"><h3>Download links</h3><div id="title-downloads">${downloads.map(downloadFields).join("")}</div>${button("＋ Add download link", "add-title-download")}</section></div>`;
    }
  } else if (type === "watches") {
    title = record.id ? "Edit watch link" : "Add watch link";
    copy = "The button opens this external URL in a new tab.";
    content = `<div class="form-grid">${select("Movie / Series / Season / Episode", "title_id", [["", "Choose title"], ...state.records.map((r) => [r.id, r.title + " (" + r.kind + ")"])], record.title_id)}${field("Button label", "name", record.name || "Watch now", "text", "required")}${field("Watch URL", "url", record.url, "url", "required full")}${check("Active watch link", "active", record.active ?? true)}</div>`;
  } else if (type === "downloads") {
    title = record.id ? "Edit download link" : "Add download link";
    copy = "Use destinations you are authorized to distribute.";
    content = `<div class="form-grid">${select("Movie / Series / Season / Episode", "title_id", [["", "Choose title"], ...state.records.map((r) => [r.id, r.title + " (" + r.kind + ")"])], record.title_id)}${field("Server name", "name", record.name, "text", "required")}${field("Download URL", "url", record.url, "url", "required full")}${field("Quality / Resolution", "quality", d.quality)}${field("File size", "size", d.size)}${field("Language", "language", d.language)}${field("Format", "format", d.format)}${field("Source", "source", d.source)}${field("Priority", "priority", d.priority || 0, "number", 'min="0" max="1000"')}${check("Active download link", "active", record.active ?? true)}</div>`;
  } else if (type === "ads") {
    title = record.id ? "Edit advertisement" : "Add advertisement";
    copy = "Paste your Adsterra code and choose where visitors should see it.";
    content = `<div class="note"><b>Recommended:</b> Automatic · Every visitor page, All devices, and Enable ad.</div><div class="form-grid">${field("Ad name", "name", record.name || "Adsterra Ad", "text", "required")}${field("Ad network", "provider", d.provider || "Adsterra", "text", "required")}${select(
      "Show this ad on",
      "slot",
      [
        ["all-pages", "Automatic · Every visitor page"],
        ["homepage-top", "Homepage · Top"],
        ["homepage-middle", "Homepage · Middle"],
        ["sidebar", "Homepage · Sidebar"],
        ["movie-top", "Title page · Top"],
        ["before-downloads", "Title page · Before downloads"],
        ["gateway-top", "Download page · Top"],
        ["footer", "Footer area"],
      ],
      record.slot || "all-pages",
    )}${select(
      "Devices",
      "device",
      [
        ["all", "All devices"],
        ["desktop", "Desktop only"],
        ["tablet", "Tablet only"],
        ["mobile", "Mobile only"],
      ],
      d.device || "all",
    )}${area("Paste Adsterra ad code", "code", d.code, 10)}${check("Enable this ad", "active", record.active || false)}</div><details class="advanced-fields"><summary>Advanced options</summary><div class="form-grid">${field("Banner width (0 = responsive)", "width", d.width || 0, "number", 'min="0" max="2000"')}${field("Banner height", "height", d.height || 250, "number", 'min="50" max="1200"')}${field("Start date", "start", localDate(d.start), "datetime-local")}${field("End date", "end", localDate(d.end), "datetime-local")}${field("Priority", "priority", d.priority || 0, "number", 'min="0" max="1000"')}${field("Rotation weight", "weight", d.weight || 1, "number", 'min="1" max="1000"')}</div></details>`;
  } else {
    title = record.id ? "Edit moderator" : "Add moderator";
    copy =
      "Moderator access excludes account, ad, API-key, and site-setting changes.";
    content = `<div class="form-grid">${field("Display name", "name", record.name, "text", "required")}${field("Username", "username", record.username, "text", 'required pattern="[a-z0-9_.-]{3,60}"')}${field(record.id ? "New password (leave blank to keep current)" : "Password", "password", "", "password", `autocomplete="new-password" minlength="8" ${record.id ? "" : "required"}`)}${check("Account enabled", "active", record.active ?? true)}</div>`;
  }
  $("#edit-form").innerHTML =
    `<div class="modal-heading"><div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>${button("×", "close-editor", "", "icon")}</div>${content}<div class="form-error" role="alert"></div><div class="form-actions">${button("Cancel", "close-editor")}${type === "catalog" ? '<button class="secondary" type="submit" data-status="draft">Save Draft</button><button class="secondary" type="submit" data-status="published">Publish</button>' : ""}<button class="primary" type="submit">Save changes</button></div>`;
  if (!$("#editor").open) $("#editor").showModal();
}
function formObject(form) {
  const b = Object.fromEntries(new FormData(form));
  form
    .querySelectorAll("input[type=checkbox]")
    .forEach((x) => (b[x.name] = x.checked));
  return b;
}
function recordFromForm() {
  const b = formObject($("#edit-form")),
    r = editing.record;
  return {
    id: r.id,
    updated_at: r.updated_at,
    title: b.title,
    slug: b.slug,
    kind: b.kind,
    status: b.status,
    publish_at: b.publish_at,
    featured: b.featured,
    parent_id: b.parent_id,
    watches: [...$("#title-watches").querySelectorAll(".download-editor")].map(
      (el) => ({
        id: el.dataset.watchId || undefined,
        url: el.querySelector("[name=watch_url]").value,
        name: el.querySelector("[name=watch_name]").value,
        active: el.querySelector("[name=watch_active]").checked,
      }),
    ),
    downloads: [
      ...$("#title-downloads").querySelectorAll(".download-editor"),
    ].map((el) => ({
      id: el.dataset.linkId || undefined,
      url: el.querySelector("[name=link_url]").value,
      name: el.querySelector("[name=link_name]").value,
      active: el.querySelector("[name=link_active]").checked,
      data: {
        quality: el.querySelector("[name=link_quality]").value,
        size: el.querySelector("[name=link_size]").value,
        language: el.querySelector("[name=link_language]").value,
        format: el.querySelector("[name=link_format]").value,
        source: el.querySelector("[name=link_source]").value,
        priority: el.querySelector("[name=link_priority]").value,
      },
    })),
    data: {
      ...r.data,
      collections: [
        b.collection_anime ? "anime" : null,
        b.collection_superhero ? "superhero" : null,
      ].filter(Boolean),
      ...Object.fromEntries(
        [
          "originalTitle",
          "overview",
          "year",
          "releaseDate",
          "runtime",
          "rating",
          "ratingProvider",
          "genres",
          "languages",
          "countries",
          "cast",
          "director",
          "writers",
          "poster",
          "backdrop",
          "trailer",
          "quality",
          "number",
          "seoTitle",
          "metaDescription",
          "imdbId",
          "sourceUrl",
        ]
          .map((k) => [k, b[k]])
          .filter(([, v]) => v !== undefined),
      ),
    },
  };
}
async function saveEditor(e) {
  e.preventDefault();
  const form = e.currentTarget,
    submit = e.submitter;
  const b = formObject(form);
  let body;
  if (editing.type === "catalog") {
    body = recordFromForm();
    if (submit?.dataset.status) body.status = submit.dataset.status;
  } else if (editing.type === "moderators")
    body = { ...b, id: editing.record.id };
  else body = { ...b, id: editing.record.id, data: b };
  form.querySelectorAll("button").forEach((x) => (x.disabled = true));
  try {
    await api(editing.type, body);
    $("#editor").close();
    flash("Changes saved.");
    await refresh();
  } catch (err) {
    const target = form.querySelector(".form-error");
    target.textContent = err.message;
    target.className = "form-error error-box";
    if (!$("#editor").open)
      flash("Saved, but refresh failed. Reload the page.");
  } finally {
    form.querySelectorAll("button").forEach((x) => (x.disabled = false));
  }
}
$("#edit-form").onsubmit = saveEditor;
function bindForms() {
  $("#list-search")?.addEventListener("input", (e) => {
    search = e.target.value;
    page = 1;
    const p = e.target.selectionStart;
    render();
    $("#list-search").focus();
    $("#list-search").setSelectionRange(p, p);
  });
  $("#status-filter")?.addEventListener("change", (e) => {
    statusFilter = e.target.value;
    page = 1;
    render();
  });
  document.querySelectorAll(".provider-form").forEach(
    (form) =>
      (form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        try {
          await api("providers", {
            ...formObject(form),
            provider: form.dataset.provider,
          });
          flash("Provider settings saved.");
          await refresh();
        } catch (err) {
          flash(err.message);
          btn.disabled = false;
        }
      }),
  );
  $("#site-settings")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      btn = e.submitter;
    btn.disabled = true;
    try {
      await api("settings", formObject(form));
      flash("Site branding and settings saved.");
      await refresh();
    } catch (err) {
      const box = form.querySelector(".form-error");
      box.textContent = err.message;
      box.className = "form-error error-box";
      btn.disabled = false;
    }
  });
  document.querySelectorAll("[data-upload]").forEach(
    (input) =>
      (input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 512 * 1024) {
          flash("Please choose an image under 512 KB.");
          return;
        }
        input.disabled = true;
        try {
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const r = await api("upload", { base64: data });
          input.form.elements[input.dataset.upload].value = r.url;
          flash("Image uploaded. Save site settings to apply it.");
        } catch (err) {
          flash(err.message);
        } finally {
          input.disabled = false;
        }
      }),
  );
  $("#import-search")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    $("#import-error").textContent = "";
    try {
      const r = await api("provider-search", formObject(e.currentTarget));
      importResults = r.results;
      $("#results").innerHTML = r.results.length
        ? r.results
            .map(
              (x, i) =>
                `<article class="search-result">${x.poster ? `<img src="${esc(x.poster)}" alt="">` : ""}<div><h3>${esc(x.title)}</h3><p>${x.year || "Year unavailable"} · ${esc(x.kind)} · ${esc(x.provider)}</p>${button("Select", "select-import", String(i), "primary")}</div></article>`,
            )
            .join("")
        : empty("No results", "Try a different title.");
    } catch (err) {
      $("#import-error").textContent = err.message;
      $("#import-error").className = "error-box";
    } finally {
      btn.disabled = false;
    }
  });
}
document.addEventListener("click", async (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) {
    e.preventDefault();
    go(nav.dataset.nav);
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action,
    id = b.dataset.id;
  try {
    if (Object.hasOwn(labels, a)) {
      go(a);
      return;
    }
    if (a === "add-title-watch") {
      $("#title-watches").insertAdjacentHTML("beforeend", watchFields());
      return;
    }
    if (a === "remove-watch") {
      b.closest(".download-editor").remove();
      return;
    }
    if (a === "add-title-download") {
      $("#title-downloads").insertAdjacentHTML("beforeend", downloadFields());
      return;
    }
    if (a === "remove-download") {
      b.closest(".download-editor").remove();
      return;
    }
    if (a === "close-editor") {
      $("#editor").close();
      return;
    }
    if (a === "previous") {
      page = Math.max(1, page - 1);
      render();
      return;
    }
    if (a === "next") {
      page = Math.min(Math.ceil(Number(id) / 20) || 1, page + 1);
      render();
      return;
    }
    if (["add-movie", "add-series"].includes(a)) {
      openEditor("catalog", { kind: a.slice(4) });
      return;
    }
    if (a === "edit-record") {
      openEditor(
        "catalog",
        state.records.find((r) => r.id === id),
      );
      return;
    }
    if (a === "add-watch" || a === "edit-watch") {
      openEditor("watches", state.watches.find((r) => r.id === id) || {});
      return;
    }
    if (a === "add-link" || a === "edit-link") {
      openEditor("downloads", state.links.find((r) => r.id === id) || {});
      return;
    }
    if (a === "add-ad" || a === "edit-ad") {
      openEditor("ads", state.ads.find((r) => r.id === id) || {});
      return;
    }
    if (a === "add-moderator" || a === "edit-moderator") {
      openEditor("moderators", state.moderators.find((r) => r.id === id) || {});
      return;
    }
    b.disabled = true;
    if (a.startsWith("delete-")) {
      if (
        !confirm(
          "Delete this record? Deleting a title also removes its child seasons, episodes, links, and reports.",
        )
      )
        return;
      await api("delete", { entity: a.slice(7), id });
      flash("Record deleted.");
      await refresh();
    } else if (a === "test-provider") {
      const r = await api("provider-test", { provider: id });
      flash(r.message);
      await refresh();
    } else if (a === "select-import") {
      const result = importResults[Number(id)],
        r = await api("provider-detail", result);
      openEditor("catalog", r.record);
    } else if (a === "update-metadata") {
      const current = recordFromForm();
      const r = await api("provider-detail", {
        provider: current.data.provider,
        id: current.data.providerId,
        kind: current.kind,
      });
      const replace = $("#edit-form").elements.replaceExisting.checked;
      const data = { ...current.data };
      for (const [key, val] of Object.entries(r.record.data)) {
        if (
          replace ||
          data[key] == null ||
          data[key] === "" ||
          data[key] === 0 ||
          (Array.isArray(data[key]) && !data[key].length)
        )
          data[key] = val;
      }
      for (const key of ["genres", "languages", "countries"])
        if (typeof data[key] === "string")
          data[key] = data[key]
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
      openEditor("catalog", {
        ...current,
        title: replace ? r.record.title : current.title,
        data,
      });
      flash("Metadata loaded. Review and save your changes.");
    } else if (a === "resolve-report" || a === "ignore-report") {
      await api("reports", {
        id,
        status: a === "resolve-report" ? "resolved" : "ignored",
      });
      await refresh();
      flash("Report updated.");
    } else if (a === "disable-link") {
      await api("downloads", {
        ...state.links.find((x) => x.id === id),
        active: false,
      });
      await refresh();
      flash("Download link disabled.");
    }
  } catch (err) {
    flash(err.message);
  } finally {
    b.disabled = false;
  }
});
$("#edit-form").addEventListener("change", (e) => {
  if (e.target.name === "kind") {
    const record = recordFromForm();
    for (const key of ["genres", "languages", "countries"])
      record.data[key] = String(record.data[key] || "")
        .split(",")
        .filter(Boolean);
    openEditor("catalog", record);
  }
});
$("#menu").onclick = () => {
  const open = !$("#navigation").classList.contains("open");
  $("#navigation").classList.toggle("open", open);
  $("#scrim").classList.toggle("open", open);
  $("#menu").setAttribute("aria-expanded", open);
};
function closeNav() {
  $("#navigation").classList.remove("open");
  $("#scrim").classList.remove("open");
  $("#menu").setAttribute("aria-expanded", false);
}
$("#scrim").onclick = closeNav;
refresh().catch((e) => {
  $("#workspace").innerHTML =
    `<section class="panel empty"><h2>Unable to load the dashboard</h2><p>${esc(e.message)}</p><a class="primary" href="/admin">Try again</a></section>`;
});
