// ── Data ──────────────────────────────────────────────────────────────────
const allSubdomains = {{.Subdomains}};
const allHTTP       = {{.HTTPResults}};
const allPorts      = {{.PortResults}};
const domainStats   = {{.DomainStats}};
const sourceStats   = {{.SourceStats}};
const statusStats   = {{.StatusStats}};
const techStats     = {{.TechStats}};
const screenshots   = {{.Screenshots}};
const diffData      = {{.DiffData}};
const waybackRaw    = {{.WaybackData}};
const takeoverData  = {{.TakeoverData}};
const ITEMS_PER_PAGE = {{.ItemsPerPage}};

// ── State ────────────────────────────────────────────────────────────────
let filteredSubdomains = [...allSubdomains];
let subPage = 1, httpPage_ = 1, portsPage_ = 1;
let activeTab = 'subdomains';
let sortState = {}; // { tableId: { key, dir } }
