// Better USACO Solution Pages
// USACO editorials live at https://usaco.org/current/data/sol_*.html. Those
// pages ship no stylesheet at all -- the browser renders them as Times New
// Roman spanning the full window -- and their syntax highlighter is pulled from
// google-code-prettify.googlecode.com, a host that has been dead since Google
// Code shut down in 2016, so <pre class="prettyprint"> has never actually been
// highlighted. This file rebuilds the page locally: a readable column, a header
// linking back to the contest, our own highlighter, and an optional spoiler
// guard.
//
// Injected alongside content.js. Content scripts from the same extension share
// one isolated world, so this file reuses createCopyButton() from content.js,
// and content.js drives the two entry points below from applyStyles() /
// removeStyles(). Both are idempotent, matching enhanceSamples().

const SOLUTION_PATH_RE = /\/current\/data\/sol_[^/]*\.html$/i;
const SOLUTION_PAGE_CLASS = "busaco-solution-page";
const SOLUTION_ROOT_CLASS = "busaco-solution";
const SOLUTION_BODY_CLASS = "busaco-solution-body";
const CODE_CLASS = "busaco-code";
const CODE_HIDDEN_CLASS = "busaco-code-hidden";

// Code blocks the reader has clicked through, so that a re-run of applyStyles()
// (settings change, navigation observer) does not hide them again. Keyed by the
// wrapper element, so a full teardown and rebuild starts over -- which is what
// you want, since that is a fresh page state.
const revealedCodeBlocks = new WeakSet();
// The "(Analysis by ...)" node, lifted into the header; kept for restoring
let solutionByline = null;
let solutionTitle = null;

function isSolutionPage() {
    return SOLUTION_PATH_RE.test(location.pathname);
}

// --- Entry points ---------------------------------------------------------

function enhanceSolutionPage(spoilerGuard) {
    if (!isSolutionPage() || !document.body) {
        return;
    }

    let root = document.querySelector(`.${SOLUTION_ROOT_CLASS}`);
    if (!root) {
        root = buildSolutionLayout();
        enhanceCodeBlocks(root);
    }

    document.documentElement.classList.add(SOLUTION_PAGE_CLASS);
    updateSpoilerGuard(root, spoilerGuard);
}

function removeSolutionEnhancements() {
    const root = document.querySelector(`.${SOLUTION_ROOT_CLASS}`);
    document.documentElement.classList.remove(SOLUTION_PAGE_CLASS);
    if (!root) {
        return;
    }

    const article = root.querySelector(`.${SOLUTION_BODY_CLASS}`);
    if (article) {
        article.querySelectorAll(`.${CODE_CLASS}`).forEach(unwrapCodeBlock);

        if (solutionByline) {
            document.body.appendChild(solutionByline);
        }
        [...article.childNodes].forEach((node) => {
            document.body.appendChild(node);
        });
    }

    root.remove();
    solutionByline = null;
    if (solutionTitle !== null) {
        document.title = solutionTitle;
        solutionTitle = null;
    }
}

// --- Page layout ----------------------------------------------------------

// Nodes that belong to the browser/extension rather than to the editorial, and
// so must stay put when the editorial is moved into its column
function isPageFurniture(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }
    if (node.id === "usaco-dark-toggle" || node.id.startsWith("MathJax")) {
        return true;
    }
    return ["SCRIPT", "STYLE", "LINK"].includes(node.tagName);
}

function buildSolutionLayout() {
    const article = document.createElement("article");
    article.className = SOLUTION_BODY_CLASS;

    // appendChild moves nodes rather than cloning them, so MathJax's references
    // to the spans it has typeset (or is about to) stay valid
    [...document.body.childNodes].forEach((node) => {
        if (!isPageFurniture(node)) {
            article.appendChild(node);
        }
    });

    solutionByline = extractByline(article);

    const root = document.createElement("div");
    root.className = SOLUTION_ROOT_CLASS;
    root.appendChild(buildHeader());
    root.appendChild(article);
    document.body.appendChild(root);

    return root;
}

// Editorials open with a bare "(Analysis by NAME)" text node directly inside
// <body>. Lift it out so it can sit in the header, above the spoiler blur.
function extractByline(article) {
    for (const node of article.childNodes) {
        const text = (node.textContent || "").trim();
        if (!text) {
            continue;
        }
        if (/^\(\s*analysis by[^)]*\)$/i.test(text)) {
            node.remove();
            return node;
        }
        return null;
    }
    return null;
}

const CONTEST_MONTHS = {
    jan: "January",
    feb: "February",
    mar: "March",
    apr: "April",
    nov: "November",
    dec: "December",
};

