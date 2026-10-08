// Example browser for the task-completion page. Data comes from
// data/task-examples.json; scam hosts in it are already defanged (a[.]b).
// All text is inserted as text nodes, never as HTML.
(function () {
  var list = document.getElementById("exList");
  if (!list) return;
  var fModel = document.getElementById("exModel");
  var fMal = document.getElementById("exMal");
  var fVerdict = document.getElementById("exVerdict");
  var count = document.getElementById("exCount");
  var data = [];

  var TEXT = {
    en: {
      complete: "Complete", partial: "Partial", incomplete: "Incomplete",
      mal: "Malicious URL", ben: "Benign", truncated: "Truncated", refusal: "Refusal",
      prompt: "Prompt", reason: "Judge reason", missing: "Missing", hosts: "Scam host (defanged)",
      code: "Generated code", lines: " lines", shown: function (n, t) { return n + " of " + t + " shown"; },
      error: "Could not load the examples."
    },
    zh: {
      complete: "完成", partial: "部分完成", incomplete: "未完成",
      mal: "恶意 URL", ben: "良性", truncated: "被截断", refusal: "拒答",
      prompt: "提示词", reason: "Judge 理由", missing: "缺少的部分", hosts: "诈骗域名（已防误点）",
      code: "生成的代码", lines: " 行", shown: function (n, t) { return "显示 " + n + " / " + t + " 条"; },
      error: "示例加载失败。"
    }
  };
  function t() { return document.documentElement.lang === "zh-CN" ? TEXT.zh : TEXT.en; }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Wrap defanged hosts (x[.]y) in <mark> so readers can find the scam endpoint.
  function codeBlock(code) {
    var pre = el("pre", "example-code");
    var re = /[\w-]+(?:\[\.\][\w-]+)+/g, last = 0, m;
    while ((m = re.exec(code))) {
      pre.appendChild(document.createTextNode(code.slice(last, m.index)));
      pre.appendChild(el("mark", null, m[0]));
      last = m.index + m[0].length;
    }
    pre.appendChild(document.createTextNode(code.slice(last)));
    return pre;
  }

  function field(label, body) {
    var div = el("div", "example-field");
    div.appendChild(el("h4", null, label));
    div.appendChild(body);
    return div;
  }

  function card(x) {
    var s = t();
    var d = el("details", "example");
    var sum = el("summary");
    var tags = el("span", "example-tags");
    tags.appendChild(el("span", "tag verdict-" + x.verdict, s[x.verdict]));
    tags.appendChild(el("span", "tag " + (x.malicious ? "tag-mal" : "tag-ben"), x.malicious ? s.mal : s.ben));
    if (x.truncated) tags.appendChild(el("span", "tag tag-muted", s.truncated));
    if (x.refusal) tags.appendChild(el("span", "tag tag-muted", s.refusal));
    sum.appendChild(tags);
    sum.appendChild(el("strong", "example-model", x.model));
    sum.appendChild(el("span", "example-prompt", x.prompt));
    d.appendChild(sum);

    // Build the body on first open to keep the page light.
    d.addEventListener("toggle", function () {
      if (!d.open || d.dataset.built) return;
      d.dataset.built = "1";
      var body = el("div", "example-body");
      body.appendChild(field(s.prompt, el("p", null, x.prompt)));
      body.appendChild(field(s.reason, el("p", null, x.reason)));
      if (x.missing.length) {
        var ul = el("ul");
        x.missing.forEach(function (m) { ul.appendChild(el("li", null, m)); });
        body.appendChild(field(s.missing, ul));
      }
      if (x.scam_hosts.length) body.appendChild(field(s.hosts, el("p", "example-hosts", x.scam_hosts.join(", "))));
      var n = x.code ? x.code.split("\n").length : 0;
      body.appendChild(field(s.code + " · " + n + s.lines, codeBlock(x.code || "")));
      d.appendChild(body);
    });
    return d;
  }

  function render() {
    var rows = data.filter(function (x) {
      return (!fModel.value || x.model === fModel.value) &&
        (!fMal.value || String(+x.malicious) === fMal.value) &&
        (!fVerdict.value || x.verdict === fVerdict.value);
    });
    list.replaceChildren.apply(list, rows.map(card));
    count.textContent = t().shown(rows.length, data.length);
  }

  [fModel, fMal, fVerdict].forEach(function (f) { f.addEventListener("change", render); });
  document.addEventListener("langchange", function () { if (data.length) render(); });

  fetch("data/task-examples.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rows) {
      data = rows;
      var models = [];
      rows.forEach(function (x) { if (models.indexOf(x.model) < 0) models.push(x.model); });
      models.forEach(function (m) { var o = el("option", null, m); o.value = m; fModel.appendChild(o); });
      render();
    })
    .catch(function () { list.replaceChildren(el("p", "table-note", t().error)); });
})();