// sol_prob1_bronze_season26contest1.html -> {problem, division, contest}
function parseSolutionSlug() {
    const file = location.pathname.split("/").pop() || "";
    const match = file.match(
        /^sol_(.+?)_(bronze|silver|gold|platinum)_(.+)\.html$/i
    );
    if (!match) {
        return null;
    }
    return {
        problem: match[1].toLowerCase(),
        division: match[2].toLowerCase(),
        contest: match[3].toLowerCase(),
    };
}

function formatContest(contest) {
    let match = contest.match(/^season(\d{2})contest(\d+)$/);
    if (match) {
        return `20${match[1]} Contest ${match[2]}`;
    }
    match = contest.match(/^open(\d{2})$/);
    if (match) {
        return `20${match[1]} US Open`;
    }
    match = contest.match(/^([a-z]{3})(\d{2})$/);
    if (match && CONTEST_MONTHS[match[1]]) {
        return `${CONTEST_MONTHS[match[1]]} 20${match[2]}`;
    }
    return contest;
}

function formatProblem(problem) {
    const match = problem.match(/^prob(\d+)$/);
    if (match) {
        return `Problem ${match[1]}`;
    }
    return problem.charAt(0).toUpperCase() + problem.slice(1);
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildHeader() {
    const header = document.createElement("header");
    header.className = "busaco-solution-header";

    const slug = parseSolutionSlug();
    const heading = document.createElement("div");
    heading.className = "busaco-solution-heading";

    const title = document.createElement("h1");
    title.className = "busaco-solution-title";
    title.textContent = slug
        ? `${formatProblem(slug.problem)} · ${capitalize(slug.division)}`
        : "Solution";
    heading.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "busaco-solution-meta";
    const parts = [];
    if (slug) {
        parts.push(formatContest(slug.contest));
    }
    if (solutionByline) {
        // "(Analysis by Benjamin Qi)" -> "Analysis by Benjamin Qi"
        parts.push(solutionByline.textContent.trim().replace(/^\(|\)$/g, ""));
    }
    meta.textContent = parts.join(" · ");
    heading.appendChild(meta);

    // The contest token in the filename is also the results-page slug:
    // season26contest1 -> index.php?page=season26contest1results. Deriving the
    // link this way keeps the back link a pure string operation -- no request.
    if (slug) {
        const back = document.createElement("a");
        back.className = "busaco-solution-back";
        back.href = `/index.php?page=${slug.contest}results`;
        back.textContent = "← Problem list";
        header.appendChild(back);
    }

    header.appendChild(heading);

    // The page <title> is a useless "Contest Results" on every editorial
    if (slug) {
        solutionTitle = document.title;
        document.title = `${formatProblem(slug.problem)} (${capitalize(
            slug.division
        )}) — ${formatContest(slug.contest)}`;
    }

    return header;
}

// --- Spoiler guard --------------------------------------------------------

// The guard covers the code blocks only, not the prose. Opening an editorial is
// already a decision to read how the problem is solved; what you may still want
// to hold back is the implementation, so the write-up stays readable and each
// code block is revealed on its own.

function createRevealButton(wrapper) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "busaco-code-reveal";
    button.textContent = "Show code";
    button.addEventListener("click", () => {
        revealedCodeBlocks.add(wrapper);
        wrapper.classList.remove(CODE_HIDDEN_CLASS);
    });
    return button;
}

function updateSpoilerGuard(root, spoilerGuard) {
    root.querySelectorAll(`.${CODE_CLASS}`).forEach((wrapper) => {
        wrapper.classList.toggle(
            CODE_HIDDEN_CLASS,
            Boolean(spoilerGuard) && !revealedCodeBlocks.has(wrapper)
        );
    });
}

// --- Code blocks ----------------------------------------------------------

// Only <pre class="prettyprint"> holds source code; bare <pre> is used for
// ASCII diagrams and sample data, which must not be tokenized.
function enhanceCodeBlocks(root) {
    root.querySelectorAll("pre.prettyprint").forEach((pre) => {
        if (pre.closest(`.${CODE_CLASS}`)) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = CODE_CLASS;
        pre.parentNode.insertBefore(wrapper, pre);

        const language = detectLanguage(pre.textContent);
        wrapper.appendChild(buildCodeHeader(language, pre));
        wrapper.appendChild(pre);
        // Sibling of the <pre>, so it never lands in pre.textContent -- which
        // both unwrapCodeBlock() and the copy button read back as the source
        wrapper.appendChild(createRevealButton(wrapper));

        if (language) {
            highlightCode(pre, language);
        }
    });
}

function buildCodeHeader(language, pre) {
    const header = document.createElement("div");
    header.className = "busaco-code-header";

    const label = document.createElement("span");
    label.className = "busaco-code-lang";
    label.textContent = language ? LANGUAGES[language].label : "Code";

    header.appendChild(label);
    header.appendChild(createCopyButton(pre));
    return header;
}

function unwrapCodeBlock(wrapper) {
    const pre = wrapper.querySelector("pre");
    if (pre) {
        // Highlighting only wraps the source in spans without adding or
        // removing a single character, so textContent is the original code
        pre.replaceChildren(document.createTextNode(pre.textContent));
        wrapper.parentNode.insertBefore(pre, wrapper);
    }
    wrapper.remove();
}

// --- Syntax highlighting --------------------------------------------------

const CPP_KEYWORDS =
    "alignas alignof and and_eq asm break case catch class compl concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do else enum explicit export extern for friend goto if inline mutable namespace new noexcept not not_eq operator or or_eq private protected public register reinterpret_cast requires return sizeof static static_assert static_cast struct switch template this thread_local throw try typedef typeid typename union using virtual volatile while xor xor_eq";
const CPP_TYPES =
    "auto bool char char8_t char16_t char32_t double float int long short signed unsigned void wchar_t size_t string vector map set unordered_map unordered_set pair queue deque stack priority_queue array bitset tuple int64_t uint64_t i64 ll";
const CPP_LITERALS = "true false nullptr NULL";

const JAVA_KEYWORDS =
    "abstract assert break case catch class const continue default do else enum extends final finally for goto if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while var record yield sealed permits";
const JAVA_TYPES =
    "boolean byte char double float int long short void String Integer Long Double Boolean Character Object List ArrayList Map HashMap Set HashSet StringBuilder Arrays Collections Math Scanner BufferedReader";
const JAVA_LITERALS = "true false null";

const PYTHON_KEYWORDS =
    "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case";
const PYTHON_TYPES = "int str float bool list dict set tuple bytes complex";
const PYTHON_LITERALS = "True False None";
const PYTHON_BUILTINS =
    "abs all any enumerate filter input len map max min open print range reversed round sorted sum zip";

const CPP_COMMENT_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/y;
const C_STRING_RE = /"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/y;
const C_NUMBER_RE =
    /\b(?:0[xXbB][0-9a-fA-F']+|\d[\d']*(?:\.\d+)?(?:[eE][+-]?\d+)?)[uUlLfF]*/y;
const ANNOTATION_RE = /@[A-Za-z_][A-Za-z0-9_.]*/y;

const LANGUAGES = {
    cpp: {
        label: "C++",
        patterns: [
            { type: "com", re: CPP_COMMENT_RE },
            // Keep `#include <bits/stdc++.h>` as one token so the header path
            // is not chopped into operators; other directives take just the
            // keyword and let the rest tokenize normally.
            {
                type: "pre",
                re: /#[ \t]*include[ \t]*(?:<[^>\n]*>|"[^"\n]*")|#[ \t]*[A-Za-z_]+/y,
            },
            { type: "str", re: C_STRING_RE },
            { type: "num", re: C_NUMBER_RE },
        ],
        keywords: new Set(CPP_KEYWORDS.split(" ")),
        types: new Set(CPP_TYPES.split(" ")),
        literals: new Set(CPP_LITERALS.split(" ")),
        builtins: new Set(),
    },
    java: {
        label: "Java",
        patterns: [
            { type: "com", re: CPP_COMMENT_RE },
            { type: "dec", re: ANNOTATION_RE },
            { type: "str", re: C_STRING_RE },
            { type: "num", re: C_NUMBER_RE },
        ],
        keywords: new Set(JAVA_KEYWORDS.split(" ")),
        types: new Set(JAVA_TYPES.split(" ")),
        literals: new Set(JAVA_LITERALS.split(" ")),
        builtins: new Set(),
    },
    python: {
        label: "Python",
        patterns: [
            { type: "com", re: /#[^\n]*/y },
            { type: "dec", re: ANNOTATION_RE },
            {
                type: "str",
                re: /[rRbBuUfF]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*')/y,
            },
            {
                type: "num",
                re: /\b(?:0[xXbBoO][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[jJ]?/y,
            },
        ],
        keywords: new Set(PYTHON_KEYWORDS.split(" ")),
        types: new Set(PYTHON_TYPES.split(" ")),
        literals: new Set(PYTHON_LITERALS.split(" ")),
        builtins: new Set(PYTHON_BUILTINS.split(" ")),
    },
};

const WORD_RE = /[A-Za-z_$][A-Za-z0-9_$]*/y;
// A run of characters that can never begin a comment, string, number or word,
// emitted as plain text. Purely a fast path so the tokenizer is not walking
// punctuation one character at a time.
const PLAIN_RUN_RE = /[\s()[\]{};,.:+\-*%=<>!&|^~?]+/y;

// USACO editorials mix C++, Java and Python, and also use pre.prettyprint for
// language-agnostic pseudocode. Scoring beats first-match because some snippets
// are genuinely ambiguous -- `init = B // cB * cA + A` is Python integer
// division that would become a C++ comment if `//` were read greedily. When no
// language scores confidently we return null: plain text is always safe,
// highlighting as the wrong language is not.
function detectLanguage(code) {
    const scores = { cpp: 0, java: 0, python: 0 };

    if (/\bimport\s+java\./.test(code)) scores.java += 10;
    if (/\bpublic\s+(?:static\s+|final\s+)*class\b/.test(code))
        scores.java += 6;
    if (/\bSystem\.(?:out|err|in)\b/.test(code)) scores.java += 6;
    if (/\bpublic\s+static\s+void\s+main\b/.test(code)) scores.java += 6;

    if (/^[ \t]*#[ \t]*include\b/m.test(code)) scores.cpp += 10;
    if (/\busing\s+namespace\s+std\b/.test(code)) scores.cpp += 8;
    if (/\bstd::/.test(code)) scores.cpp += 5;
    if (/\b(?:cin|cout|endl|printf|scanf)\b/.test(code)) scores.cpp += 4;
    if (/\bint\s+main\s*\(/.test(code)) scores.cpp += 4;
    if (/\bvector\s*</.test(code)) scores.cpp += 3;

    if (/^[ \t]*def\s+\w+\s*\(.*\)\s*:/m.test(code)) scores.python += 8;
    if (/\b(?:elif|lambda)\b/.test(code)) scores.python += 5;
    if (/\binput\s*\(\s*\)/.test(code)) scores.python += 5;
    if (
        /^[ \t]*(?:if|for|while|else|elif|def|class|with|try|except)\b[^\n]*:[ \t]*$/m.test(
            code
        )
    ) {
        scores.python += 4;
    }
    if (/^[ \t]*(?:return|pass|continue|break)\b[^\n;]*$/m.test(code)) {
        scores.python += 2;
    }
    if (/^[ \t]*(?:from\s+[\w.]+\s+)?import\s+(?!java\b)/m.test(code)) {
        scores.python += 3;
    }

    const best = Object.keys(scores).reduce((a, b) =>
        scores[a] >= scores[b] ? a : b
    );
    return scores[best] >= 5 ? best : null;
}

function classifyWord(word, spec, source, end) {
    if (spec.keywords.has(word)) {
        return "kw";
    }
    if (spec.types.has(word)) {
        return "type";
    }
    if (spec.literals.has(word)) {
        return "lit";
    }
    if (spec.builtins.has(word)) {
        return "fn";
    }

    let index = end;
    while (source[index] === " " || source[index] === "\t") {
        index += 1;
    }
    return source[index] === "(" ? "fn" : null;
}

function tokenizeCode(source, language) {
    const spec = LANGUAGES[language];
    const tokens = [];
    let index = 0;

    while (index < source.length) {
        let matched = null;

        for (const rule of spec.patterns) {
            rule.re.lastIndex = index;
            const result = rule.re.exec(source);
            if (result && result[0]) {
                matched = { type: rule.type, text: result[0] };
                break;
            }
        }

        if (!matched) {
            WORD_RE.lastIndex = index;
            const word = WORD_RE.exec(source);
            if (word) {
                matched = {
                    type: classifyWord(
                        word[0],
                        spec,
                        source,
                        index + word[0].length
                    ),
                    text: word[0],
                };
            }
        }

        if (!matched) {
            PLAIN_RUN_RE.lastIndex = index;
            const run = PLAIN_RUN_RE.exec(source);
            matched = {
                type: null,
                text: run && run[0] ? run[0] : source[index],
            };
        }

        tokens.push(matched);
        index += matched.text.length;
    }

    return tokens;
}

function highlightCode(pre, language) {
    const fragment = document.createDocumentFragment();
    let plain = "";

    const flush = () => {
        if (plain) {
            fragment.appendChild(document.createTextNode(plain));
            plain = "";
        }
    };

    tokenizeCode(pre.textContent, language).forEach(({ type, text }) => {
        if (!type) {
            plain += text;
            return;
        }
        flush();
        const span = document.createElement("span");
        span.className = `busaco-tok-${type}`;
        span.textContent = text;
        fragment.appendChild(span);
    });
    flush();

    pre.replaceChildren(fragment);
}
